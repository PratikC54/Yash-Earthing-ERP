import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import app from "../src/app.js";
import prisma from "../src/db/prisma.js";

let server;
let baseUrl;

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

  // Setup comprehensive Prisma mocks for isolated HTTP endpoint testing
  prisma.$transaction = async (fn) => fn(prisma);

  prisma.workOrder = {
    count: async () => 5,
    findMany: async () => [
      {
        id: 1,
        workOrderNo: "WO-2026-0001",
        status: "PLANNED",
        plannedQuantity: "100.000",
        goodQuantity: "50.000",
        rejectedQuantity: "0.000",
        plannedStart: new Date(),
        plannedEnd: new Date(),
        priority: "HIGH",
        salesOrder: { id: 1, orderNumber: "SO-101", customer: { companyName: "Metro Rail" } },
        bomRevision: { id: 1, revision: "REV-01", product: { name: "Electrode 50mm", sku: "EL-50" } },
        createdBy: { id: 1, name: "Manager", email: "mgr@yash.com", role: "PRODUCTION_MANAGER" },
        _count: { items: 2, inspections: 1 },
      },
    ],
    findFirst: async () => ({ workOrderNo: "WO-2026-0001" }),
    findUnique: async () => ({
      id: 1,
      workOrderNo: "WO-2026-0001",
      status: "DRAFT",
      salesOrderId: 1,
      bomRevisionId: 1,
      plannedQuantity: "100.000",
      goodQuantity: "0.000",
      rejectedQuantity: "0.000",
      actualStart: null,
      notes: "Test batch",
      salesOrder: {
        id: 1,
        orderNumber: "SO-101",
        customer: { companyName: "Metro Rail" },
        items: [{ id: 1, productId: 1, quantity: "100.000" }],
      },
      bomRevision: {
        id: 1,
        productId: 1,
        revision: "REV-01",
        items: [{ id: 1, componentProductId: 2, quantity: "1.000", component: { name: "Copper Tube" } }],
        operations: [{ id: 1, sequence: 10, name: "Cutting", workCenter: "WC-01" }],
        product: { id: 1, name: "Electrode 50mm", sku: "EL-50", specifications: [] },
      },
      items: [
        {
          id: 1,
          productId: 2,
          plannedQuantity: "100.000",
          issuedQuantity: "50.000",
          consumedQuantity: "30.000",
          product: { id: 2, name: "Copper Tube", sku: "RAW-CU-50", inventory: { physicalQuantity: "200.000" } },
        },
      ],
      inspections: [],
      createdBy: { id: 1, name: "Admin", email: "admin@yash.com", role: "ADMIN" },
    }),
    create: async ({ data }) => ({
      id: 1,
      ...data,
      workOrderNo: "WO-2026-0002",
      createdAt: new Date(),
    }),
    update: async ({ data }) => ({
      id: 1,
      workOrderNo: "WO-2026-0001",
      ...data,
      updatedAt: new Date(),
    }),
  };

  prisma.workOrderItem = {
    createMany: async () => ({ count: 1 }),
    create: async ({ data }) => ({ id: 1, ...data }),
    findFirst: async () => ({
      id: 1,
      workOrderId: 1,
      productId: 2,
      plannedQuantity: "100.000",
      issuedQuantity: "50.000",
      consumedQuantity: "20.000",
    }),
    update: async ({ data }) => ({ id: 1, ...data }),
  };

  prisma.qualityInspection = {
    count: async () => 3,
    findMany: async () => [
      {
        id: 1,
        inspectionNo: "QI-2026-0001",
        workOrderId: 1,
        status: "PENDING",
        inspectedQuantity: "50.000",
        acceptedQuantity: "0.000",
        rejectedQuantity: "0.000",
        createdAt: new Date(),
        workOrder: {
          id: 1,
          workOrderNo: "WO-2026-0001",
          priority: "HIGH",
          bomRevision: { product: { id: 1, name: "Electrode 50mm", sku: "EL-50" } },
        },
      },
    ],
    findFirst: async () => ({ inspectionNo: "QI-2026-0001" }),
    findUnique: async () => ({
      id: 1,
      inspectionNo: "QI-2026-0001",
      workOrderId: 1,
      status: "PASS",
      inspectedQuantity: "50.000",
      acceptedQuantity: "50.000",
      rejectedQuantity: "0.000",
      evidenceNotes: "Passed checks",
      measurements: { dimensional: [] },
      workOrder: {
        id: 1,
        salesOrderId: 1,
        plannedQuantity: "50.000",
        bomRevision: { productId: 1, product: { id: 1, name: "Electrode 50mm", sku: "EL-50" } },
      },
    }),
    create: async ({ data }) => ({
      id: 1,
      ...data,
      inspectionNo: "QI-2026-0002",
      createdAt: new Date(),
    }),
    update: async ({ data }) => ({
      id: 1,
      inspectionNo: "QI-2026-0001",
      workOrderId: 1,
      ...data,
    }),
  };

  prisma.inventory = {
    findUnique: async () => ({
      id: 1,
      productId: 2,
      physicalQuantity: "500.000",
      reservedQuantity: "50.000",
      warehouseLocation: "RM Store",
    }),
    update: async ({ data }) => ({ id: 1, ...data }),
    create: async ({ data }) => ({ id: 1, ...data }),
  };

  prisma.inventoryMovement = {
    create: async ({ data }) => ({ id: 1, ...data, createdAt: new Date() }),
  };

  prisma.salesOrder = {
    findUnique: async () => ({ id: 1, orderNumber: "SO-101", items: [{ productId: 1 }] }),
  };

  prisma.product = {
    findUnique: async () => ({ id: 1, name: "Electrode 50mm", sku: "EL-50", specifications: [] }),
  };

  prisma.bOMRevision = {
    findUnique: async () => ({ id: 1, revision: "REV-01", items: [] }),
    findFirst: async () => ({ id: 1, revision: "REV-01" }),
  };

  prisma.bOMItem = {
    findMany: async () => [{ id: 1, componentProductId: 2, quantity: "1.000" }],
  };

  prisma.auditLog = {
    create: async ({ data }) => ({ id: 1n, ...data, createdAt: new Date() }),
    findMany: async () => [
      {
        id: 1n,
        userId: 1,
        action: "WORK_ORDER_CREATED",
        entityType: "WorkOrder",
        entityId: "1",
        createdAt: new Date(),
        user: { id: 1, name: "Admin", email: "admin@yash.com", role: "ADMIN" },
      },
    ],
  };

  prisma.user = {
    findUnique: async () => ({
      id: 1,
      name: "Admin User",
      email: "admin@yashgroup.com",
      role: "ADMIN",
      isActive: true,
    }),
  };

  prisma.session = {
    findUnique: async () => null,
  };
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

