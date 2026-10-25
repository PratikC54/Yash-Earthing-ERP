import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import prisma from "../src/db/prisma.js";
import { NOTIFICATION_PRIORITY, NOTIFICATION_TYPES } from "../src/features/notifications/notification.constants.js";
import { NotificationService } from "../src/features/notifications/notification.service.js";
import { NotificationScheduler } from "../src/features/notifications/notificationScheduler.js";

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
    department: user.department || "Management",
    name: user.name || "Test Admin",
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

test("Smart Alerts: Notification creation and deduplication prevents duplicate alerts", async () => {
  const dedupKey = `TEST_DEDUP_${Date.now()}`;

  // First creation
  const first = await NotificationService.createNotification({
    recipientId: 1,
    type: NOTIFICATION_TYPES.WO_APPROACHING_DEADLINE,
    title: "Deadline Warning",
    message: "Work Order #4 approaching deadline",
    priority: NOTIFICATION_PRIORITY.HIGH,
    link: "/pq/work-orders/4",
    entityType: "WorkOrder",
    entityId: 4,
    dedupKey,
  });

  assert.ok(first.id);
  assert.strictEqual(first.status, "UNREAD");

  // Second creation with identical dedupKey should NOT create a duplicate
  const second = await NotificationService.createNotification({
    recipientId: 1,
    type: NOTIFICATION_TYPES.WO_APPROACHING_DEADLINE,
    title: "Deadline Warning Duplicate",
    message: "Work Order #4 approaching deadline duplicate",
    priority: NOTIFICATION_PRIORITY.HIGH,
    link: "/pq/work-orders/4",
    entityType: "WorkOrder",
    entityId: 4,
    dedupKey,
  });

  assert.strictEqual(second.id, first.id);
});

test("Smart Alerts: Lists user notifications with unread count and filters", async () => {
  const token = createAuthToken({ id: 1, role: "ADMIN" });

  const res = await fetch(`${baseUrl}/api/notifications?status=UNREAD`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.success, true);
  assert.ok(Array.isArray(body.data));
  assert.ok(typeof body.meta.unreadCount === "number");
});

test("Smart Alerts: Marks notification as read and isolates access across users", async () => {
  // Create a notification for User 1
  const notif = await NotificationService.createNotification({
    recipientId: 1,
    type: NOTIFICATION_TYPES.MACHINE_BREAKDOWN,
    title: "Machine Breakdown",
    message: "Coating line stoppage",
    priority: NOTIFICATION_PRIORITY.CRITICAL,
  });

  // User 3 attempts to mark User 1's notification as read (should fail with 403)
  const tokenUser3 = createAuthToken({ id: 3, role: "PRODUCTION_MANAGER" });
  const resForbidden = await fetch(`${baseUrl}/api/notifications/${notif.id}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${tokenUser3}` },
  });
  assert.strictEqual(resForbidden.status, 403);

  // User 1 marks own notification as read (should succeed)
  const tokenUser1 = createAuthToken({ id: 1, role: "ADMIN" });
  const resSuccess = await fetch(`${baseUrl}/api/notifications/${notif.id}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${tokenUser1}` },
  });
  assert.strictEqual(resSuccess.status, 200);
  const bodySuccess = await resSuccess.json();
  assert.strictEqual(bodySuccess.data.status, "READ");
  assert.ok(bodySuccess.data.readAt);
});

test("Smart Alerts: Marks all unread notifications as read for current user", async () => {
  const token = createAuthToken({ id: 1, role: "ADMIN" });

  const res = await fetch(`${baseUrl}/api/notifications/mark-all-read`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.success, true);
  assert.ok(typeof body.data.count === "number");
});

test("Smart Alerts: Escalation rules can be listed and retrieved", async () => {
  const token = createAuthToken({ id: 1, role: "ADMIN" });

  const res = await fetch(`${baseUrl}/api/notifications/escalation-rules`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.success, true);
  assert.ok(Array.isArray(body.data));
  assert.ok(body.data.length >= 3);
  assert.ok(body.data.some((r) => r.eventType === "WO_OVERDUE"));
});

test("Smart Alerts: Background checks execute and dispatch alerts independently", async () => {
  const token = createAuthToken({ id: 1, role: "ADMIN" });

  const res = await fetch(`${baseUrl}/api/notifications/run-checks`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.success, true);
  assert.strictEqual(body.data.success, true);
  assert.ok(body.data.deadlineStats);
  assert.ok(body.data.overdueStats);
  assert.ok(body.data.inspectionStats);
});
