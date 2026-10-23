import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import app from "../src/app.js";
import prisma from "../src/db/prisma.js";

let server;
let baseUrl;
let isDbAvailable = false;

// Shared test entities
let testUser;
let testSalesOrder;
let testProduct;
let testBOMRevision;
let testWorkOrder;
let testInspection;

const authHeaders = (role = "ADMIN", userId = 1) => ({
  "Content-Type": "application/json",
  "x-mock-role": role,
  "x-mock-user-id": String(userId),
  "x-mock-user-name": "Test ERP Officer",
});

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    await prisma.$connect();
    isDbAvailable = true;

    testUser = await prisma.user.findFirst();
    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          name: "Test Admin",
          email: `test-${Date.now()}@yashgroup.com`,
          passwordHash: "dummyhash",
          role: "ADMIN",
        },
      });
    }

    testProduct = await prisma.product.findFirst();
    if (!testProduct) {
      const category = (await prisma.category.findFirst()) ||
        (await prisma.category.create({
          data: { name: "Test Category", type: "FINISHED_GOOD" },
        }));
      testProduct = await prisma.product.create({
        data: {
          name: "Chemical Earthing Electrode 50mm",
          sku: `TEST-ELECTRODE-${Date.now()}`,
          categoryId: category.id,
          unit: "NOS",
        },
      });
    }

    testSalesOrder = await prisma.salesOrder.findFirst();
    if (!testSalesOrder) {
      const customer = (await prisma.customer.findFirst()) ||
        (await prisma.customer.create({
          data: { companyName: "Test Infrastructure Ltd", contactPerson: "Test Client" },
        }));
      testSalesOrder = await prisma.salesOrder.create({
        data: {
          orderNumber: `SO-TEST-${Date.now()}`,
          customerId: customer.id,
          createdById: testUser.id,
          totalAmount: 50000,
          status: "CONFIRMED",
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
          revision: "REV-01",
          status: "RELEASED",
        },
      });
    }
  } catch {
    isDbAvailable = false;
    // Database credentials need to be set in backend/.env for live db testing
  }
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  if (isDbAvailable) {
    try {
      await prisma.$disconnect();
    } catch {
      // Ignore disconnect error in cleanup
    }
  }
});

// ===================== 1. AUTHENTICATION & SECURITY =====================

test("Production-Quality Module rejects unauthenticated requests with 401", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/planning/dashboard`);
  const body = await res.json();

  assert.equal(res.status, 401);
  assert.equal(body.success, false);
});

test("Production-Quality Module rejects unauthorized roles with 403", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/work-orders`, {
    method: "POST",
    headers: authHeaders("SALES_CONSULTANT"),
    body: JSON.stringify({
      salesOrderId: 1,
      productId: 1,
      plannedQuantity: 100,
    }),
  });
  const body = await res.json();

  assert.equal(res.status, 403);
  assert.equal(body.success, false);
});

test("Validation rejects invalid inputs with 400 and structured error array", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/work-orders`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER"),
    body: JSON.stringify({
      salesOrderId: -5,
      productId: "invalid",
      plannedQuantity: -10,
    }),
  });
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.success, false);
  assert.ok(Array.isArray(body.errors));
});

test("Validation rejects negative transfer quantities with 400", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/manufacturing/outputs/1/transfer-to-quality`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER"),
    body: JSON.stringify({
      quantity: -5,
    }),
  });
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.success, false);
  assert.ok(Array.isArray(body.errors));
});