// ===================== ROOT & SYSTEM =====================

test("1. GET / returns API server info", async () => {
  const res = await fetch(`${baseUrl}/`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.version, "1.0.0");
});

test("2. GET /api/health returns health status", async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.status, "ok");
});

test("3. GET /unknown returns 404", async () => {
  const res = await fetch(`${baseUrl}/api/unknown-endpoint`);
  const body = await res.json();
  assert.equal(res.status, 404);
  assert.equal(body.success, false);
});

// ===================== M4.1 PLANNING & WORK ORDERS =====================

test("4. GET /api/production-quality/planning/dashboard", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/planning/dashboard`, {
    headers: authHeaders("PRODUCTION_MANAGER"),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.ok(body.data.metrics);
});

test("5. GET /api/production-quality/production-calendar", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/production-calendar`, {
    headers: authHeaders("PRODUCTION_MANAGER"),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.data));
});

test("6. POST /api/production-quality/work-orders", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/work-orders`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER"),
    body: JSON.stringify({
      salesOrderId: 1,
      productId: 1,
      plannedQuantity: 100,
      priority: "HIGH",
    }),
  });
  const body = await res.json();
  assert.equal(res.status, 201);
  assert.equal(body.success, true);
});

test("7. GET /api/production-quality/work-orders", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/work-orders`, {
    headers: authHeaders("PRODUCTION_MANAGER"),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.data));
  assert.ok(body.pagination);
});

test("8. GET /api/production-quality/work-orders/:id", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/work-orders/1`, {
    headers: authHeaders("PRODUCTION_MANAGER"),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.id, 1);
});

test("9. PATCH /api/production-quality/work-orders/:id", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/work-orders/1`, {
    method: "PATCH",
    headers: authHeaders("PRODUCTION_MANAGER"),
    body: JSON.stringify({
      notes: "Updated delivery deadline",
      priority: "URGENT",
    }),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
});

test("10. POST /api/production-quality/work-orders/:id/submit", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/work-orders/1/submit`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER"),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
});

test("11. POST /api/production-quality/work-orders/:id/approve", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/work-orders/1/approve`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER"),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
});

