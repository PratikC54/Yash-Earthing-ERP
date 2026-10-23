import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import app from "../src/app.js";
import { generateToken } from "../src/features/auth/auth.utils.js";

let server;
let baseUrl;

// Tokens corresponding to valid users in auth.service.js
const adminToken = generateToken({ id: 1, email: "admin@yashgroup.com", role: "ADMIN", name: "System Administrator" });
const salesManagerToken = generateToken({ id: 2, email: "pratik.senapati@yashgroup.com", role: "SALES_MANAGER", name: "Pratik Senapati" });
const qiToken = generateToken({ id: 6, email: "ananya.sharma@yashgroup.com", role: "QUALITY_INSPECTOR", name: "Ananya Sharma" });
const boToken = generateToken({ id: 3, email: "rukhsar.shaikh@yashgroup.com", role: "BACK_OFFICER", name: "Rukhsar Shaikh" });

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /projects/dashboard/metrics returns operational KPIs", async () => {
  const response = await fetch(`${baseUrl}/projects/dashboard/metrics`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.ok(body.data);
  assert.equal(typeof body.data.totalProjects, "number");
  assert.equal(typeof body.data.activeProjects, "number");
  assert.equal(typeof body.data.totalInstallations, "number");
  assert.equal(typeof body.data.totalTickets, "number");
});

test("POST /projects rejects invalid payload with missing required fields", async () => {
  const response = await fetch(`${baseUrl}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ name: "" }), // missing customerId & salesOrderId
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
});

test("Role-based access control blocks unauthorized roles on project creation", async () => {
  const response = await fetch(`${baseUrl}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${boToken}`,
    },
    body: JSON.stringify({
      name: "Unauthorized Project",
      customerId: 1,
      salesOrderId: 1,
    }),
  });
  const body = await response.json();

  assert.equal(response.status, 403);
  assert.equal(body.success, false);
  assert.match(body.message, /Permission denied/);
});

test("Complete M5.1, M5.2, M5.3 lifecycle and business rules execution", async () => {
  // 1. Create a Project linked to Sales Order #1 and Customer #1
  const projectRes = await fetch(`${baseUrl}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: "Auto-Verified Testing Grid Project",
      customerId: 1,
      salesOrderId: 1,
      siteName: "Chakan Test Site Unit 4",
      siteAddress: { city: "Pune", plot: "44-B" },
    }),
  });
  const projectBody = await projectRes.json();
  assert.equal(projectRes.status, 201);
  assert.ok(projectBody.data.projectCode.startsWith("PRJ-"));
  const projectId = projectBody.data.id;

  // 2. Fetch Project by ID and verify cross-module inventory calculation
  const getProjRes = await fetch(`${baseUrl}/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const getProjBody = await getProjRes.json();
  assert.equal(getProjRes.status, 200);
  assert.ok(Array.isArray(getProjBody.data.materialRequirements));

  // 3. Add a milestone task to the project
  const taskRes = await fetch(`${baseUrl}/projects/${projectId}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      title: "Earth Pit Excavation",
      priority: "HIGH",
    }),
  });
  const taskBody = await taskRes.json();
  assert.equal(taskRes.status, 201);
  assert.ok(taskBody.data.taskNo.startsWith("TSK-"));

  // 4. Schedule Site Installation
  const instRes = await fetch(`${baseUrl}/installations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      projectId,
      notes: "Testing installation",
    }),
  });
  const instBody = await instRes.json();
  assert.equal(instRes.status, 201);
  assert.ok(instBody.data.installationNo.startsWith("INS-"));
  const installationId = instBody.data.id;

  // 5. Test QC Gate: Attempt handover BEFORE testing (MUST FAIL)
  const prematureHandoverRes = await fetch(`${baseUrl}/installations/${installationId}/handover`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      customerSignoffName: "Mr. Test Client",
    }),
  });
  assert.equal(prematureHandoverRes.status, 400);

  // 6. Test QC Gate: Record FAILED test (resistance > 2.0 Ohms e.g. 3.5 Ohms)
  const failedTestRes = await fetch(`${baseUrl}/installations/${installationId}/test-results`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${qiToken}`,
    },
    body: JSON.stringify({
      earthResistanceOhms: 3.5, // Exceeds 2.0 Ohm standard!
      gridContinuityPassed: true,
      pitCondition: "SUB_STANDARD",
      testedBy: "Senior QC Inspector",
      mandatoryChecklist: {
        pitExcavationVerified: true,
        backfillCompoundApplied: true,
        copperBondingInspected: true,
        safetySignageInstalled: true,
      },
    }),
  });
  const failedTestBody = await failedTestRes.json();
  assert.equal(failedTestRes.status, 200);
  assert.equal(failedTestBody.data.status, "BLOCKED");

  // Attempt handover while BLOCKED (MUST FAIL)
  const blockedHandoverRes = await fetch(`${baseUrl}/installations/${installationId}/handover`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      customerSignoffName: "Mr. Test Client",
    }),
  });
  assert.equal(blockedHandoverRes.status, 400);

  // 7. Test QC Gate: Record PASSED test (resistance <= 2.0 Ohms e.g. 1.25 Ohms)
  const passedTestRes = await fetch(`${baseUrl}/installations/${installationId}/test-results`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${qiToken}`,
    },
    body: JSON.stringify({
      earthResistanceOhms: 1.25,
      gridContinuityPassed: true,
      pitCondition: "EXCELLENT",
      testedBy: "Senior QC Inspector",
      mandatoryChecklist: {
        pitExcavationVerified: true,
        backfillCompoundApplied: true,
        copperBondingInspected: true,
        safetySignageInstalled: true,
      },
    }),
  });
  const passedTestBody = await passedTestRes.json();
  assert.equal(passedTestRes.status, 200);
  assert.equal(passedTestBody.data.status, "HANDOVER_PENDING");

  // 8. Complete Handover with client sign-off (MUST SUCCEED)
  const handoverSuccessRes = await fetch(`${baseUrl}/installations/${installationId}/handover`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      customerSignoffName: "Mr. Vikram Mehta (Plant Head)",
      notes: "Signed off on site with certificate issued.",
    }),
  });
  const handoverSuccessBody = await handoverSuccessRes.json();
  assert.equal(handoverSuccessRes.status, 200);
  assert.equal(handoverSuccessBody.data.status, "COMPLETED");

  // 9. Create Service Ticket with dynamic warranty
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);

  const ticketRes = await fetch(`${baseUrl}/service-tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      customerId: 1,
      salesOrderId: 1,
      serialNumber: "SN-CHAKAN-01",
      issue: "Annual earth pit resistance recalibration and maintenance",
      warrantyStart: new Date().toISOString(),
      warrantyEnd: futureDate.toISOString(),
    }),
  });
  const ticketBody = await ticketRes.json();
  assert.equal(ticketRes.status, 201);
  assert.ok(ticketBody.data.ticketNo.startsWith("TKT-"));
  const ticketId = ticketBody.data.id;

  // 10. Resolve Service Ticket with replacement parts used
  const resolveRes = await fetch(`${baseUrl}/service-tickets/${ticketId}/resolve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      resolution: "Re-compacted soil and topped up moisture retention compound.",
      partsUsed: [
        { productId: 1, quantity: 2, notes: "Chemical Earth Compound 25kg" },
      ],
    }),
  });
  const resolveBody = await resolveRes.json();
  assert.equal(resolveRes.status, 200);
  assert.equal(resolveBody.data.status, "RESOLVED");
  assert.match(resolveBody.data.resolution, /Parts Consumed/);
});
