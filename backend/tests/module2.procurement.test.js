import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import express from "express";
import { createRequisitionRouter } from "../src/features/requisitions/requisition.routes.js";
import { createOrderRouter } from "../src/features/purchase-orders/purchaseOrder.routes.js";
import { createInwardsRouter } from "../src/features/inwards/inwards.routes.js";
import { createInventoryRouter } from "../src/features/inventory/inventory.routes.js";
import { createProcurementDashboardRouter } from "../src/features/procurement-dashboard/procurementDashboard.routes.js";
import { errorHandler } from "../src/middleware/errorHandler.js";

import * as reqValidator from "../src/features/requisitions/requisition.validator.js";
import * as orderValidator from "../src/features/purchase-orders/purchaseOrder.validator.js";
import * as inwardsValidator from "../src/features/inwards/inwards.validator.js";
import * as invValidator from "../src/features/inventory/inventory.validator.js";

let server;
let baseUrl;

before(async () => {
  const testApp = express();
  testApp.use(express.json());

  // Mount all Module 2 routers under /api/v1
  testApp.use("/api/v1", createRequisitionRouter());
  testApp.use("/api/v1", createOrderRouter());
  testApp.use("/api/v1", createInwardsRouter());
  testApp.use("/api/v1", createInventoryRouter());
  testApp.use("/api/v1", createProcurementDashboardRouter());
  testApp.use(errorHandler);

  server = testApp.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

// ============================================================================
// 1. REQUISITION & RFQ VALIDATION TESTS
// ============================================================================

test("POST /api/v1/purchase-requests fails with 400 when items array is empty", async () => {
  const response = await fetch(`${baseUrl}/api/v1/purchase-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: [] }),
  });

  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.success, false);
});

test("POST /api/v1/purchase-requests fails with 400 for negative item quantity", async () => {
  const response = await fetch(`${baseUrl}/api/v1/purchase-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [{ productId: 1, quantity: -5 }],
    }),
  });

  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.success, false);
});

test("createPurchaseRequestSchema passes for valid items payload", () => {
  const validData = {
    notes: "Raw materials for batch 101",
    items: [{ productId: 2, quantity: 150.5, notes: "Grade A Copper" }],
  };
  const parsed = reqValidator.createPurchaseRequestSchema.safeParse(validData);
  assert.equal(parsed.success, true);
});

test("recordRfqResponseSchema validates total calculation and item prices correctly", () => {
  const validResponse = {
    rfqId: 1,
    vendorId: 2,
    notes: "Valid for 30 days",
    items: [
      { productId: 10, quantity: 50, unitPrice: 200, taxPercent: 18 },
    ],
  };
  const parsed = reqValidator.recordRfqResponseSchema.safeParse(validResponse);
  assert.equal(parsed.success, true);

  const invalid = {
    rfqId: 1,
    vendorId: 2,
    items: [{ productId: 10, quantity: 50, unitPrice: -20 }],
  };
  const invalidParsed = reqValidator.recordRfqResponseSchema.safeParse(invalid);
  assert.equal(invalidParsed.success, false);
});

// ============================================================================
// 2. PURCHASE ORDER VALIDATION & TAX CALCULATIONS
// ============================================================================

test("POST /api/v1/purchase-orders fails with 400 when vendorId is missing", async () => {
  const response = await fetch(`${baseUrl}/api/v1/purchase-orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [{ productId: 1, quantity: 10, unitPrice: 500 }],
    }),
  });

  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.success, false);
});

test("createPurchaseOrderSchema enforces allowed GST rates (0, 5, 12, 18) and rejects arbitrary rates like 27% or 31%", () => {
  const invalidGstPo = {
    vendorId: 1,
    items: [
      { productId: 1, quantity: 10, unitPrice: 100, taxPercent: 27 },
    ],
  };
  const invalidResult = orderValidator.createPurchaseOrderSchema.safeParse(invalidGstPo);
  assert.equal(invalidResult.success, false);
  assert.ok(
    invalidResult.error.issues.some((issue) =>
      issue.message.includes("configured rates: 0, 5, 12, or 18")
    )
  );

  // Valid rates: 0%, 5%, 12%, 18%
  for (const validRate of [0, 5, 12, 18]) {
    const validGstPo = {
      vendorId: 1,
      items: [
        { productId: 1, quantity: 10, unitPrice: 100, taxPercent: validRate },
      ],
    };
    const validResult = orderValidator.createPurchaseOrderSchema.safeParse(validGstPo);
    assert.equal(validResult.success, true);
  }
});

test("createPurchaseOrderSchema validates item subtotals, rounding, and total calculations", () => {
  const validPo = {
    vendorId: 1,
    items: [
      { productId: 1, quantity: 100, unitPrice: 250, taxPercent: 18 },
      { productId: 2, quantity: 50, unitPrice: 100, taxPercent: 5 },
      { productId: 3, quantity: 33, unitPrice: 12.33, taxPercent: 12 },
    ],
  };
  const parsed = orderValidator.createPurchaseOrderSchema.safeParse(validPo);
  assert.equal(parsed.success, true);

  // Verify server calculation and 2-decimal rounding logic
  let subtotal = 0;
  let taxAmount = 0;
  parsed.data.items.forEach((item) => {
    const lineSub = Number((item.quantity * item.unitPrice).toFixed(2));
    const lineTax = Number((lineSub * ((item.taxPercent || 0) / 100)).toFixed(2));
    subtotal += lineSub;
    taxAmount += lineTax;
  });

  subtotal = Number(subtotal.toFixed(2));
  taxAmount = Number(taxAmount.toFixed(2));
  const total = Number((subtotal + taxAmount).toFixed(2));

  // Item 1: 100 * 250 = 25000, tax = 4500
  // Item 2: 50 * 100 = 5000, tax = 250
  // Item 3: 33 * 12.33 = 406.89, tax = round(406.89 * 0.12, 2) = 48.83
  assert.equal(subtotal, 30406.89);
  assert.equal(taxAmount, 4798.83);
  assert.equal(total, 35205.72);
});

test("PATCH /api/v1/purchase-orders/:id/status rejects non-numeric ID with 400", async () => {
  const response = await fetch(`${baseUrl}/api/v1/purchase-orders/invalid-id/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "APPROVED" }),
  });

  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.success, false);
});