test("12. GET /api/production-quality/material-availability/:workOrderId", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/material-availability/1`, {
    headers: authHeaders("PRODUCTION_MANAGER"),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.data.materials));
});

test("13. POST /api/production-quality/work-orders/:id/release", async () => {
  // Mock work order in PLANNED status
  const originalFindUnique = prisma.workOrder.findUnique;
  prisma.workOrder.findUnique = async () => ({
    id: 1,
    workOrderNo: "WO-2026-0001",
    status: "PLANNED",
    items: [{ productId: 2, plannedQuantity: "50.000", product: { name: "Copper Tube" } }],
  });

  const res = await fetch(`${baseUrl}/api/production-quality/work-orders/1/release`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER"),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);

  prisma.workOrder.findUnique = originalFindUnique;
});

test("14. POST /api/production-quality/work-orders/:id/hold", async () => {
  const originalFindUnique = prisma.workOrder.findUnique;
  prisma.workOrder.findUnique = async () => ({
    id: 1,
    workOrderNo: "WO-2026-0001",
    status: "PLANNED",
  });

  const res = await fetch(`${baseUrl}/api/production-quality/work-orders/1/hold`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER"),
    body: JSON.stringify({ reason: "Material testing hold" }),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);

  prisma.workOrder.findUnique = originalFindUnique;
});

test("15. POST /api/production-quality/work-orders/:id/resume", async () => {
  const originalFindUnique = prisma.workOrder.findUnique;
  prisma.workOrder.findUnique = async () => ({
    id: 1,
    workOrderNo: "WO-2026-0001",
    status: "MATERIAL_HOLD",
  });

  const res = await fetch(`${baseUrl}/api/production-quality/work-orders/1/resume`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER"),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);

  prisma.workOrder.findUnique = originalFindUnique;
});

test("16. POST /api/production-quality/work-orders/:id/reject", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/work-orders/1/reject`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER"),
    body: JSON.stringify({ reason: "Duplicate sales order" }),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
});

test("17. POST /api/production-quality/work-orders/:id/cancel", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/work-orders/1/cancel`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER"),
    body: JSON.stringify({ reason: "Client cancelled order" }),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
});

test("18. GET /api/production-quality/work-orders/:id/history", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/work-orders/1/history`, {
    headers: authHeaders("PRODUCTION_MANAGER"),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.data));
});

// ===================== M4.2 MANUFACTURING =====================

test("19. GET /api/production-quality/manufacturing/dashboard", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/manufacturing/dashboard`, {
    headers: authHeaders("PRODUCTION_MANAGER"),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.ok(body.data.metrics);
});

test("20. POST /api/production-quality/manufacturing/work-orders/:id/start", async () => {
  const originalFindUnique = prisma.workOrder.findUnique;
  prisma.workOrder.findUnique = async () => ({
    id: 1,
    status: "RELEASED",
  });

  const res = await fetch(`${baseUrl}/api/production-quality/manufacturing/work-orders/1/start`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER"),
    body: JSON.stringify({ shift: "SHIFT_A", workCenter: "WC-01" }),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);

  prisma.workOrder.findUnique = originalFindUnique;
});

test("21. POST /api/production-quality/manufacturing/production-entries", async () => {
  const originalFindUnique = prisma.workOrder.findUnique;
  prisma.workOrder.findUnique = async () => ({
    id: 1,
    status: "IN_PROGRESS",
    plannedQuantity: "100.000",
    goodQuantity: "10.000",
  });

  const res = await fetch(`${baseUrl}/api/production-quality/manufacturing/production-entries`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER"),
    body: JSON.stringify({
      workOrderId: 1,
      quantityProduced: 25,
      shift: "SHIFT_A",
    }),
  });
  const body = await res.json();
  assert.equal(res.status, 201);
  assert.equal(body.success, true);
  assert.equal(body.data.goodQuantity, 35);

  prisma.workOrder.findUnique = originalFindUnique;
});

test("22. POST /api/production-quality/manufacturing/material-issues", async () => {
  const originalFindUnique = prisma.workOrder.findUnique;
  prisma.workOrder.findUnique = async () => ({
    id: 1,
    status: "IN_PROGRESS",
    items: [{ id: 1, productId: 2, issuedQuantity: "10.000" }],
  });

  const res = await fetch(`${baseUrl}/api/production-quality/manufacturing/material-issues`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER"),
    body: JSON.stringify({
      workOrderId: 1,
      productId: 2,
      quantity: 20,
    }),
  });
  const body = await res.json();
  assert.equal(res.status, 201);
  assert.equal(body.success, true);

  prisma.workOrder.findUnique = originalFindUnique;
});

test("23. POST /api/production-quality/manufacturing/material-consumption", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/manufacturing/material-consumption`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER"),
    body: JSON.stringify({
      workOrderId: 1,
      productId: 2,
      quantity: 10,
    }),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
});

