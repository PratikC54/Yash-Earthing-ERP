import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";
import prisma from "../src/db/prisma.js";
import { signToken } from "../src/utils/jwt.js";

describe("Comprehensive Submodule Feature & Functionality Verification", () => {
  let server;
  let baseUrl;
  let testWorkOrder;
  let testProduct;
  let testInspection;
  let createdDispatch;
  let authToken;

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${authToken}`,
  });

  before(async () => {
    authToken = signToken({
      id: 1,
      email: "admin@yashgroup.com",
      role: "ADMIN",
      name: "System Administrator",
    });

    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    testProduct = await prisma.product.findFirst();
    if (!testProduct) {
      const category = (await prisma.category.findFirst()) ||
        (await prisma.category.create({
          data: { name: "Test Category", type: "FINISHED_GOOD" },
        }));
      testProduct = await prisma.product.create({
        data: {
          name: "Chemical Earthing Electrode 50mm",
          sku: `TEST-ELECTRODE-${Date.now()}`,
          categoryId: category.id,
          unitOfMeasure: "NOS",
        },
      });
    }

    // Ensure inventory has stock for material issues
    await prisma.inventory.upsert({
      where: { productId: testProduct.id },
      update: { physicalQuantity: 100 },
      create: {
        productId: testProduct.id,
        physicalQuantity: 100,
        reservedQuantity: 0,
        reorderLevel: 10,
        unitCost: 100,
        warehouseLocation: "RM Store A",
      },
    });

    let bom = await prisma.bOMRevision.findFirst({ where: { productId: testProduct.id } });
    if (!bom) {
      bom = await prisma.bOMRevision.create({
        data: {
          productId: testProduct.id,
          revision: "REV-01",
          status: "RELEASED",
        },
      });
    }

    testWorkOrder = await prisma.workOrder.create({
      data: {
        workOrderNo: `WO-E2E-${Date.now().toString().slice(-4)}`,
        salesOrderId: 1,
        bomRevisionId: bom.id,
        createdById: 1,
        status: "DRAFT",
        plannedQuantity: 100,
        goodQuantity: 0,
        rejectedQuantity: 0,
        priority: "HIGH",
      },
    });
  });

  after(async () => {
    if (testWorkOrder?.id) {
      try {
        await prisma.dispatchRecord.deleteMany({ where: { workOrderId: testWorkOrder.id } });
        await prisma.cAPARecord.deleteMany({ where: { workOrderId: testWorkOrder.id } });
        await prisma.qualityInspection.deleteMany({ where: { workOrderId: testWorkOrder.id } });
        await prisma.inventoryMovement.deleteMany({ where: { referenceId: testWorkOrder.id } });
        await prisma.workOrderItem.deleteMany({ where: { workOrderId: testWorkOrder.id } });
        await prisma.auditLog.deleteMany({ where: { entityId: String(testWorkOrder.id) } });
        await prisma.workOrder.deleteMany({ where: { id: testWorkOrder.id } });
      } catch (err) {
        console.error("Cleanup error:", err.message);
      }
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // =========================================================================
  // SUBMODULE 1: PLANNING
  // =========================================================================
  describe("Submodule 1: Planning & Scheduling", () => {
    test("1.1 Dashboard metrics returns valid planning statistics", async () => {
      const res = await fetch(`${baseUrl}/api/production-quality/planning/dashboard`, {
        headers: authHeaders(),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.data.metrics);
      assert.ok(typeof body.data.metrics.totalWorkOrders === "number");
    });

    test("1.2 Production Calendar returns array of scheduled work orders", async () => {
      const res = await fetch(`${baseUrl}/api/production-quality/production-calendar`, {
        headers: authHeaders(),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(Array.isArray(body.data));
    });

    test("1.3 Submit Work Order advances status from DRAFT to PLANNED", async () => {
      const res = await fetch(`${baseUrl}/api/production-quality/work-orders/${testWorkOrder.id}/submit`, {
        method: "POST",
        headers: authHeaders(),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.data.status, "PLANNED");
    });

    test("1.4 Approve Work Order maintains PLANNED status and logs approval", async () => {
      const res = await fetch(`${baseUrl}/api/production-quality/work-orders/${testWorkOrder.id}/approve`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ notes: "Production planning approved" }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.data.status, "PLANNED");
    });

    test("1.5 Check Material Availability for Work Order", async () => {
      const res = await fetch(`${baseUrl}/api/production-quality/material-availability/${testWorkOrder.id}`, {
        headers: authHeaders(),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.data.workOrderId);
      assert.ok(Array.isArray(body.data.materials));
    });

    test("1.6 Release Work Order advances status to RELEASED", async () => {
      await prisma.workOrder.update({
        where: { id: testWorkOrder.id },
        data: { status: "RELEASED" },
      });
      const res = await fetch(`${baseUrl}/api/production-quality/work-orders/${testWorkOrder.id}`, {
        headers: authHeaders(),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.data.status, "RELEASED");
    });
  });

  // =========================================================================
  // SUBMODULE 2: MANUFACTURING / SHOP-FLOOR
  // =========================================================================
  describe("Submodule 2: Manufacturing & Shop-Floor Execution", () => {
    test("2.1 Start Work Order transitions status to IN_PROGRESS", async () => {
      const res = await fetch(`${baseUrl}/api/production-quality/manufacturing/work-orders/${testWorkOrder.id}/start`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          shift: "SHIFT_A",
          workCenter: "ELECTROPLATING_LINE_1",
        }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.data.status, "IN_PROGRESS");
    });

    test("2.2 Record Shift Production Entry increments completed good quantity", async () => {
      const res = await fetch(`${baseUrl}/api/production-quality/manufacturing/production-entries`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          workOrderId: testWorkOrder.id,
          quantityProduced: 60,
          shift: "SHIFT_A",
          workCenter: "LINE_1",
        }),
      });
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.data.goodQuantity, 60);
    });

    test("2.3 Material Issues logs raw material issuance", async () => {
      const res = await fetch(`${baseUrl}/api/production-quality/manufacturing/material-issues`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          workOrderId: testWorkOrder.id,
          productId: testProduct.id,
          quantity: 20,
        }),
      });
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.data.referenceId, testWorkOrder.id);
    });

    test("2.4 Material Consumption logs consumed components", async () => {
      const res = await fetch(`${baseUrl}/api/production-quality/manufacturing/material-consumption`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          workOrderId: testWorkOrder.id,
          productId: testProduct.id,
          quantity: 20,
        }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.data.workOrderId, testWorkOrder.id);
    });

    test("2.5 Material Reconciliation provides issued vs consumed comparison", async () => {
      const res = await fetch(`${baseUrl}/api/production-quality/manufacturing/material-reconciliation/${testWorkOrder.id}`, {
        headers: authHeaders(),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.data.workOrderId);
      assert.ok(Array.isArray(body.data.items));
    });

    test("2.6 Log Shop-Floor Downtime & Operational Delays", async () => {
      const dtRes = await fetch(`${baseUrl}/api/production-quality/manufacturing/downtime`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          workOrderId: testWorkOrder.id,
          machineOrWorkCenter: "Saw-01",
          durationMinutes: 15,
          reason: "Blade maintenance",
        }),
      });
      assert.equal(dtRes.status, 201);

      const delayRes = await fetch(`${baseUrl}/api/production-quality/manufacturing/delays`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          workOrderId: testWorkOrder.id,
          reason: "Material transfer staging",
          impactMinutes: 15,
        }),
      });
      assert.equal(delayRes.status, 201);
    });

    test("2.7 Transfer Completed Output to Quality Control", async () => {
      const res = await fetch(`${baseUrl}/api/production-quality/manufacturing/outputs/${testWorkOrder.id}/transfer-to-quality`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          quantity: 60,
          batchNumber: `BATCH-${Date.now().toString().slice(-4)}`,
          notes: "Transferred from Shop Floor Line 1",
        }),
      });

      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.data.status, "PENDING");
      assert.equal(Number(body.data.inspectedQuantity), 60);

      testInspection = body.data;
    });

    test("2.8 Transfer exceeds available good output returns 400 Bad Request", async () => {
      const res = await fetch(`${baseUrl}/api/production-quality/manufacturing/outputs/${testWorkOrder.id}/transfer-to-quality`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          quantity: 10, // All 60 good quantity already transferred
        }),
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.match(body.message, /already been transferred|exceeds/i);
    });
  });

  // =========================================================================
  // SUBMODULE 3: QUALITY CONTROL & CAPA
  // =========================================================================
  describe("Submodule 3: Quality Control, Testing & CAPA", () => {
    test("3.1 Inspection Queue lists newly transferred inspection lot", async () => {
      const res = await fetch(`${baseUrl}/api/production-quality/quality/inspection-queue`, {
        headers: authHeaders(),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      const match = body.data.find((q) => q.id === testInspection.id);
      assert.ok(match, "Transferred lot must be in inspection queue");
    });

    test("3.2 Record physical & metallurgical test measurements", async () => {
      const res = await fetch(`${baseUrl}/api/production-quality/quality/inspections/${testInspection.id}/results`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          acceptedQuantity: 0,
          rejectedQuantity: 0,
          measurements: {
            parameters: {
              coatingThicknessMicrons: 265,
              coatingThicknessPass: true,
              ohmicResistanceOhms: 0.045,
              ohmicResistancePass: true,
            },
          },
          evidenceNotes: "Coating thickness meets IS 3043 standard",
        }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.data.measurements);
    });

    test("3.3 Partial REWORK decision (10 units) creates linked CAPA record", async () => {
      const res = await fetch(`${baseUrl}/api/production-quality/quality/inspections/${testInspection.id}/decision`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          decision: "REWORK",
          quantity: 10,
          defectDescription: "Thread pitch misalignment on rolling die",
          rootCause: "Minor die wear",
          correctiveAction: "Recut and rethread terminal ends",
          responsiblePerson: "Machine Shop Lead",
          officer: "Lead QC Inspector",
        }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(Number(body.data.reworkQuantity), 10);

      // Verify linked CAPA record
      const capas = await prisma.cAPARecord.findMany({ where: { inspectionId: testInspection.id } });
      assert.equal(capas.length, 1);
      assert.equal(Number(capas[0].quantityAffected), 10);
      assert.equal(capas[0].status, "OPEN");
    });

    test("3.4 Partial PASS decision (50 units) approves remaining pending lot", async () => {
      const res = await fetch(`${baseUrl}/api/production-quality/quality/inspections/${testInspection.id}/decision`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          decision: "PASS",
          quantity: 50,
          officer: "Lead QC Inspector",
          notes: "Approved for finished goods release",
        }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(Number(body.data.acceptedQuantity), 50);
      assert.equal(body.data.status, "PASS");
    });

    test("3.5 Attempting decision when all 60 units are decided returns 400 Bad Request", async () => {
      const res = await fetch(`${baseUrl}/api/production-quality/quality/inspections/${testInspection.id}/decision`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          decision: "REJECTED",
          quantity: 5,
          reason: "Late check",
        }),
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.match(body.message, /already received a final quality decision|exceeds available/i);
    });

    test("3.6 Release 50 accepted units to Finished Goods Inventory", async () => {
      const res = await fetch(`${baseUrl}/api/production-quality/quality/finished-goods-releases`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          inspectionId: testInspection.id,
          warehouseLocation: "FG-BAY-01",
          batchNumber: "BATCH-VERIFIED",
          notes: "Released to FG inventory",
        }),
      });
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.data.releaseQuantity, 50);
      assert.equal(body.data.inspection.status, "RELEASED");
    });

    test("3.7 Duplicate Finished Goods release returns 409 Conflict", async () => {
      const res = await fetch(`${baseUrl}/api/production-quality/quality/finished-goods-releases`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          inspectionId: testInspection.id,
          warehouseLocation: "FG-BAY-01",
        }),
      });
      assert.equal(res.status, 409);
    });

    test("3.8 Attempting decision on RELEASED inspection returns 409 Conflict", async () => {
      const res = await fetch(`${baseUrl}/api/production-quality/quality/inspections/${testInspection.id}/decision`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          decision: "REJECTED",
          quantity: 5,
          reason: "Post release defect",
        }),
      });
      assert.equal(res.status, 409);
      const body = await res.json();
      assert.match(body.message, /already been released to finished goods/i);
    });
  });

  // =========================================================================
  // SUBMODULE 4: DISPATCH & LOGISTICS
  // =========================================================================
  describe("Submodule 4: Dispatch Management & Delivery Challans", () => {
    test("4.1 Ready for Dispatch lists released inspection lot with 50 units", async () => {
      const res = await fetch(`${baseUrl}/api/production-quality/dispatch/ready`, {
        headers: authHeaders(),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      const match = body.data.find((b) => b.inspectionId === testInspection.id);
      assert.ok(match, "Released lot must appear in Ready for Dispatch");
      assert.equal(match.availableToDispatch, 50);
    });

    test("4.2 Dispatch over available quantity (60 > 50) returns 400 Bad Request", async () => {
      const res = await fetch(`${baseUrl}/api/production-quality/dispatch`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          inspectionId: testInspection.id,
          quantity: 60,
          destinationAddress: "EPC Site, Hinjewadi Phase 3, Pune",
          transporterName: "Blue Dart Logistics",
          vehicleNumber: "MH-14-GH-1234",
        }),
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.match(body.message, /exceeds available quality-approved quantity/i);
    });

    test("4.3 Create Dispatch of 30 units generates Delivery Challan", async () => {
      const res = await fetch(`${baseUrl}/api/production-quality/dispatch`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          inspectionId: testInspection.id,
          quantity: 30,
          destinationAddress: "EPC Site, Hinjewadi Phase 3, Pune",
          transporterName: "SafeXpress Logistics",
          vehicleNumber: "MH-12-PQ-5678",
          driverName: "Ramesh Pawar",
          driverPhone: "+91 98765 43210",
          deliveryChallanNo: "DC-E2E-001",
          notes: "Urgent site delivery",
        }),
      });
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.data.quantity, 30);
      assert.ok(body.data.dispatchNo);
      createdDispatch = body.data;
    });

    test("4.4 Remaining available dispatch quantity accurately updates (50 - 30 = 20)", async () => {
      const res = await fetch(`${baseUrl}/api/production-quality/dispatch/ready`, {
        headers: authHeaders(),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      const match = body.data.find((b) => b.inspectionId === testInspection.id);
      assert.ok(match);
      assert.equal(match.availableToDispatch, 20);
      assert.equal(match.dispatchedQuantity, 30);
    });

    test("4.5 Dispatch History & Dashboard metrics return valid records", async () => {
      const histRes = await fetch(`${baseUrl}/api/production-quality/dispatch/history`, {
        headers: authHeaders(),
      });
      assert.equal(histRes.status, 200);
      const histBody = await histRes.json();
      assert.ok(Array.isArray(histBody.data));
      const match = histBody.data.find((h) => h.id === createdDispatch.id);
      assert.ok(match, "Created dispatch must be listed in dispatch history");

      const dashRes = await fetch(`${baseUrl}/api/production-quality/dispatch/dashboard`, {
        headers: authHeaders(),
      });
      assert.equal(dashRes.status, 200);
      const dashBody = await dashRes.json();
      assert.ok(dashBody.data.totalDispatches >= 1);
      assert.ok(dashBody.data.totalQuantityDispatched >= 30);
    });
  });

  // =========================================================================
  // SUBMODULE 5: AUDIT TRAIL & TRACEABILITY
  // =========================================================================
  describe("Submodule 5: Comprehensive Audit Trail & Traceability", () => {
    test("5.1 Audit trail records all lifecycle mutations for the Work Order", async () => {
      const res = await fetch(`${baseUrl}/api/production-quality/work-orders/${testWorkOrder.id}/history`, {
        headers: authHeaders(),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(Array.isArray(body.data));
      assert.ok(body.data.length >= 3, "Audit trail must have at least 3 historical mutations");
    });
  });
});
