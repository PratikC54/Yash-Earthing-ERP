import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import app from "../src/app.js";
import prisma from "../src/db/prisma.js";
import { WORK_ORDER_STATUS } from "../src/features/production-quality/shared/productionQuality.constants.js";

let server;
let baseUrl;
let testSalesOrder;
let testBOMRevision;

const authHeaders = (role = "ADMIN", userId = 1) => ({
  "Content-Type": "application/json",
  "x-mock-role": role,
  "x-mock-user-id": String(userId),
  "x-mock-user-name": "Production Manager",
});

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  await prisma.$connect();

  testSalesOrder = await prisma.salesOrder.findFirst();
  testBOMRevision = await prisma.bOMRevision.findFirst();
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await prisma.$disconnect();
});

test("1. On Hold Status: Dashboard counter matches the exact records in activeWorkOrders on hold", async () => {
  const ts = Date.now();
  // Create 1 MATERIAL_HOLD and 1 QC_HOLD work order assigned to shop floor
  const woHold1 = await prisma.workOrder.create({
    data: {
      workOrderNo: `WO-HOLD-M-${ts}`,
      status: WORK_ORDER_STATUS.MATERIAL_HOLD,
      salesOrderId: testSalesOrder.id,
      bomRevisionId: testBOMRevision?.id,
      assignedLine: "Line A",
      plannedQuantity: 50,
      goodQuantity: 0,
      priority: "HIGH",
    },
  });

  const woHold2 = await prisma.workOrder.create({
    data: {
      workOrderNo: `WO-HOLD-Q-${ts}`,
      status: WORK_ORDER_STATUS.QC_HOLD,
      salesOrderId: testSalesOrder.id,
      bomRevisionId: testBOMRevision?.id,
      assignedLine: "Line B",
      plannedQuantity: 60,
      goodQuantity: 10,
      priority: "MEDIUM",
    },
  });

  const res = await fetch(`${baseUrl}/api/production-quality/manufacturing/dashboard`, {
    headers: authHeaders(),
  });
  assert.strictEqual(res.status, 200);
  const json = await res.json();
  const data = json.data;

  const ordersOnHold = data.activeWorkOrders.filter(
    (wo) => wo.isHold || wo.effectiveStatus === "ON_HOLD" || ["MATERIAL_HOLD", "QC_HOLD", "ON_HOLD"].includes(wo.status)
  );

  // Dashboard counter MUST match exact count of records returned
  assert.strictEqual(
    data.metrics.onHoldCount,
    ordersOnHold.length,
    "Dashboard metrics.onHoldCount must strictly equal the count of on-hold work orders"
  );

  const foundHold1 = data.activeWorkOrders.find((w) => w.id === woHold1.id);
  assert.ok(foundHold1, "MATERIAL_HOLD work order must be present in activeWorkOrders");
  assert.strictEqual(foundHold1.isHold, true);
  assert.strictEqual(foundHold1.effectiveStatus, "ON_HOLD");

  const foundHold2 = data.activeWorkOrders.find((w) => w.id === woHold2.id);
  assert.ok(foundHold2, "QC_HOLD work order must be present in activeWorkOrders");
  assert.strictEqual(foundHold2.isHold, true);
  assert.strictEqual(foundHold2.effectiveStatus, "ON_HOLD");
});

test("2. Interrupted Distinction: Machine downtime does not mark an order as On Hold unless status is hold", async () => {
  const ts = Date.now();
  const woRunning = await prisma.workOrder.create({
    data: {
      workOrderNo: `WO-INT-${ts}`,
      status: WORK_ORDER_STATUS.IN_PROGRESS,
      salesOrderId: testSalesOrder.id,
      bomRevisionId: testBOMRevision?.id,
      assignedLine: "Line A",
      plannedQuantity: 100,
      goodQuantity: 40,
      priority: "HIGH",
    },
  });

  // Record downtime for this work order
  const dtRes = await fetch(`${baseUrl}/api/production-quality/manufacturing/downtime`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      workOrderId: woRunning.id,
      machineOrWorkCenter: "Line A · Continuous Coating",
      durationMinutes: 45,
      reason: "Mechanical Breakdown",
      notes: "Bearing replacement",
    }),
  });
  assert.strictEqual(dtRes.status, 201);

  const res = await fetch(`${baseUrl}/api/production-quality/manufacturing/dashboard`, {
    headers: authHeaders(),
  });
  assert.strictEqual(res.status, 200);
  const json = await res.json();
  const data = json.data;

  const foundOrder = data.activeWorkOrders.find((w) => w.id === woRunning.id);
  assert.ok(foundOrder, "Running order with downtime must be in activeWorkOrders");
  assert.strictEqual(foundOrder.isInterrupted, true, "isInterrupted must be true");
  assert.strictEqual(foundOrder.isHold, false, "isHold must be false for running order with downtime");
  assert.strictEqual(foundOrder.effectiveStatus, "IN_PROGRESS", "effectiveStatus must remain IN_PROGRESS");

  // Interrupted count must reflect logged downtime
  assert.ok(data.metrics.interruptedCount >= 1, "interruptedCount should be at least 1");
});

