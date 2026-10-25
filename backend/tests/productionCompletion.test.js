import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import app from "../src/app.js";
import prisma from "../src/db/prisma.js";

let server;
let baseUrl;
let testUser;
let testProduct;
let testSalesOrder;

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
  testUser = await prisma.user.findFirst();
  testProduct = await prisma.product.findFirst();
  testSalesOrder = await prisma.salesOrder.findFirst();
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

test("Manual Production Completion: Rejects negative or zero quantity", async () => {
  // Create a work order with planned quantity 100
  const wo = await prisma.workOrder.create({
    data: {
      workOrderNo: `WO-COMPL-VAL-${Date.now()}`,
      salesOrderId: testSalesOrder.id,
      plannedQuantity: 100,
      goodQuantity: 0,
      status: "RELEASED",
    },
  });

  // Try negative quantity
  const resNeg = await fetch(`${baseUrl}/api/production-quality/work-orders/${wo.id}/completion`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ quantityCompleted: -10 }),
  });
  assert.equal(resNeg.status, 400);

  // Try zero quantity
  const resZero = await fetch(`${baseUrl}/api/production-quality/work-orders/${wo.id}/completion`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ quantityCompleted: 0 }),
  });
  assert.equal(resZero.status, 400);
});

test("Manual Production Completion: Rejects quantity exceeding planned quantity", async () => {
  const wo = await prisma.workOrder.create({
    data: {
      workOrderNo: `WO-COMPL-EXCEED-${Date.now()}`,
      salesOrderId: testSalesOrder.id,
      plannedQuantity: 50,
      goodQuantity: 30,
      status: "IN_PROGRESS",
    },
  });

  // Remaining is 20, try 25
  const res = await fetch(`${baseUrl}/api/production-quality/work-orders/${wo.id}/completion`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ quantityCompleted: 25 }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.ok(data.message.includes("cannot exceed the planned quantity"));
});

test("Manual Production Completion: Full lifecycle from 0 -> Partial (In Progress) -> Full (Completed)", async () => {
  // 1. Initial State: Planned = 100, Completed = 0 (Not Started / RELEASED)
  const wo = await prisma.workOrder.create({
    data: {
      workOrderNo: `WO-COMPL-LIFECYCLE-${Date.now()}`,
      salesOrderId: testSalesOrder.id,
      plannedQuantity: 100,
      goodQuantity: 0,
      status: "RELEASED",
    },
  });

  const getInitial = await fetch(`${baseUrl}/api/production-quality/work-orders/${wo.id}`, {
    headers: authHeaders(),
  });
  const initialData = await getInitial.json();
  assert.equal(Number(initialData.data.plannedQuantity), 100);
  assert.equal(Number(initialData.data.goodQuantity), 0);
  assert.equal(initialData.data.status, "RELEASED");

  // 2. Partial Completion Entry: Add 60 units
  const resPartial = await fetch(`${baseUrl}/api/production-quality/work-orders/${wo.id}/completion`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      quantityCompleted: 60,
      completionDate: "2026-10-24",
      remarks: "Morning shift batch of copper bonding",
    }),
  });
  assert.equal(resPartial.status, 200);
  const partialBody = await resPartial.json();
  assert.equal(Number(partialBody.data.completedQuantity), 60);
  assert.equal(Number(partialBody.data.pendingQuantity), 40);
  assert.equal(partialBody.data.completionPercentage, 60);
  assert.equal(partialBody.data.status, "IN_PROGRESS");

  // Verify persisted in DB
  const woAfterPartial = await prisma.workOrder.findUnique({ where: { id: wo.id } });
  assert.equal(Number(woAfterPartial.goodQuantity), 60);
  assert.equal(woAfterPartial.status, "IN_PROGRESS");
  assert.ok(woAfterPartial.actualStart !== null);

  // 3. Additional Partial Completion Entry: Add another 20 units -> Total 80, Pending 20
  const resSecond = await fetch(`${baseUrl}/api/production-quality/work-orders/${wo.id}/completion`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      quantityCompleted: 20,
      completionDate: "2026-10-24",
      remarks: "Mid-day additional run",
    }),
  });
  assert.equal(resSecond.status, 200);
  const secondBody = await resSecond.json();
  assert.equal(Number(secondBody.data.completedQuantity), 80);
  assert.equal(Number(secondBody.data.pendingQuantity), 20);
  assert.equal(secondBody.data.completionPercentage, 80);
  assert.equal(secondBody.data.status, "IN_PROGRESS");

  // 4. Final Completion Entry: Add remaining 20 units -> Total 100, Pending 0, Status COMPLETED
  const resFinal = await fetch(`${baseUrl}/api/production-quality/work-orders/${wo.id}/completion`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      quantityCompleted: 20,
      completionDate: "2026-10-24",
      remarks: "Final batch finished and ready for QA inspection",
    }),
  });
  assert.equal(resFinal.status, 200);
  const finalBody = await resFinal.json();
  assert.equal(Number(finalBody.data.completedQuantity), 100);
  assert.equal(Number(finalBody.data.pendingQuantity), 0);
  assert.equal(finalBody.data.completionPercentage, 100);
  assert.equal(finalBody.data.status, "COMPLETED");

  // Verify in DB
  const woAfterFinal = await prisma.workOrder.findUnique({ where: { id: wo.id } });
  assert.equal(Number(woAfterFinal.goodQuantity), 100);
  assert.equal(woAfterFinal.status, "COMPLETED");
  assert.ok(woAfterFinal.actualEnd !== null);

  // Verify quality inspection was NOT automatically created or approved (Quality remains separate process)
  const inspections = await prisma.qualityInspection.findMany({ where: { workOrderId: wo.id } });
  assert.equal(inspections.length, 0);
});