test("24. POST /api/production-quality/manufacturing/material-returns", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/manufacturing/material-returns`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER"),
    body: JSON.stringify({
      workOrderId: 1,
      productId: 2,
      quantity: 5,
      reason: "Excess stock",
    }),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
});

test("25. GET /api/production-quality/manufacturing/material-reconciliation/:workOrderId", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/manufacturing/material-reconciliation/1`, {
    headers: authHeaders("PRODUCTION_MANAGER"),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.data.items));
});

test("26. POST /api/production-quality/manufacturing/scrap", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/manufacturing/scrap`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER"),
    body: JSON.stringify({
      workOrderId: 1,
      quantity: 2,
      reason: "Cutting burr",
    }),
  });
  const body = await res.json();
  assert.equal(res.status, 201);
  assert.equal(body.success, true);
});

test("27. POST /api/production-quality/manufacturing/downtime", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/manufacturing/downtime`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER"),
    body: JSON.stringify({
      workOrderId: 1,
      machineOrWorkCenter: "Saw-01",
      durationMinutes: 15,
      reason: "Blade maintenance",
    }),
  });
  const body = await res.json();
  assert.equal(res.status, 201);
  assert.equal(body.success, true);
});

test("28. POST /api/production-quality/manufacturing/delays", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/manufacturing/delays`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER"),
    body: JSON.stringify({
      workOrderId: 1,
      reason: "Material delivery delay",
      impactMinutes: 30,
    }),
  });
  const body = await res.json();
  assert.equal(res.status, 201);
  assert.equal(body.success, true);
});

test("29. POST /api/production-quality/manufacturing/outputs/:id/transfer-to-quality", async () => {
  const originalFindUnique = prisma.workOrder.findUnique;
  prisma.workOrder.findUnique = async () => ({
    id: 1,
    status: "IN_PROGRESS",
    goodQuantity: "50.000",
    inspections: [],
  });

  const res = await fetch(`${baseUrl}/api/production-quality/manufacturing/outputs/1/transfer-to-quality`, {
    method: "POST",
    headers: authHeaders("PRODUCTION_MANAGER"),
    body: JSON.stringify({
      quantity: 20,
      batchNumber: "LOT-01",
    }),
  });
  const body = await res.json();
  assert.equal(res.status, 201);
  assert.equal(body.success, true);

  prisma.workOrder.findUnique = originalFindUnique;
});

test("30. GET /api/production-quality/manufacturing/reports/production", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/manufacturing/reports/production`, {
    headers: authHeaders("PRODUCTION_MANAGER"),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.data));
});

// ===================== M4.3 QUALITY CONTROL & OUTPUT =====================

test("31. GET /api/production-quality/quality/dashboard", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/quality/dashboard`, {
    headers: authHeaders("QUALITY_INSPECTOR"),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.ok(body.data.metrics);
});

test("32. GET /api/production-quality/quality/inspection-queue", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/quality/inspection-queue`, {
    headers: authHeaders("QUALITY_INSPECTOR"),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.data));
});

