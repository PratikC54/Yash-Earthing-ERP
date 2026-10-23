import assert from "node:assert/strict";
import { test, describe, before, after } from "node:test";
import app from "../src/app.js";
import prisma from "../src/db/prisma.js";

describe("Quality Decision & Dispatch Integration Workflow", () => {
  let server;
  let baseUrl;
  let testWorkOrder;
  let passInspection;
  let reworkInspection;
  let rejectInspection;

  const authHeaders = (role = "ADMIN", userId = 1) => ({
    "Content-Type": "application/json",
    "x-mock-role": role,
    "x-mock-user-id": String(userId),
    "x-mock-user-name": "System Administrator",
  });

  before(async () => {
    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    testWorkOrder = await prisma.workOrder.findFirst({
      where: { plannedQuantity: { gt: 0 } },
    });

    if (!testWorkOrder) {
      testWorkOrder = await prisma.workOrder.create({
        data: {
          workOrderNo: `WO-TEST-${Date.now().toString().slice(-4)}`,
          salesOrderId: 1,
          bomRevisionId: 1,
          createdById: 1,
          status: "IN_PROGRESS",
          plannedQuantity: 100,
          goodQuantity: 80,
          rejectedQuantity: 0,
          priority: "HIGH",
        },
      });
    }

    passInspection = await prisma.qualityInspection.create({
      data: {
        inspectionNo: `INSP-PASS-${Date.now().toString().slice(-4)}`,
        workOrderId: testWorkOrder.id,
        inspectedQuantity: 40,
        acceptedQuantity: 0,
        rejectedQuantity: 0,
        reworkQuantity: 0,
        dispatchedQuantity: 0,
        status: "PENDING",
      },
    });

    reworkInspection = await prisma.qualityInspection.create({
      data: {
        inspectionNo: `INSP-REW-${Date.now().toString().slice(-4)}`,
        workOrderId: testWorkOrder.id,
        inspectedQuantity: 30,
        acceptedQuantity: 0,
        rejectedQuantity: 0,
        reworkQuantity: 0,
        dispatchedQuantity: 0,
        status: "PENDING",
      },
    });

    rejectInspection = await prisma.qualityInspection.create({
      data: {
        inspectionNo: `INSP-REJ-${Date.now().toString().slice(-4)}`,
        workOrderId: testWorkOrder.id,
        inspectedQuantity: 25,
        acceptedQuantity: 0,
        rejectedQuantity: 0,
        reworkQuantity: 0,
        dispatchedQuantity: 0,
        status: "PENDING",
      },
    });
  });

  after(async () => {
    const ids = [passInspection?.id, reworkInspection?.id, rejectInspection?.id].filter(Boolean);
    if (ids.length > 0) {
      await prisma.dispatchRecord.deleteMany({ where: { inspectionId: { in: ids } } });
      await prisma.cAPARecord.deleteMany({ where: { inspectionId: { in: ids } } });
      await prisma.qualityInspection.deleteMany({ where: { id: { in: ids } } });
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test("1. Reject over-allocation on quality decision", async () => {
    const res = await fetch(`${baseUrl}/api/production-quality/quality/inspections/${passInspection.id}/decision`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        decision: "PASS",
        quantity: 50, // exceeds inspectedQuantity 40
        officer: "QC Tester",
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 400);
    assert.match(data.message, /exceeds available pending/i);
  });

  test("2. Submit PASS decision and verify quantity available in Dispatch", async () => {
    const res = await fetch(`${baseUrl}/api/production-quality/quality/inspections/${passInspection.id}/decision`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        decision: "PASS",
        quantity: 30,
        officer: "Lead QC Officer Sharma",
        notes: "Meets IS 3043 specification",
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(Number(data.data.acceptedQuantity), 30);
    assert.equal(data.data.decisionOfficer, "Lead QC Officer Sharma");

    // Verify it appears in Ready for Dispatch
    const readyRes = await fetch(`${baseUrl}/api/production-quality/dispatch/ready`, {
      headers: authHeaders(),
    });
    const readyData = await readyRes.json();

    assert.equal(readyRes.status, 200);
    const match = readyData.data.find((b) => b.inspectionId === passInspection.id);
    assert.ok(match, "Approved batch must appear in ready for dispatch");
    assert.equal(match.availableToDispatch, 30);
  });

  test("3. Dispatch creation enforces strict quantity limit <= quality-approved quantity", async () => {
    // Attempt to dispatch 35 units when only 30 were passed
    const failRes = await fetch(`${baseUrl}/api/production-quality/dispatch`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        inspectionId: passInspection.id,
        quantity: 35,
        destinationAddress: "Site Yard, Sector 4, Pune",
        transporterName: "SafeXpress Logistics",
        vehicleNumber: "MH-12-AB-9876",
      }),
    });

    const failData = await failRes.json();
    assert.equal(failRes.status, 400);
    assert.match(failData.message, /exceeds available quality-approved quantity/i);

    // Create valid partial dispatch of 15 units
    const successRes = await fetch(`${baseUrl}/api/production-quality/dispatch`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        inspectionId: passInspection.id,
        quantity: 15,
        destinationAddress: "Site Yard, Sector 4, Pune",
        transporterName: "SafeXpress Logistics",
        vehicleNumber: "MH-12-AB-9876",
        deliveryChallanNo: "DC-TEST-001",
      }),
    });

    const successData = await successRes.json();
    assert.equal(successRes.status, 201);
    assert.equal(Number(successData.data.quantity), 15);
    assert.equal(successData.data.status, "PARTIALLY_DISPATCHED");

    // Verify remaining available is 15
    const readyRes = await fetch(`${baseUrl}/api/production-quality/dispatch/ready`, {
      headers: authHeaders(),
    });
    const readyData = await readyRes.json();
    const match = readyData.data.find((b) => b.inspectionId === passInspection.id);
    assert.equal(match.availableToDispatch, 15);
  });

  test("4. Submit REWORK decision and verify linked CAPA record created and excluded from Dispatch", async () => {
    const res = await fetch(`${baseUrl}/api/production-quality/quality/inspections/${reworkInspection.id}/decision`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        decision: "REWORK",
        quantity: 20,
        defectDescription: "Surface pitting on electrode tip",
        correctiveAction: "Re-strip and re-plate with calibrated immersion time",
        responsiblePerson: "Shop Supervisor Patel",
        officer: "Lead QC Officer Sharma",
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(Number(data.data.reworkQuantity), 20);
    assert.equal(data.data.status, "HOLD");

    // Verify linked CAPA was created
    const capaListRes = await fetch(`${baseUrl}/api/production-quality/quality/capa`, {
      headers: authHeaders(),
    });
    const capaData = await capaListRes.json();

    assert.equal(capaListRes.status, 200);
    const capa = capaData.data.find((c) => c.inspectionId === reworkInspection.id);
    assert.ok(capa, "Linked CAPA record must be created");
    assert.equal(Number(capa.quantityAffected), 20);
    assert.match(capa.defectDescription, /surface pitting/i);

    // Verify rework batch is excluded from Dispatch
    const readyRes = await fetch(`${baseUrl}/api/production-quality/dispatch/ready`, {
      headers: authHeaders(),
    });
    const readyData = await readyRes.json();
    const reworkMatch = readyData.data.find((b) => b.inspectionId === reworkInspection.id);
    assert.equal(reworkMatch, undefined, "Rework batch must be excluded from Dispatch");
  });

  test("5. Submit REJECTED decision, verify scrap updated and excluded from Dispatch", async () => {
    const initialWo = await prisma.workOrder.findUnique({ where: { id: testWorkOrder.id } });
    const initialRej = Number(initialWo.rejectedQuantity || 0);

    const res = await fetch(`${baseUrl}/api/production-quality/quality/inspections/${rejectInspection.id}/decision`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        decision: "REJECTED",
        quantity: 25,
        reason: "Core fracture during bend test",
        officer: "Lead QC Officer Sharma",
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(Number(data.data.rejectedQuantity), 25);
    assert.equal(data.data.status, "FAIL");

    const updatedWo = await prisma.workOrder.findUnique({ where: { id: testWorkOrder.id } });
    assert.equal(Number(updatedWo.rejectedQuantity), initialRej + 25);

    // Verify rejected batch cannot be dispatched
    const failDispatchRes = await fetch(`${baseUrl}/api/production-quality/dispatch`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        inspectionId: rejectInspection.id,
        quantity: 10,
        destinationAddress: "Site Yard, Sector 4, Pune",
        transporterName: "SafeXpress Logistics",
        vehicleNumber: "MH-12-AB-9876",
      }),
    });

    assert.equal(failDispatchRes.status, 400);
    const failDispatchData = await failDispatchRes.json();
    assert.match(failDispatchData.message, /Cannot dispatch output from inspection in status 'FAIL'/i);
  });

  test("6. Dispatch dashboard and history return valid metrics", async () => {
    const dashRes = await fetch(`${baseUrl}/api/production-quality/dispatch/dashboard`, {
      headers: authHeaders(),
    });
    const dashData = await dashRes.json();
    assert.equal(dashRes.status, 200);
    assert.ok(dashData.data.totalQuantityDispatched >= 15);

    const histRes = await fetch(`${baseUrl}/api/production-quality/dispatch/history`, {
      headers: authHeaders(),
    });
    const histData = await histRes.json();
    assert.equal(histRes.status, 200);
    assert.ok(Array.isArray(histData.data));
    const record = histData.data.find((h) => h.inspectionId === passInspection.id);
    assert.ok(record, "Dispatch history must contain newly created dispatch");
    assert.equal(record.deliveryChallanNo, "DC-TEST-001");
  });

  test("7. Rejecting or deciding an inspection lot in RELEASED status returns 409 Conflict", async () => {
    // Mark passInspection as RELEASED
    await prisma.qualityInspection.update({
      where: { id: passInspection.id },
      data: { status: "RELEASED" },
    });

    const res = await fetch(`${baseUrl}/api/production-quality/quality/inspections/${passInspection.id}/decision`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        decision: "REJECTED",
        quantity: 5,
        reason: "Late discovery defect",
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 409);
    assert.match(data.message, /Cannot record decision for inspection lot that has already been released to finished goods/i);
  });

  test("8. Submitting decision when all units are already decided returns 400 Bad Request", async () => {
    // rejectInspection has inspectedQuantity: 25, rejectedQuantity: 25, so availablePending is 0
    const res = await fetch(`${baseUrl}/api/production-quality/quality/inspections/${rejectInspection.id}/decision`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        decision: "PASS",
        quantity: 5,
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 400);
    assert.match(data.message, /All units in this inspection lot have already received a final quality decision/i);
  });
});
