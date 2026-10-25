import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import app from "../src/app.js";
import prisma from "../src/db/prisma.js";

let server;
let baseUrl;
let testUser;
let testProduct;
let testSalesOrder;
let testBOMRevision;

const authHeaders = (role = "ADMIN", userId = 1) => ({
  "Content-Type": "application/json",
  "x-mock-role": role,
  "x-mock-user-id": String(userId),
  "x-mock-user-name": "Test ERP Admin",
});

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  await prisma.$connect();

  testUser = await prisma.user.findFirst();
  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        name: "Test Admin",
        email: `admin-${Date.now()}@yashgroup.com`,
        passwordHash: "dummyhash",
        role: "ADMIN",
      },
    });
  }

  testProduct = await prisma.product.findFirst();
  if (!testProduct) {
    const category = (await prisma.category.findFirst()) ||
      (await prisma.category.create({
        data: { name: "Earthing Electrodes", code: "EE" },
      }));

    testProduct = await prisma.product.create({
      data: {
        sku: `FG-TEST-ROD-${Date.now()}`,
        name: "Pure Copper Earth Rod 3m 17mm",
        unitOfMeasure: "NOS",
        categoryId: category.id,
      },
    });
  }

  testBOMRevision = await prisma.bOMRevision.findFirst({
    where: { productId: testProduct.id },
  });
  if (!testBOMRevision) {
    testBOMRevision = await prisma.bOMRevision.create({
      data: {
        productId: testProduct.id,
        revision: "Rev 1.0",
        status: "APPROVED",
      },
    });
  }

  testSalesOrder = await prisma.salesOrder.findFirst();
  if (!testSalesOrder) {
    let customer = await prisma.customer.findFirst();
    if (!customer) {
      customer = await prisma.customer.create({
        data: { name: "Test EPC Client Ltd", code: `CUST-${Date.now()}` },
      });
    }
    testSalesOrder = await prisma.salesOrder.create({
      data: {
        orderNumber: `SO-TEST-${Date.now()}`,
        customerId: customer.id,
        totalAmount: 50000,
        status: "CONFIRMED",
      },
    });
  }
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
});