test("3. Completed Production Section: A work order with goodQuantity >= plannedQuantity qualifies as Completed", async () => {
  const ts = Date.now();
  // Order with status IN_PROGRESS in DB but goodQuantity equals plannedQuantity
  const woCompleted = await prisma.workOrder.create({
    data: {
      workOrderNo: `WO-COMPL-EVAL-${ts}`,
      status: WORK_ORDER_STATUS.IN_PROGRESS,
      salesOrderId: testSalesOrder.id,
      bomRevisionId: testBOMRevision?.id,
      assignedLine: "Line A",
      plannedQuantity: 100,
      goodQuantity: 100,
      priority: "HIGH",
    },
  });

  // Order with partial production (In Progress)
  const woPartial = await prisma.workOrder.create({
    data: {
      workOrderNo: `WO-PARTIAL-${ts}`,
      status: WORK_ORDER_STATUS.IN_PROGRESS,
      salesOrderId: testSalesOrder.id,
      bomRevisionId: testBOMRevision?.id,
      assignedLine: "Line B",
      plannedQuantity: 100,
      goodQuantity: 60,
      priority: "MEDIUM",
    },
  });

  const res = await fetch(`${baseUrl}/api/production-quality/manufacturing/dashboard`, {
    headers: authHeaders(),
  });
  assert.strictEqual(res.status, 200);
  const json = await res.json();
  const data = json.data;

  const completedOrders = data.activeWorkOrders.filter((w) => w.effectiveStatus === "COMPLETED");
  assert.strictEqual(
    data.metrics.completedCount,
    completedOrders.length,
    "metrics.completedCount must match the count of work orders with effectiveStatus === COMPLETED"
  );

  const foundCompl = data.activeWorkOrders.find((w) => w.id === woCompleted.id);
  assert.ok(foundCompl);
  assert.strictEqual(foundCompl.isCompleted, true, "isCompleted must be true when goodQuantity >= plannedQuantity");
  assert.strictEqual(foundCompl.effectiveStatus, "COMPLETED", "effectiveStatus must be COMPLETED");

  const foundPartial = data.activeWorkOrders.find((w) => w.id === woPartial.id);
  assert.ok(foundPartial);
  assert.strictEqual(foundPartial.isCompleted, false);
  assert.strictEqual(foundPartial.effectiveStatus, "IN_PROGRESS");
});

test("4. Manual Production Completion: Updates shop floor quantities, pending amount, completion % and transitions to Completed", async () => {
  const ts = Date.now();
  const wo = await prisma.workOrder.create({
    data: {
      workOrderNo: `WO-SHOP-COMPL-${ts}`,
      status: WORK_ORDER_STATUS.RELEASED,
      salesOrderId: testSalesOrder.id,
      bomRevisionId: testBOMRevision?.id,
      assignedLine: "Line C",
      plannedQuantity: 50,
      goodQuantity: 0,
      priority: "HIGH",
    },
  });

  // 1. Record partial completion of 20 units
  const res1 = await fetch(`${baseUrl}/api/production-quality/work-orders/${wo.id}/completion`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      quantityCompleted: 20,
      completionDate: new Date().toISOString().split("T")[0],
      remarks: "Batch 1 completed on shop floor",
    }),
  });

  assert.strictEqual(res1.status, 200);
  const json1 = await res1.json();
  assert.strictEqual(json1.data.goodQuantity, 20);
  assert.strictEqual(json1.data.status, "IN_PROGRESS");

  // Verify dashboard after partial completion
  const dash1Res = await fetch(`${baseUrl}/api/production-quality/manufacturing/dashboard`, {
    headers: authHeaders(),
  });
  const dash1Json = await dash1Res.json();

  const orderAfter1 = dash1Json.data.activeWorkOrders.find((w) => w.id === wo.id);
  assert.ok(orderAfter1);
  assert.strictEqual(orderAfter1.goodQuantity, 20);
  assert.strictEqual(orderAfter1.pendingQuantity, 30);
  assert.strictEqual(orderAfter1.completionPercentage, 40);
  assert.strictEqual(orderAfter1.effectiveStatus, "IN_PROGRESS");

  // 2. Record remaining 30 units completion
  const res2 = await fetch(`${baseUrl}/api/production-quality/work-orders/${wo.id}/completion`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      quantityCompleted: 30,
      completionDate: new Date().toISOString().split("T")[0],
      remarks: "Final batch completed",
    }),
  });

  assert.strictEqual(res2.status, 200);
  const json2 = await res2.json();
  assert.strictEqual(json2.data.goodQuantity, 50);
  assert.strictEqual(json2.data.status, "COMPLETED");

  // Verify dashboard after full completion
  const dash2Res = await fetch(`${baseUrl}/api/production-quality/manufacturing/dashboard`, {
    headers: authHeaders(),
  });
  const dash2Json = await dash2Res.json();

  const orderAfter2 = dash2Json.data.activeWorkOrders.find((w) => w.id === wo.id);
  assert.ok(orderAfter2);
  assert.strictEqual(orderAfter2.goodQuantity, 50);
  assert.strictEqual(orderAfter2.pendingQuantity, 0);
  assert.strictEqual(orderAfter2.completionPercentage, 100);
  assert.strictEqual(orderAfter2.isCompleted, true);
  assert.strictEqual(orderAfter2.effectiveStatus, "COMPLETED");
  assert.strictEqual(orderAfter2.isReadyForQC, true, "Fully completed untransferred batch must be ready for QC");
});