test("33. GET /api/production-quality/quality/inspections/:id", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/quality/inspections/1`, {
    headers: authHeaders("QUALITY_INSPECTOR"),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.id, 1);
});

test("34. POST /api/production-quality/quality/inspections/:id/start", async () => {
  const originalFindUnique = prisma.qualityInspection.findUnique;
  prisma.qualityInspection.findUnique = async () => ({
    id: 1,
    status: "PENDING",
  });

  const res = await fetch(`${baseUrl}/api/production-quality/quality/inspections/1/start`, {
    method: "POST",
    headers: authHeaders("QUALITY_INSPECTOR"),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);

  prisma.qualityInspection.findUnique = originalFindUnique;
});

test("35. POST /api/production-quality/quality/inspections/:id/results", async () => {
  const originalFindUnique = prisma.qualityInspection.findUnique;
  prisma.qualityInspection.findUnique = async () => ({
    id: 1,
    status: "PENDING",
    inspectedQuantity: "50.000",
  });

  const res = await fetch(`${baseUrl}/api/production-quality/quality/inspections/1/results`, {
    method: "POST",
    headers: authHeaders("QUALITY_INSPECTOR"),
    body: JSON.stringify({
      acceptedQuantity: 45,
      rejectedQuantity: 5,
      measurements: { dimensional: [{ test: "OD", val: "50mm" }] },
    }),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);

  prisma.qualityInspection.findUnique = originalFindUnique;
});

test("36. POST /api/production-quality/quality/inspections/:id/approve", async () => {
  const originalFindUnique = prisma.qualityInspection.findUnique;
  prisma.qualityInspection.findUnique = async () => ({
    id: 1,
    status: "PENDING",
    inspectedQuantity: "50.000",
  });

  const res = await fetch(`${baseUrl}/api/production-quality/quality/inspections/1/approve`, {
    method: "POST",
    headers: authHeaders("QUALITY_INSPECTOR"),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);

  prisma.qualityInspection.findUnique = originalFindUnique;
});

test("37. POST /api/production-quality/quality/inspections/:id/hold", async () => {
  const originalFindUnique = prisma.qualityInspection.findUnique;
  prisma.qualityInspection.findUnique = async () => ({
    id: 1,
    status: "PENDING",
    workOrderId: 1,
  });

  const res = await fetch(`${baseUrl}/api/production-quality/quality/inspections/1/hold`, {
    method: "POST",
    headers: authHeaders("QUALITY_INSPECTOR"),
    body: JSON.stringify({ reason: "Visual coating verification needed" }),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);

  prisma.qualityInspection.findUnique = originalFindUnique;
});

test("38. POST /api/production-quality/quality/inspections/:id/reject", async () => {
  const originalFindUnique = prisma.qualityInspection.findUnique;
  prisma.qualityInspection.findUnique = async () => ({
    id: 1,
    status: "PENDING",
    inspectedQuantity: "50.000",
  });

  const res = await fetch(`${baseUrl}/api/production-quality/quality/inspections/1/reject`, {
    method: "POST",
    headers: authHeaders("QUALITY_INSPECTOR"),
    body: JSON.stringify({ reason: "Severe pitting defect" }),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);

  prisma.qualityInspection.findUnique = originalFindUnique;
});

test("39. POST /api/production-quality/quality/inspections/:id/rework", async () => {
  const originalFindUnique = prisma.qualityInspection.findUnique;
  prisma.qualityInspection.findUnique = async () => ({
    id: 1,
    status: "HOLD",
  });

  const res = await fetch(`${baseUrl}/api/production-quality/quality/inspections/1/rework`, {
    method: "POST",
    headers: authHeaders("QUALITY_INSPECTOR"),
    body: JSON.stringify({ notes: "Repolish terminal lug" }),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);

  prisma.qualityInspection.findUnique = originalFindUnique;
});

test("40. POST /api/production-quality/quality/non-conformance", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/quality/non-conformance`, {
    method: "POST",
    headers: authHeaders("QUALITY_INSPECTOR"),
    body: JSON.stringify({
      inspectionId: 1,
      defectType: "Dimensional Variance",
      description: "Length out of tolerance by 10mm",
    }),
  });
  const body = await res.json();
  assert.equal(res.status, 201);
  assert.equal(body.success, true);
});

test("41. POST /api/production-quality/quality/corrective-actions", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/quality/corrective-actions`, {
    method: "POST",
    headers: authHeaders("QUALITY_INSPECTOR"),
    body: JSON.stringify({
      ncrId: "NCR-2026-001",
      actionDescription: "Calibrate stopper fixture on cutting machine",
    }),
  });
  const body = await res.json();
  assert.equal(res.status, 201);
  assert.equal(body.success, true);
});

test("42. POST /api/production-quality/quality/scrap-approvals", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/quality/scrap-approvals`, {
    method: "POST",
    headers: authHeaders("QUALITY_INSPECTOR"),
    body: JSON.stringify({
      inspectionId: 1,
      quantity: 5,
      reason: "Internal fissure",
    }),
  });
  const body = await res.json();
  assert.equal(res.status, 201);
  assert.equal(body.success, true);
});

test("43. POST /api/production-quality/quality/finished-goods-releases", async () => {
  const originalFindUnique = prisma.qualityInspection.findUnique;
  prisma.qualityInspection.findUnique = async () => ({
    id: 1,
    inspectionNo: "QI-2026-0001",
    status: "PASS",
    acceptedQuantity: "50.000",
    workOrder: {
      id: 1,
      salesOrderId: 1,
      plannedQuantity: "50.000",
      bomRevision: { productId: 1 },
    },
  });

  const res = await fetch(`${baseUrl}/api/production-quality/quality/finished-goods-releases`, {
    method: "POST",
    headers: authHeaders("QUALITY_INSPECTOR"),
    body: JSON.stringify({
      inspectionId: 1,
      warehouseLocation: "FG Bay 1",
    }),
  });
  const body = await res.json();
  assert.equal(res.status, 201);
  assert.equal(body.success, true);
  assert.equal(body.data.releaseQuantity, 50);

  prisma.qualityInspection.findUnique = originalFindUnique;
});

test("44. GET /api/production-quality/quality/reports/inspection", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/quality/reports/inspection`, {
    headers: authHeaders("QUALITY_INSPECTOR"),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.data));
});