// Helper to create a work order
async function createWorkOrder(plannedQuantity = 100, assignedLine = "Line A") {
  const woNo = `WO-TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  return await prisma.workOrder.create({
    data: {
      workOrderNo: woNo,
      salesOrderId: testSalesOrder.id,
      bomRevisionId: testBOMRevision.id,
      plannedQuantity,
      goodQuantity: 0,
      rejectedQuantity: 0,
      status: "RELEASED",
      assignedLine,
    },
    include: {
      bomRevision: { select: { product: true } },
    },
  });
}

test("1 & 2. 100% completed untransferred batch appears at top; incomplete batch does not appear in readyForQualityOrders", async () => {
  // Create an incomplete work order (40/100)
  const incompleteWO = await createWorkOrder(100);
  await prisma.workOrder.update({
    where: { id: incompleteWO.id },
    data: {
      status: "IN_PROGRESS",
      goodQuantity: 40,
    },
  });

  // Create a 100% completed untransferred work order (50/50)
  const completedWO = await createWorkOrder(50);
  await prisma.workOrder.update({
    where: { id: completedWO.id },
    data: {
      status: "COMPLETED",
      goodQuantity: 50,
      actualEnd: new Date("2026-10-20T10:00:00Z"),
    },
  });

  const res = await fetch(`${baseUrl}/api/production-quality/manufacturing/dashboard`, {
    headers: authHeaders("PRODUCTION_MANAGER", testUser.id),
  });
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.success, true);

  // Ready for quality section check
  const readyList = body.data.readyForQualityOrders || [];
  assert.ok(readyList.some((wo) => wo.id === completedWO.id), "Completed WO must be in readyForQualityOrders");
  assert.ok(!readyList.some((wo) => wo.id === incompleteWO.id), "Incomplete WO must NOT be in readyForQualityOrders");

  // Priority sorting check: completed untransferred should have priorityTier 1 and appear before incomplete
  const activeOrders = body.data.activeWorkOrders || [];
  const compIndex = activeOrders.findIndex((o) => o.id === completedWO.id);
  const incompIndex = activeOrders.findIndex((o) => o.id === incompleteWO.id);
  assert.ok(compIndex < incompIndex, "100% completed untransferred WO must appear before incomplete WO");
});

test("3. A batch with zero planned quantity cannot be transferred", async () => {
  const zeroWO = await createWorkOrder(0);

  const res = await fetch(`${baseUrl}/api/production-quality/manufacturing/outputs/${zeroWO.id}/transfer-to-quality`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER", testUser.id),
    body: JSON.stringify({}),
  });
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.success, false);
  assert.match(body.message, /planned quantity must be greater than zero/i);
});

test("4. A batch with rejected units is eligible only when good production quantity satisfies completion requirement", async () => {
  // Planned: 100, Produced: 90 Good + 20 Rejected = 110 total produced, but only 90 good (< 100)
  const woWithScrap = await createWorkOrder(100);
  await prisma.workOrder.update({
    where: { id: woWithScrap.id },
    data: {
      status: "IN_PROGRESS",
      goodQuantity: 90,
      rejectedQuantity: 20,
    },
  });

  const dashRes = await fetch(`${baseUrl}/api/production-quality/manufacturing/dashboard`, {
    headers: authHeaders("PRODUCTION_MANAGER", testUser.id),
  });
  const dashBody = await dashRes.json();
  const readyList = dashBody.data.readyForQualityOrders || [];
  assert.ok(!readyList.some((o) => o.id === woWithScrap.id), "90 good / 100 planned must NOT be eligible even with 20 scrap");

  // Now record 10 more good units -> goodQuantity = 100 (= planned)
  await prisma.workOrder.update({
    where: { id: woWithScrap.id },
    data: {
      status: "COMPLETED",
      goodQuantity: 100,
    },
  });

  const dashRes2 = await fetch(`${baseUrl}/api/production-quality/manufacturing/dashboard`, {
    headers: authHeaders("PRODUCTION_MANAGER", testUser.id),
  });
  const dashBody2 = await dashRes2.json();
  const readyList2 = dashBody2.data.readyForQualityOrders || [];
  assert.ok(readyList2.some((o) => o.id === woWithScrap.id), "Now 100 good units satisfy the completion requirement");
});

test("5 & 6. Partial batch transfer is rejected; completed batch can be transferred in full in one operation", async () => {
  const wo = await createWorkOrder(80);
  await prisma.workOrder.update({
    where: { id: wo.id },
    data: {
      status: "COMPLETED",
      goodQuantity: 80,
    },
  });

  // Try partial transfer: 40 out of 80 -> Must be rejected with 400
  const partialRes = await fetch(`${baseUrl}/api/production-quality/manufacturing/outputs/${wo.id}/transfer-to-quality`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER", testUser.id),
    body: JSON.stringify({ quantity: 40 }),
  });
  const partialBody = await partialRes.json();
  assert.equal(partialRes.status, 400);
  assert.equal(partialBody.success, false);
  assert.match(partialBody.message, /partial batch transfers are not allowed/i);

  // Transfer full batch (80)
  const fullRes = await fetch(`${baseUrl}/api/production-quality/manufacturing/outputs/${wo.id}/transfer-to-quality`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER", testUser.id),
    body: JSON.stringify({
      quantity: 80,
      notes: "Full batch transfer",
    }),
  });
  const fullBody = await fullRes.json();
  assert.equal(fullRes.status, 201);
  assert.equal(fullBody.success, true);
  assert.equal(Number(fullBody.data.inspectedQuantity), 80);
  assert.equal(fullBody.data.status, "PENDING_ASSIGNMENT");
});

test("7. A batch already transferred cannot be transferred again (duplicate transfer prevented)", async () => {
  const wo = await createWorkOrder(60);
  await prisma.workOrder.update({
    where: { id: wo.id },
    data: {
      status: "COMPLETED",
      goodQuantity: 60,
    },
  });

  // Transfer 1st time
  const res1 = await fetch(`${baseUrl}/api/production-quality/manufacturing/outputs/${wo.id}/transfer-to-quality`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER", testUser.id),
    body: JSON.stringify({ quantity: 60 }),
  });
  assert.equal(res1.status, 201);

  // Attempt transfer 2nd time -> Must be rejected with 400
  const res2 = await fetch(`${baseUrl}/api/production-quality/manufacturing/outputs/${wo.id}/transfer-to-quality`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER", testUser.id),
    body: JSON.stringify({ quantity: 60 }),
  });
  const body2 = await res2.json();
  assert.equal(res2.status, 400);
  assert.equal(body2.success, false);
  assert.match(body2.message, /already been transferred/i);
});

test("8. Two simultaneous transfer requests cannot create duplicate transfers", async () => {
  const wo = await createWorkOrder(75);
  await prisma.workOrder.update({
    where: { id: wo.id },
    data: {
      status: "COMPLETED",
      goodQuantity: 75,
    },
  });

  // Fire two simultaneous requests
  const [resA, resB] = await Promise.all([
    fetch(`${baseUrl}/api/production-quality/manufacturing/outputs/${wo.id}/transfer-to-quality`, {
      method: "POST",
      headers: authHeaders("PRODUCTION_MANAGER", testUser.id),
      body: JSON.stringify({ quantity: 75 }),
    }),
    fetch(`${baseUrl}/api/production-quality/manufacturing/outputs/${wo.id}/transfer-to-quality`, {
      method: "POST",
      headers: authHeaders("PRODUCTION_MANAGER", testUser.id),
      body: JSON.stringify({ quantity: 75 }),
    }),
  ]);

  const statuses = [resA.status, resB.status];
  assert.ok(statuses.includes(201), "One request must succeed with 201");
  assert.ok(statuses.includes(400), "The duplicate request must be rejected with 400");

  // Verify only 1 QualityInspection record exists in database
  const inspections = await prisma.qualityInspection.findMany({
    where: { workOrderId: wo.id },
  });
  assert.equal(inspections.length, 1, "Exactly one inspection lot must be created");
});

test("9 & 10. After transfer, batch appears in Quality Inspection queue and no longer appears as awaiting transfer", async () => {
  const wo = await createWorkOrder(90);
  await prisma.workOrder.update({
    where: { id: wo.id },
    data: {
      status: "COMPLETED",
      goodQuantity: 90,
    },
  });

  // Transfer to Quality
  const transRes = await fetch(`${baseUrl}/api/production-quality/manufacturing/outputs/${wo.id}/transfer-to-quality`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER", testUser.id),
    body: JSON.stringify({ quantity: 90 }),
  });
  assert.equal(transRes.status, 201);
  const transferData = (await transRes.json()).data;

  // 9. Appears in Quality Inspection queue
  const queueRes = await fetch(`${baseUrl}/api/production-quality/quality/inspection-queue`, {
    headers: authHeaders("QUALITY_INSPECTOR", testUser.id),
  });
  const queueBody = await queueRes.json();
  assert.equal(queueRes.status, 200);
  const inQueue = (queueBody.data || []).some((item) => item.id === transferData.id || item.workOrderId === wo.id);
  assert.ok(inQueue, "Transferred batch must appear in Quality Inspection Queue");

  // 10. No longer appears in readyForQualityOrders on dashboard
  const dashRes = await fetch(`${baseUrl}/api/production-quality/manufacturing/dashboard`, {
    headers: authHeaders("PRODUCTION_MANAGER", testUser.id),
  });
  const dashBody = await dashRes.json();
  const readyList = dashBody.data.readyForQualityOrders || [];
  assert.ok(!readyList.some((o) => o.id === wo.id), "Transferred batch must NO LONGER appear in readyForQualityOrders");

  // Check priorityTier has moved to 4 (Transferred to Quality)
  const activeOrders = dashBody.data.activeWorkOrders || [];
  const updatedWO = activeOrders.find((o) => o.id === wo.id);
  if (updatedWO) {
    assert.equal(updatedWO.priorityTier, 4, "Transferred WO priority tier must be 4");
  }
});

test("11. Manual completion updates the sorting and eligibility correctly", async () => {
  const wo = await createWorkOrder(30);

  // Initial state: 0 completed -> Tier 3 (Not Started), not eligible
  let dashRes = await fetch(`${baseUrl}/api/production-quality/manufacturing/dashboard`, {
    headers: authHeaders("PRODUCTION_MANAGER", testUser.id),
  });
  let dashBody = await dashRes.json();
  let found = dashBody.data.activeWorkOrders.find((o) => o.id === wo.id);
  assert.equal(found?.priorityTier, 3, "Initial tier must be 3 (Not Started)");

  // Complete partially: 15 / 30 -> Tier 2 (In Production)
  await fetch(`${baseUrl}/api/production-quality/work-orders/${wo.id}/completion`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER", testUser.id),
    body: JSON.stringify({
      quantityCompleted: 15,
      completionDate: "2026-10-24",
    }),
  });

  dashRes = await fetch(`${baseUrl}/api/production-quality/manufacturing/dashboard`, {
    headers: authHeaders("PRODUCTION_MANAGER", testUser.id),
  });
  dashBody = await dashRes.json();
  found = dashBody.data.activeWorkOrders.find((o) => o.id === wo.id);
  assert.equal(found?.priorityTier, 2, "Partial completion must move tier to 2 (In Production)");
  assert.equal(found?.isReadyForQC, false);

  // Complete remainder: +15 -> 30/30 (100% complete) -> Tier 1 (Ready for Quality Inspection)
  await fetch(`${baseUrl}/api/production-quality/work-orders/${wo.id}/completion`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER", testUser.id),
    body: JSON.stringify({
      quantityCompleted: 15,
      completionDate: "2026-10-24",
    }),
  });

  dashRes = await fetch(`${baseUrl}/api/production-quality/manufacturing/dashboard`, {
    headers: authHeaders("PRODUCTION_MANAGER", testUser.id),
  });
  dashBody = await dashRes.json();
  found = dashBody.data.activeWorkOrders.find((o) => o.id === wo.id);
  assert.equal(found?.priorityTier, 1, "100% completion must move tier to 1 (Ready for Quality Inspection)");
  assert.equal(found?.isReadyForQC, true);
  assert.ok(
    dashBody.data.readyForQualityOrders.some((o) => o.id === wo.id),
    "Must now appear in readyForQualityOrders"
  );
});

test("12. Cancelled and on-hold work orders cannot be transferred", async () => {
  // Cancelled work order
  const cancelledWO = await createWorkOrder(40);
  await prisma.workOrder.update({
    where: { id: cancelledWO.id },
    data: { status: "CANCELLED", goodQuantity: 40 },
  });

  const cancelRes = await fetch(`${baseUrl}/api/production-quality/manufacturing/outputs/${cancelledWO.id}/transfer-to-quality`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER", testUser.id),
    body: JSON.stringify({ quantity: 40 }),
  });
  assert.equal(cancelRes.status, 400);
  const cancelBody = await cancelRes.json();
  assert.match(cancelBody.message, /cannot transfer a cancelled work order/i);

  // On-hold work order
  const holdWO = await createWorkOrder(40);
  await prisma.workOrder.update({
    where: { id: holdWO.id },
    data: { status: "MATERIAL_HOLD", goodQuantity: 40 },
  });

  const holdRes = await fetch(`${baseUrl}/api/production-quality/manufacturing/outputs/${holdWO.id}/transfer-to-quality`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER", testUser.id),
    body: JSON.stringify({ quantity: 40 }),
  });
  assert.equal(holdRes.status, 400);
  const holdBody = await holdRes.json();
  assert.match(holdBody.message, /cannot transfer work order in.*status/i);
});
