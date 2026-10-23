import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import app from "../src/app.js";

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/auth/login rejects missing or malformed body", async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "invalid-email" }),
  });
  const data = await response.json();
  assert.equal(response.status, 400);
  assert.equal(data.success, false);
  assert.ok(data.message || data.error?.message);
});

test("POST /api/auth/login rejects incorrect password", async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@yashgroup.com", password: "wrongpassword" }),
  });
  const data = await response.json();
  assert.equal(response.status, 401);
  assert.equal(data.success, false);
  assert.match(data.error?.message || data.message, /Invalid email or password/i);
});

test("POST /api/auth/login rejects non-existent email", async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "nonexistent@yashgroup.com", password: "admin123" }),
  });
  const data = await response.json();
  assert.equal(response.status, 401);
  assert.equal(data.success, false);
  assert.match(data.error?.message || data.message, /Invalid email or password/i);
});

test("POST /api/auth/login succeeds with valid credentials and sets session & token", async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@yashgroup.com", password: "admin123" }),
  });
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.success, true);
  assert.ok(data.data?.token, "Token should be present in response");
  assert.equal(data.data?.user?.email, "admin@yashgroup.com");
  assert.equal(data.data?.user?.role, "ADMIN");

  const setCookie = response.headers.get("set-cookie");
  assert.ok(setCookie, "Set-Cookie header should be present");
  assert.match(setCookie, /token=/);
});

test("GET /api/auth/me returns 401 for unauthenticated request", async () => {
  const response = await fetch(`${baseUrl}/api/auth/me`);
  const data = await response.json();
  assert.equal(response.status, 401);
  assert.equal(data.success, false);
  assert.match(data.error?.message || data.message, /Authentication required/i);
});

test("GET /api/auth/me returns current user profile with valid Bearer token", async () => {
  // Login first to get a token
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@yashgroup.com", password: "admin123" }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data.token;

  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meData = await meRes.json();

  assert.equal(meRes.status, 200);
  assert.equal(meData.success, true);
  assert.equal(meData.data?.email, "admin@yashgroup.com");
  assert.equal(meData.data?.role, "ADMIN");
});

test("Protected ERP routes return 200 with valid Bearer token", async () => {
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@yashgroup.com", password: "admin123" }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data.token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const endpoints = [
    "/api/pq/dashboard",
    "/api/production-quality/dispatch/history",
    "/api/production-quality/work-orders?limit=10",
    "/api/production-quality/manufacturing/dashboard",
    "/api/production-quality/quality/dashboard",
    "/api/production-quality/planning/dashboard",
  ];

  for (const endpoint of endpoints) {
    const res = await fetch(`${baseUrl}${endpoint}`, { headers: authHeaders });
    assert.equal(res.status, 200, `Expected 200 for ${endpoint}, got ${res.status}`);
  }
});

test("POST /api/auth/logout revokes session and clears cookies", async () => {
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@yashgroup.com", password: "admin123" }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data.token;

  const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const logoutData = await logoutRes.json();

  assert.equal(logoutRes.status, 200);
  assert.equal(logoutData.success, true);
  const setCookie = logoutRes.headers.get("set-cookie");
  assert.ok(setCookie, "Logout should clear cookies");
});
