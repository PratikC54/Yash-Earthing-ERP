import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import jwt from "jsonwebtoken";
import app from "../src/app.js";

const JWT_SECRET = process.env.JWT_SECRET || "test-only-jwt-secret-at-least-32-characters";

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

function createAuthToken(user = {}) {
  const payload = {
    id: user.id || 1,
    email: user.email || "admin@yashgroup.com",
    role: user.role || "ADMIN",
    department: user.department || "Production",
    name: user.name || "Test User",
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

test("QR Tracking: Rejects unauthenticated QR requests with 401", async () => {
  const res = await fetch(`${baseUrl}/api/production-quality/work-orders/4/qr-code`);
  assert.strictEqual(res.status, 401);
});

test("QR Tracking: Generates valid QR code with SVG, PNG Data URL, and label metadata", async () => {
  const token = createAuthToken({ id: 1, role: "ADMIN" });
  const res = await fetch(`${baseUrl}/api/production-quality/work-orders/4/qr-code`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.success, true);
  assert.ok(body.data.dataUrl.startsWith("data:image/png;base64,"));
  assert.ok(body.data.svg.includes("<svg"));
  assert.ok(body.data.qrTargetUrl.includes("/pq/work-orders/4"));
  assert.strictEqual(body.data.workOrderNo, "WO-2026-0092");

  // Verify label metadata is present and sanitized (no password or sensitive token)
  const label = body.data.labelData;
  assert.ok(label.productName);
  assert.ok(label.productSku);
  assert.ok(label.batchNumber);
  assert.ok(!label.password);
  assert.ok(!label.token);
});

test("QR Tracking: Downloads QR image as PNG and SVG", async () => {
  const token = createAuthToken({ id: 1, role: "ADMIN" });
  const resPng = await fetch(`${baseUrl}/api/production-quality/work-orders/4/qr-download`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  assert.strictEqual(resPng.status, 200);
  assert.strictEqual(resPng.headers.get("content-type"), "image/png");

  const resSvg = await fetch(`${baseUrl}/api/production-quality/work-orders/4/qr-download?format=svg`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  assert.strictEqual(resSvg.status, 200);
  assert.ok(resSvg.headers.get("content-type").includes("image/svg+xml"));
});

test("QR Tracking: Scans / looks up Work Order by ID, WorkOrderNo, or QR token", async () => {
  const token = createAuthToken({ id: 3, role: "PRODUCTION_MANAGER" });

  // 1. By numeric ID
  const resById = await fetch(`${baseUrl}/api/production-quality/work-orders/qr-lookup/4`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(resById.status, 200);
  const bodyById = await resById.json();
  assert.strictEqual(bodyById.data.workOrder.id, 4);
  assert.strictEqual(bodyById.data.workOrder.workOrderNo, "WO-2026-0092");
  assert.ok(bodyById.data.permissions.canRecordProgress);

  // 2. By workOrderNo
  const resByNo = await fetch(`${baseUrl}/api/production-quality/work-orders/qr-lookup/WO-2026-0092`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(resByNo.status, 200);
  const bodyByNo = await resByNo.json();
  assert.strictEqual(bodyByNo.data.workOrder.id, 4);

  // 3. By full scanned URL
  const resByUrl = await fetch(`${baseUrl}/api/production-quality/work-orders/qr-lookup?q=https://erp.yashgroup.com/pq/work-orders/4?src=qr`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(resByUrl.status, 200);
  const bodyByUrl = await resByUrl.json();
  assert.strictEqual(bodyByUrl.data.workOrder.id, 4);
});

test("QR Tracking: Returns 404 for nonexistent or invalid work order lookup", async () => {
  const token = createAuthToken({ id: 1, role: "ADMIN" });
  const res = await fetch(`${baseUrl}/api/production-quality/work-orders/qr-lookup/NONEXISTENT-WO-99999`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  assert.strictEqual(res.status, 404);
  const body = await res.json();
  assert.strictEqual(body.success, false);
});

test("QR Tracking: Role-based permissions correctly restrict Quality Inspectors vs Production Operators", async () => {
  const inspectorToken = createAuthToken({ id: 4, role: "QUALITY_INSPECTOR" });
  const resInsp = await fetch(`${baseUrl}/api/production-quality/work-orders/qr-lookup/4`, {
    headers: { Authorization: `Bearer ${inspectorToken}` },
  });
  assert.strictEqual(resInsp.status, 200);
  const bodyInsp = await resInsp.json();
  // Quality Inspector can inspect and hold, but cannot record production progress
  assert.strictEqual(bodyInsp.data.permissions.canPerformInspection, true);
  assert.strictEqual(bodyInsp.data.permissions.canRecordProgress, false);

  const operatorToken = createAuthToken({ id: 6, role: "ENGINEER" });
  const resOp = await fetch(`${baseUrl}/api/production-quality/work-orders/qr-lookup/4`, {
    headers: { Authorization: `Bearer ${operatorToken}` },
  });
  assert.strictEqual(resOp.status, 200);
  const bodyOp = await resOp.json();
  // Engineer / Operator can record progress and downtime
  assert.strictEqual(bodyOp.data.permissions.canRecordProgress, true);
  assert.strictEqual(bodyOp.data.permissions.canRecordDowntime, true);
});

test("QR Tracking: Validates production progress entries (rejects negative or zero quantities)", async () => {
  const token = createAuthToken({ id: 3, role: "PRODUCTION_MANAGER" });

  // Negative quantity
  const resNeg = await fetch(`${baseUrl}/api/production-quality/manufacturing/production-entries`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      workOrderId: 4,
      quantityCompleted: -50,
      shift: "SHIFT_A",
    }),
  });
  assert.strictEqual(resNeg.status, 400);

  // Zero quantity
  const resZero = await fetch(`${baseUrl}/api/production-quality/manufacturing/production-entries`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      workOrderId: 4,
      quantityCompleted: 0,
      shift: "SHIFT_A",
    }),
  });
  assert.strictEqual(resZero.status, 400);
});
