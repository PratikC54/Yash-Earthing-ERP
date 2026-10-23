import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import express from "express";
import { createVendorRouter } from "../src/features/vendors/vendor.routes.js";
import { errorHandler } from "../src/middleware/errorHandler.js";
import * as vendorValidator from "../src/features/vendors/vendor.validator.js";

let server;
let baseUrl;

// Create an isolated Express application mounting only the Vendor feature
// This complies with Boundary 1: testing in isolation without touching routes/index.js
before(async () => {
  const testApp = express();
  testApp.use(express.json());

  // Mount vendor router under the standard /api/v1 prefix
  testApp.use("/api/v1/vendors", createVendorRouter());
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
// 1. INPUT VALIDATION TESTS (HTTP STATUS 400)
// ============================================================================

test("POST /api/v1/vendors fails with 400 when code is missing", async () => {
  const response = await fetch(`${baseUrl}/api/v1/vendors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Acme Industrial Pipes" }),
  });

  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.ok(Array.isArray(body.errors));
  const codeError = body.errors.find((e) => e.field === "code");
  assert.ok(codeError, "Expected validation error for missing 'code'");
});

test("POST /api/v1/vendors fails with 400 when name is missing", async () => {
  const response = await fetch(`${baseUrl}/api/v1/vendors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "VND-TEST-001" }),
  });

  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  const nameError = body.errors.find((e) => e.field === "name");
  assert.ok(nameError, "Expected validation error for missing 'name'");
});

test("POST /api/v1/vendors fails with 400 for invalid email format", async () => {
  const response = await fetch(`${baseUrl}/api/v1/vendors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: "VND-TEST-002",
      name: "Acme Metals",
      email: "not-an-email",
    }),
  });

  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  const emailError = body.errors.find((e) => e.field === "email");
  assert.ok(emailError, "Expected validation error for invalid email");
});

test("POST /api/v1/vendors fails with 400 when rating exceeds 5", async () => {
  const response = await fetch(`${baseUrl}/api/v1/vendors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: "VND-TEST-003",
      name: "Acme Copper",
      rating: 6.5,
    }),
  });

  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.success, false);
});

// ============================================================================
// 2. QUERY PARAMETER VALIDATION (HTTP STATUS 400)
// ============================================================================

test("GET /api/v1/vendors fails with 400 for invalid query parameter limit", async () => {
  const response = await fetch(`${baseUrl}/api/v1/vendors?limit=-10`);
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
});

test("GET /api/v1/vendors fails with 400 for invalid isActive flag", async () => {
  const response = await fetch(`${baseUrl}/api/v1/vendors?isActive=invalid`);
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
});

// ============================================================================
// 3. PARAMETER INTEGRITY (HTTP STATUS 400)
// ============================================================================

test("GET /api/v1/vendors/:id fails with 400 when ID is non-numeric", async () => {
  const response = await fetch(`${baseUrl}/api/v1/vendors/not-a-number`);
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.match(body.error.message, /Invalid vendor ID/);
});

test("PATCH /api/v1/vendors/:id fails with 400 when ID is non-numeric", async () => {
  const response = await fetch(`${baseUrl}/api/v1/vendors/xyz`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Updated Name" }),
  });

  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.match(body.error.message, /Invalid vendor ID/);
});

test("DELETE /api/v1/vendors/:id fails with 400 when ID is non-numeric", async () => {
  const response = await fetch(`${baseUrl}/api/v1/vendors/0`, {
    method: "DELETE",
  });

  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.match(body.error.message, /Invalid vendor ID/);
});

// ============================================================================
// 4. AUTHENTICATION & ROLE-AUTHORIZATION INTEGRATION CONTRACT TESTS
// ============================================================================

test("Vendor router respects authenticate middleware when provided", async () => {
  const authProtectedApp = express();
  authProtectedApp.use(express.json());

  // Test-only mock auth rejecting unauthenticated requests
  const mockAuthenticate = (req, res, next) => {
    if (!req.headers.authorization) {
      const error = new Error("Authentication required");
      error.statusCode = 401;
      return next(error);
    }
    next();
  };

  authProtectedApp.use(
    "/api/v1/vendors",
    createVendorRouter({ authenticate: mockAuthenticate }),
  );
  authProtectedApp.use(errorHandler);

  const authServer = authProtectedApp.listen(0);
  await new Promise((resolve) => authServer.once("listening", resolve));
  const authUrl = `http://127.0.0.1:${authServer.address().port}`;

  try {
    const unauthRes = await fetch(`${authUrl}/api/v1/vendors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "VND-TEST", name: "Vendor" }),
    });
    assert.equal(unauthRes.status, 401);
  } finally {
    await new Promise((resolve, reject) => {
      authServer.close((err) => (err ? reject(err) : resolve()));
    });
  }
});

test("Vendor router respects authorizeRoles middleware when provided", async () => {
  const roleProtectedApp = express();
  roleProtectedApp.use(express.json());

  // Test-only mock role-authorizer rejecting non-procurement users
  const mockAuthorizeRoles = (allowedRoles) => (req, res, next) => {
    const userRole = req.headers["x-test-role"] || "SALES_CONSULTANT";
    if (!allowedRoles.includes(userRole)) {
      const error = new Error("Access denied: insufficient permissions");
      error.statusCode = 403;
      return next(error);
    }
    next();
  };

  roleProtectedApp.use(
    "/api/v1/vendors",
    createVendorRouter({ authorizeRoles: mockAuthorizeRoles }),
  );
  roleProtectedApp.use(errorHandler);

  const roleServer = roleProtectedApp.listen(0);
  await new Promise((resolve) => roleServer.once("listening", resolve));
  const roleUrl = `http://127.0.0.1:${roleServer.address().port}`;

  try {
    const forbiddenRes = await fetch(`${roleUrl}/api/v1/vendors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-role": "SALES_CONSULTANT", // Sales user cannot create vendors
      },
      body: JSON.stringify({ code: "VND-TEST", name: "Vendor" }),
    });
    assert.equal(forbiddenRes.status, 403);
  } finally {
    await new Promise((resolve, reject) => {
      roleServer.close((err) => (err ? reject(err) : resolve()));
    });
  }
});

// ============================================================================
// 5. SCHEMA CONFLICT & UNIQUENESS UNIT TESTS
// ============================================================================

test("createVendorSchema validates code and name correctly", () => {
  const valid = vendorValidator.createVendorSchema.safeParse({
    code: "VND-CU-001",
    name: "Premier Copper Works",
    email: "sales@premiercopper.com",
    city: "Jaipur",
    state: "Rajasthan",
    category: "RAW_MATERIAL",
    rating: 4.8,
  });

  assert.equal(valid.success, true);
  assert.equal(valid.data.code, "VND-CU-001");
  assert.equal(valid.data.name, "Premier Copper Works");
});

test("updateVendorSchema disallows modifying id", () => {
  const parsed = vendorValidator.updateVendorSchema.safeParse({
    id: 999,
    name: "New Name",
  });

  assert.equal(parsed.success, true);
  // id is ignored/not part of allowed update schema
  assert.equal(parsed.data.id, undefined);
  assert.equal(parsed.data.name, "New Name");
});