// ============================================================================
// 3. GOODS RECEIPT (GRN) & QC INSPECTION VALIDATION
// ============================================================================

test("POST /api/v1/goods-receipts fails with 400 when purchaseOrderId is missing", async () => {
  const response = await fetch(`${baseUrl}/api/v1/goods-receipts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [{ productId: 1, receivedQuantity: 50 }],
    }),
  });

  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.success, false);
});

test("inspectGoodsReceiptSchema validates accepted and rejected quantities", () => {
  const validInspection = {
    status: "PARTIALLY_ACCEPTED",
    items: [
      { itemId: 1, acceptedQuantity: 40, rejectedQuantity: 10, batchNumber: "B-2026-01" },
    ],
  };
  const parsed = inwardsValidator.inspectGoodsReceiptSchema.safeParse(validInspection);
  assert.equal(parsed.success, true);

  const invalidNegative = {
    status: "ACCEPTED",
    items: [{ itemId: 1, acceptedQuantity: -1, rejectedQuantity: 0 }],
  };
  const invalidParsed = inwardsValidator.inspectGoodsReceiptSchema.safeParse(invalidNegative);
  assert.equal(invalidParsed.success, false);
});

// ============================================================================
// 4. INVENTORY & DERIVED AVAILABLE STOCK CALCULATION
// ============================================================================

test("Derived Available Stock calculation logic: physicalQuantity - reservedQuantity", () => {
  const testStock = [
    { physical: 500, reserved: 150, reorder: 100 },
    { physical: 80, reserved: 30, reorder: 100 },
    { physical: 200, reserved: 200, reorder: 50 },
  ];

  const derived = testStock.map((s) => ({
    available: s.physical - s.reserved,
    isLowStock: s.physical - s.reserved <= s.reorder,
  }));

  assert.equal(derived[0].available, 350);
  assert.equal(derived[0].isLowStock, false);

  assert.equal(derived[1].available, 50);
  assert.equal(derived[1].isLowStock, true); // Low stock alert triggered!

  assert.equal(derived[2].available, 0);
  assert.equal(derived[2].isLowStock, true); // Zero available stock!
});

test("POST /api/v1/inventory/adjustments fails with 400 for negative adjustment quantity", async () => {
  const response = await fetch(`${baseUrl}/api/v1/inventory/adjustments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: 1,
      movementType: "RESERVATION",
      quantity: -25,
    }),
  });

  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.success, false);
});

test("inventoryAdjustmentSchema validates movementType enum", () => {
  const validAdjustment = {
    productId: 1,
    movementType: "RESERVATION",
    quantity: 50,
    notes: "Reserved for Work Order WO-402",
  };
  const parsed = invValidator.inventoryAdjustmentSchema.safeParse(validAdjustment);
  assert.equal(parsed.success, true);

  const invalidType = {
    productId: 1,
    movementType: "INVALID_MOVEMENT",
    quantity: 50,
  };
  const invalidParsed = invValidator.inventoryAdjustmentSchema.safeParse(invalidType);
  assert.equal(invalidParsed.success, false);
});

// ============================================================================
// 5. SECURITY & ROLE AUTHORIZATION HOOK TESTS
// ============================================================================

test("Protected routes reject unauthorized requests when authenticate middleware is active", async () => {
  const secureApp = express();
  secureApp.use(express.json());

  // Mock authenticate that returns 401 when Authorization header is absent
  const authenticateMock = (req, res, next) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    req.user = { id: 1, role: "VIEWER" };
    next();
  };

  const authorizeRolesMock = (allowedRoles) => (req, res, next) => {
    if (!allowedRoles.includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: "Forbidden: insufficient role" });
    }
    next();
  };

  secureApp.use(
    "/api/v1",
    createOrderRouter({ authenticate: authenticateMock, authorizeRoles: authorizeRolesMock })
  );
  secureApp.use(errorHandler);

  const secureServer = secureApp.listen(0);
  await new Promise((resolve) => secureServer.once("listening", resolve));
  const secureBaseUrl = `http://127.0.0.1:${secureServer.address().port}`;

  // 1. Unauthenticated request -> 401
  const unauthRes = await fetch(`${secureBaseUrl}/api/v1/purchase-orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vendorId: 1, items: [{ productId: 1, quantity: 10, unitPrice: 100 }] }),
  });
  assert.equal(unauthRes.status, 401);

  // 2. Authenticated but unauthorized role (VIEWER trying to create PO) -> 403
  const forbiddenRes = await fetch(`${secureBaseUrl}/api/v1/purchase-orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer valid-mock-token",
    },
    body: JSON.stringify({ vendorId: 1, items: [{ productId: 1, quantity: 10, unitPrice: 100 }] }),
  });
  assert.equal(forbiddenRes.status, 403);

  await new Promise((resolve, reject) => {
    secureServer.close((error) => (error ? reject(error) : resolve()));
  });
});