test("Validation rejects invalid inspection decisions with 400", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/quality/finished-goods-releases`, {
    method: "POST",
    headers: authHeaders("QUALITY_INSPECTOR"),
    body: JSON.stringify({
      inspectionId: "not-a-number",
    }),
  });
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.success, false);
  assert.ok(Array.isArray(body.errors));
});

// ===================== 2. M4.1 PLANNING & WORK ORDERS =====================

test("GET /planning/dashboard returns dashboard metrics", async (t) => {
  if (!isDbAvailable) {
    t.skip("Live database not connected. Configure DATABASE_URL in backend/.env to run DB queries.");
    return;
  }

  const res = await fetch(`${baseUrl}/api/production-quality/planning/dashboard`, {
    headers: authHeaders("PRODUCTION_MANAGER"),
  });
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.ok(body.data.metrics);
});

test("GET /production-calendar returns schedule array", async (t) => {
  if (!isDbAvailable) {
    t.skip("Live database not connected.");
    return;
  }

  const res = await fetch(`${baseUrl}/api/production-quality/production-calendar`, {
    headers: authHeaders("PRODUCTION_MANAGER"),
  });
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.data));
});

test("POST /work-orders creates a Work Order with auto-generated WO number", async (t) => {
  if (!isDbAvailable || !testSalesOrder || !testProduct) {
    t.skip("Live database not connected or test master data not found.");
    return;
  }

  const res = await fetch(`${baseUrl}/api/production-quality/work-orders`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER", testUser.id),
    body: JSON.stringify({
      salesOrderId: testSalesOrder.id,
      productId: testProduct.id,
      plannedQuantity: 50,
      bomRevisionId: testBOMRevision.id,
      priority: "HIGH",
      assignedLine: "Test production line",
      notes: "Test automated production batch",
    }),
  });
  const body = await res.json();

  assert.equal(res.status, 201);
  assert.equal(body.success, true);
  assert.ok(body.data.workOrderNo.startsWith("WO-"));
  assert.equal(body.data.status, "DRAFT");
  assert.equal(Number(body.data.plannedQuantity), 50);
  assert.equal(body.data.assignedLine, "Test production line");

  testWorkOrder = body.data;

  const dashboardRes = await fetch(`${baseUrl}/api/production-quality/manufacturing/dashboard`, {
    headers: authHeaders("PRODUCTION_MANAGER"),
  });
  const dashboardBody = await dashboardRes.json();
  assert.equal(dashboardRes.status, 200);
  assert.ok(
    dashboardBody.data.activeWorkOrders.some((order) => order.id === testWorkOrder.id),
    "Assigned draft work order should appear in shop-floor tracking"
  );
});

test("Work Order lifecycle: DRAFT -> PLANNED (submit & approve) -> RELEASED", async (t) => {
  if (!testWorkOrder) {
    t.skip("No test work order created");
    return;
  }

  // Submit
  const submitRes = await fetch(`${baseUrl}/api/production-quality/work-orders/${testWorkOrder.id}/submit`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER", testUser.id),
  });
  const submitBody = await submitRes.json();
  assert.equal(submitRes.status, 200);
  assert.equal(submitBody.data.status, "PLANNED");

  // Approve
  const approveRes = await fetch(`${baseUrl}/api/production-quality/work-orders/${testWorkOrder.id}/approve`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER", testUser.id),
  });
  const approveBody = await approveRes.json();
  assert.equal(approveRes.status, 200);
  assert.equal(approveBody.data.status, "PLANNED");

  // Hold & Resume
  const holdRes = await fetch(`${baseUrl}/api/production-quality/work-orders/${testWorkOrder.id}/hold`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER", testUser.id),
    body: JSON.stringify({ reason: "Material staging in progress" }),
  });
  const holdBody = await holdRes.json();
  assert.equal(holdRes.status, 200);
  assert.equal(holdBody.data.status, "MATERIAL_HOLD");

  const resumeRes = await fetch(`${baseUrl}/api/production-quality/work-orders/${testWorkOrder.id}/resume`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER", testUser.id),
  });
  const resumeBody = await resumeRes.json();
  assert.equal(resumeRes.status, 200);
  assert.equal(resumeBody.data.status, "RELEASED");
  testWorkOrder.status = "RELEASED";
});

// ===================== 3. M4.2 MANUFACTURING =====================

test("GET /manufacturing/dashboard returns manufacturing operational metrics", async (t) => {
  if (!isDbAvailable) {
    t.skip("Live database not connected.");
    return;
  }

  const res = await fetch(`${baseUrl}/api/production-quality/manufacturing/dashboard`, {
    headers: authHeaders("PRODUCTION_MANAGER"),
  });
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.ok(body.data.metrics);
});

test("POST /manufacturing/work-orders/:id/start starts manufacturing execution", async (t) => {
  if (!testWorkOrder) {
    t.skip("No test work order");
    return;
  }

  const res = await fetch(`${baseUrl}/api/production-quality/manufacturing/work-orders/${testWorkOrder.id}/start`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER", testUser.id),
    body: JSON.stringify({
      shift: "SHIFT_A",
      workCenter: "WC-ELECTRODE-ASSEMBLY-01",
      notes: "Starting shift batch",
    }),
  });
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.status, "IN_PROGRESS");
  assert.ok(body.data.actualStart);
  testWorkOrder.status = "IN_PROGRESS";
});

test("POST /manufacturing/production-entries records shift production output", async (t) => {
  if (!testWorkOrder) {
    t.skip("No test work order");
    return;
  }

  const res = await fetch(`${baseUrl}/api/production-quality/manufacturing/production-entries`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER", testUser.id),
    body: JSON.stringify({
      workOrderId: testWorkOrder.id,
      quantityProduced: 25,
      shift: "SHIFT_A",
      workCenter: "WC-ELECTRODE-ASSEMBLY-01",
      notes: "First half shift completed",
    }),
  });
  const body = await res.json();

  assert.equal(res.status, 201);
  assert.equal(body.success, true);
  assert.equal(body.data.goodQuantity, 25);
});

test("POST /manufacturing/downtime and delays log operational events", async (t) => {
  if (!testWorkOrder) {
    t.skip("No test work order");
    return;
  }

  const dtRes = await fetch(`${baseUrl}/api/production-quality/manufacturing/downtime`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER", testUser.id),
    body: JSON.stringify({
      workOrderId: testWorkOrder.id,
      machineOrWorkCenter: "Cutting Saw #2",
      durationMinutes: 15,
      reason: "Blade replacement",
    }),
  });
  assert.equal(dtRes.status, 201);

  const delayRes = await fetch(`${baseUrl}/api/production-quality/manufacturing/delays`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER", testUser.id),
    body: JSON.stringify({
      workOrderId: testWorkOrder.id,
      reason: "Crane maintenance delay",
      impactMinutes: 10,
    }),
  });
  assert.equal(delayRes.status, 201);
});

test("POST /manufacturing/outputs/:id/transfer-to-quality transfers output to QC", async (t) => {
  if (!testWorkOrder) {
    t.skip("No test work order");
    return;
  }

  const res = await fetch(`${baseUrl}/api/production-quality/manufacturing/outputs/${testWorkOrder.id}/transfer-to-quality`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER", testUser.id),
    body: JSON.stringify({
      quantity: 20,
      batchNumber: "BATCH-TEST-001",
      notes: "Transferring for dimensional and coating inspection",
    }),
  });
  const body = await res.json();

  assert.equal(res.status, 201);
  assert.equal(body.success, true);
  assert.ok(body.data.inspectionNo.startsWith("QI-"));
  assert.equal(body.data.status, "PENDING");
  assert.equal(Number(body.data.inspectedQuantity), 20);

  testInspection = body.data;
});

// ===================== 4. M4.3 QUALITY CONTROL & FG RELEASE =====================

test("GET /quality/dashboard and /quality/inspection-queue return queue", async (t) => {
  if (!isDbAvailable) {
    t.skip("Live database not connected.");
    return;
  }

  const res = await fetch(`${baseUrl}/api/production-quality/quality/dashboard`, {
    headers: authHeaders("QUALITY_INSPECTOR"),
  });
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.ok(body.data.metrics);
  assert.ok(Array.isArray(body.data.queue));
});

test("POST /quality/inspections/:id/results records inspection measurements", async (t) => {
  if (!testInspection) {
    t.skip("No test inspection created");
    return;
  }

  const res = await fetch(`${baseUrl}/api/production-quality/quality/inspections/${testInspection.id}/results`, {
    method: "POST",
    headers: authHeaders("QUALITY_INSPECTOR", testUser.id),
    body: JSON.stringify({
      acceptedQuantity: 20,
      rejectedQuantity: 0,
      measurements: {
        dimensional: [
          { parameter: "Outer Diameter", specified: "50mm", measured: "50.1mm", status: "PASS" },
          { parameter: "Length", specified: "3000mm", measured: "3002mm", status: "PASS" },
        ],
        visual: [
          { check: "Copper Coating Uniformity", result: "Uniform, no pits", status: "PASS" },
        ],
      },
      evidenceNotes: "All sample parameters within IS 3043 specifications.",
    }),
  });
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.status, "PASS");
  assert.equal(Number(body.data.acceptedQuantity), 20);
});

test("POST /quality/finished-goods-releases releases accepted output to FG inventory", async (t) => {
  if (!testInspection) {
    t.skip("No test inspection created");
    return;
  }

  const res = await fetch(`${baseUrl}/api/production-quality/quality/finished-goods-releases`, {
    method: "POST",
    headers: authHeaders("QUALITY_INSPECTOR", testUser.id),
    body: JSON.stringify({
      inspectionId: testInspection.id,
      warehouseLocation: "FG Bay 3",
      batchNumber: "BATCH-TEST-001",
      notes: "Cleared for dispatch staging",
    }),
  });
  const body = await res.json();

  assert.equal(res.status, 201);
  assert.equal(body.success, true);
  assert.equal(body.data.inspection.status, "RELEASED");
  assert.equal(body.data.releaseQuantity, 20);
  assert.ok(body.data.inventoryMovement);
});

test("Finished Goods Release is IDEMPOTENT: duplicate release returns 409 Conflict", async (t) => {
  if (!testInspection) {
    t.skip("No test inspection created");
    return;
  }

  const res = await fetch(`${baseUrl}/api/production-quality/quality/finished-goods-releases`, {
    method: "POST",
    headers: authHeaders("QUALITY_INSPECTOR", testUser.id),
    body: JSON.stringify({
      inspectionId: testInspection.id,
      warehouseLocation: "FG Bay 3",
    }),
  });
  const body = await res.json();

  assert.equal(res.status, 409);
  assert.equal(body.success, false);
  assert.match(body.message, /already been released/);
});

test("Audit history tracks work order mutations", async (t) => {
  if (!testWorkOrder) {
    t.skip("No test work order");
    return;
  }

  const res = await fetch(`${baseUrl}/api/production-quality/work-orders/${testWorkOrder.id}/history`, {
    headers: authHeaders("PRODUCTION_MANAGER"),
  });
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.data));
  assert.ok(body.data.length > 0);
});
