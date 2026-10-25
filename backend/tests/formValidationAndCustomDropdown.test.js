import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import app from "../src/app.js";
import prisma from "../src/db/prisma.js";
import { getBusinessTodayString } from "../src/features/production-quality/shared/productionQuality.utils.js";

let server;
let baseUrl;
let testUser;
let testProduct;
let testSalesOrder;

const authHeaders = (role = "ADMIN", userId = 1) => ({
  "Content-Type": "application/json",
  "x-mock-role": role,
  "x-mock-user-id": String(userId),
  "x-mock-user-name": "Test Manager",
});

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  await prisma.$connect();
  testUser = await prisma.user.findFirst();
  testProduct = await prisma.product.findFirst({
    where: { unitOfMeasure: { in: ["NOS", "PCS"] } },
  });
  if (!testProduct) {
    testProduct = await prisma.product.create({
      data: {
        name: "Test Rod discrete",
        sku: `SKU-DISCRETE-${Date.now()}`,
        unitOfMeasure: "NOS",
        type: "MANUFACTURED",
      },
    });
  }
  testSalesOrder = await prisma.salesOrder.findFirst();
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

test("Date Validation: Rejects past completion dates and accepts today or future dates", async () => {
  const wo = await prisma.workOrder.create({
    data: {
      workOrderNo: `WO-DATEVAL-${Date.now()}`,
      salesOrderId: testSalesOrder.id,
      plannedQuantity: 100,
      goodQuantity: 0,
      status: "RELEASED",
    },
  });

  // Attempt past date
  const pastRes = await fetch(`${baseUrl}/api/production-quality/work-orders/${wo.id}/completion`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      quantityCompleted: 10,
      completionDate: "2020-01-01",
    }),
  });
  assert.equal(pastRes.status, 400);
  const pastBody = await pastRes.json();
  assert.match(pastBody.message, /Past dates are not allowed/i);

  // Attempt today's date
  const todayStr = getBusinessTodayString("Asia/Kolkata");
  const todayRes = await fetch(`${baseUrl}/api/production-quality/work-orders/${wo.id}/completion`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      quantityCompleted: 10,
      completionDate: todayStr,
    }),
  });
  assert.equal(todayRes.status, 200);
  const todayBody = await todayRes.json();
  assert.equal(todayBody.data.completedQuantity, 10);
});

test("Quantity Validation: Rejects negative, decimals for whole units, and excess quantities", async () => {
  // Create BOM revision and WO using testProduct (NOS)
  const bom = await prisma.bOMRevision.create({
    data: {
      revision: `REV-${Date.now()}`,
      productId: testProduct.id,
      status: "RELEASED",
    },
  });

  const wo = await prisma.workOrder.create({
    data: {
      workOrderNo: `WO-QTYVAL-${Date.now()}`,
      salesOrderId: testSalesOrder.id,
      bomRevisionId: bom.id,
      plannedQuantity: 50,
      goodQuantity: 0,
      status: "RELEASED",
    },
  });

  // 1. Negative quantity
  const negRes = await fetch(`${baseUrl}/api/production-quality/work-orders/${wo.id}/completion`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      quantityCompleted: -5,
    }),
  });
  assert.equal(negRes.status, 400);
  const negBody = await negRes.json();
  assert.match(negBody.message, /cannot be negative|greater than zero/i);

  // 2. Decimal quantity for discrete whole unit (NOS)
  const decRes = await fetch(`${baseUrl}/api/production-quality/work-orders/${wo.id}/completion`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      quantityCompleted: 5.5,
    }),
  });
  assert.equal(decRes.status, 400);
  const decBody = await decRes.json();
  assert.match(decBody.message, /whole number|Decimal quantities are not allowed/i);

  // 3. Exceeding planned/pending quantity
  const excessRes = await fetch(`${baseUrl}/api/production-quality/work-orders/${wo.id}/completion`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      quantityCompleted: 60,
    }),
  });
  assert.equal(excessRes.status, 400);
  const excessBody = await excessRes.json();
  assert.match(excessBody.message, /cannot exceed/i);
});

test("Custom Dropdown Options: Creates, fetches, and prevents duplicates", async () => {
  const uniqueName = `TestReason_${Date.now()}`;

  // 1. Fetch default options
  const initialRes = await fetch(
    `${baseUrl}/api/production-quality/master-data/dropdown-options?category=DOWNTIME_REASON`,
    {
      headers: authHeaders(),
    }
  );
  assert.equal(initialRes.status, 200);
  const initialData = await initialRes.json();
  assert.ok(Array.isArray(initialData.data));
  const countBefore = initialData.data.length;

  // 2. Add custom option
  const createRes = await fetch(`${baseUrl}/api/production-quality/master-data/dropdown-options`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER"),
    body: JSON.stringify({
      category: "DOWNTIME_REASON",
      value: uniqueName,
      description: "Sensor recalibration needed",
    }),
  });
  assert.equal(createRes.status, 201);
  const createdBody = await createRes.json();
  assert.equal(createdBody.data.value, uniqueName);

  // 3. Fetch again and verify presence
  const afterRes = await fetch(
    `${baseUrl}/api/production-quality/master-data/dropdown-options?category=DOWNTIME_REASON`,
    {
      headers: authHeaders(),
    }
  );
  const afterData = await afterRes.json();
  assert.equal(afterData.data.length, countBefore + 1);
  const found = afterData.data.find((o) => o.value.toLowerCase() === uniqueName.toLowerCase());
  assert.ok(found);

  // 4. Duplicate prevention (case-insensitive)
  const dupRes = await fetch(`${baseUrl}/api/production-quality/master-data/dropdown-options`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER"),
    body: JSON.stringify({
      category: "DOWNTIME_REASON",
      value: uniqueName.toLowerCase(),
    }),
  });
  assert.equal(dupRes.status, 409);
  const dupBody = await dupRes.json();
  assert.match(dupBody.message, /already exists/i);

  // 5. Unauthorized role prevention
  const unauthRes = await fetch(`${baseUrl}/api/production-quality/master-data/dropdown-options`, {
    method: "POST",
    headers: authHeaders("VIEWER"),
    body: JSON.stringify({
      category: "DOWNTIME_REASON",
      value: `Unauth_${Date.now()}`,
    }),
  });
  assert.equal(unauthRes.status, 403);
});
