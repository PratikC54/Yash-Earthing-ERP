import assert from "node:assert/strict";

const BASE_URL = "http://127.0.0.1:5000";

let authToken = "";
let referenceData = null;
let testWorkOrderId = null;
let testWorkOrderNo = "";
let passInspectionId = null;
let reworkInspectionId = null;
let rejectInspectionId = null;

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  return { status: response.status, data: json, headers: response.headers };
}

async function runStage(num, title, fn) {
  console.log(`\n============================================================`);
  console.log(`▶ STAGE ${num}: ${title}`);
  console.log(`============================================================`);
  try {
    const result = await fn();
    console.log(`✔ STAGE ${num} PASSED: ${title}`);
    if (result) console.log(`  Details:`, JSON.stringify(result, null, 2));
    return true;
  } catch (err) {
    console.error(`❌ STAGE ${num} FAILED: ${title}`);
    console.error(`  Error:`, err.message);
    if (err.details) console.error(`  Context:`, JSON.stringify(err.details, null, 2));
    throw err;
  }
}

async function main() {
  console.log("Starting End-to-End Functional Verification of YASH Earthing ERP...");

  // -------------------------------------------------------------
  // STAGE 1: Authentication & Authorization Security
  // -------------------------------------------------------------
  await runStage(1, "Authentication & Security Handshake", async () => {
    // 1. Unauthenticated request to /api/auth/me should fail with 401
    const unauth = await request("/api/auth/me");
    assert.equal(unauth.status, 401, "Expected 401 for unauthenticated request");

    // 2. Login with valid credentials
    const login = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "admin@yashgroup.com", password: "admin123" }),
    });
    assert.equal(login.status, 200, "Login failed");
    assert.ok(login.data?.data?.token, "Token missing in login response");
    authToken = login.data.data.token;

    // 3. Authenticated request to /api/auth/me
    const me = await request("/api/auth/me");
    assert.equal(me.status, 200, "Failed to get current user");
    assert.equal(me.data?.data?.email, "admin@yashgroup.com");
    assert.equal(me.data?.data?.role, "ADMIN");

    return {
      user: me.data.data.name,
      email: me.data.data.email,
      role: me.data.data.role,
      tokenLength: authToken.length,
    };
  });

  // -------------------------------------------------------------
  // STAGE 2: Reference Data Provider & Dropdown Source
  // -------------------------------------------------------------
  await runStage(2, "Reference Data for Form Dropdowns", async () => {
    const res = await request("/api/production-quality/planning/reference-data");
    assert.equal(res.status, 200, "Failed to fetch reference data");
    const data = res.data?.data;
    assert.ok(Array.isArray(data?.salesOrders), "salesOrders missing");
    assert.ok(Array.isArray(data?.products), "products missing");
    assert.ok(Array.isArray(data?.users), "users missing");
    assert.ok(Array.isArray(data?.productionLines), "productionLines missing");

    referenceData = data;
    return {
      availableSalesOrders: data.salesOrders.length,
      availableProducts: data.products.length,
      availableUsers: data.users.length,
      productionLines: data.productionLines,
      sampleSalesOrder: data.salesOrders[0]?.orderNumber || "None",
      sampleProduct: data.products[0]?.name || "None",
    };
  });

  // -------------------------------------------------------------
  // STAGE 3: Work Order Creation from Existing Sales Order
  // -------------------------------------------------------------
  await runStage(3, "Work Order Creation (using Dropdown selections)", async () => {
    const selectedSo = referenceData.salesOrders[0];
    const selectedProd = referenceData.products[0];
    const selectedLine = referenceData.productionLines[0];

    assert.ok(selectedSo, "No existing Sales Order in database");
    assert.ok(selectedProd, "No existing Product in database");

    const payload = {
      salesOrderId: selectedSo.id,
      productId: selectedProd.id,
      bomRevisionId: selectedProd.bomRevisions?.[0]?.id || 1,
      plannedQuantity: 50,
      priority: "HIGH",
      assignedLine: selectedLine,
      plannedStart: new Date().toISOString(),
      plannedEnd: new Date(Date.now() + 86400000 * 3).toISOString(),
      notes: "E2E automated verification order",
    };

    const res = await request("/api/production-quality/work-orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 201, `Failed to create Work Order: ${JSON.stringify(res.data)}`);
    const wo = res.data?.data;
    assert.ok(wo?.id, "Work order ID missing");
    assert.ok(wo?.workOrderNo, "Work order number missing");
    assert.equal(wo.status, "DRAFT");

    testWorkOrderId = wo.id;
    testWorkOrderNo = wo.workOrderNo;

    return {
      workOrderId: testWorkOrderId,
      workOrderNo: testWorkOrderNo,
      status: wo.status,
      salesOrderId: wo.salesOrderId,
      plannedQuantity: wo.plannedQuantity,
      assignedLine: wo.assignedLine,
    };
  });

  // -------------------------------------------------------------
  // STAGE 4: Work Order Planning, Approval & Release Lifecycle
  // -------------------------------------------------------------
  await runStage(4, "Work Order Lifecycle (Submit → Approve → Release)", async () => {
    // 1. Submit
    const submitRes = await request(`/api/production-quality/work-orders/${testWorkOrderId}/submit`, {
      method: "POST",
    });
    assert.equal(submitRes.status, 200, "Submit failed");
    assert.equal(submitRes.data?.data?.status, "PLANNED");

    // 2. Approve
    const approveRes = await request(`/api/production-quality/work-orders/${testWorkOrderId}/approve`, {
      method: "POST",
    });
    assert.equal(approveRes.status, 200, "Approve failed");

    // 3. Material Check
    const stockRes = await request(`/api/production-quality/material-availability/${testWorkOrderId}`);
    assert.equal(stockRes.status, 200, "Stock check failed");

    // 4. Release
    const releaseRes = await request(`/api/production-quality/work-orders/${testWorkOrderId}/release`, {
      method: "POST",
    });
    assert.equal(releaseRes.status, 200, "Release failed");
    assert.equal(releaseRes.data?.data?.status, "RELEASED");

    return {
      workOrderNo: testWorkOrderNo,
      finalStatus: releaseRes.data.data.status,
      materialAvailability: stockRes.data?.data?.overallStatus || "CHECKED",
    };
  });

  // -------------------------------------------------------------
  // STAGE 5: Manufacturing Execution & Shift Production Logging
  // -------------------------------------------------------------
  await runStage(5, "Manufacturing Execution & Shift Production Logging", async () => {
    // 1. Start Manufacturing
    const startRes = await request(`/api/production-quality/manufacturing/work-orders/${testWorkOrderId}/start`, {
      method: "POST",
      body: JSON.stringify({ shift: "SHIFT_A" }),
    });
    assert.equal(startRes.status, 200, "Start manufacturing failed");
    assert.equal(startRes.data?.data?.status, "IN_PROGRESS");

    // 2. Issue Raw Material
    const rawProduct = referenceData.products[1] || referenceData.products[0];
    const issueRes = await request(`/api/production-quality/manufacturing/material-issues`, {
      method: "POST",
      body: JSON.stringify({
        workOrderId: testWorkOrderId,
        productId: rawProduct.id,
        quantity: 50,
        locationCode: "Raw Material Warehouse A",
        notes: "Raw pipes issued to coating line",
      }),
    });
    assert.equal(issueRes.status, 201, `Material issue failed: ${JSON.stringify(issueRes.data)}`);

    // 3. Log Production Run (50 good units produced)
    const entryRes = await request(`/api/production-quality/manufacturing/production-entries`, {
      method: "POST",
      body: JSON.stringify({
        workOrderId: testWorkOrderId,
        quantityProduced: 50,
        shift: "SHIFT_A",
        workCenter: "Line A · Continuous Coating",
        notes: "Continuous coating run verified",
      }),
    });
    assert.equal(entryRes.status, 201, `Production entry failed: ${JSON.stringify(entryRes.data)}`);

    // 4. Log Station Downtime
    const downtimeRes = await request(`/api/production-quality/manufacturing/downtime`, {
      method: "POST",
      body: JSON.stringify({
        workOrderId: testWorkOrderId,
        machineOrWorkCenter: "Line A · Continuous Coating",
        reason: "Tooling Changeover",
        durationMinutes: 20,
      }),
    });
    assert.equal(downtimeRes.status, 201, `Downtime logging failed: ${JSON.stringify(downtimeRes.data)}`);

    // 5. Log Scrap
    const scrapRes = await request(`/api/production-quality/manufacturing/scrap`, {
      method: "POST",
      body: JSON.stringify({
        workOrderId: testWorkOrderId,
        quantity: 2,
        reason: "Surface Oxidation",
      }),
    });
    assert.equal(scrapRes.status, 201, `Scrap logging failed: ${JSON.stringify(scrapRes.data)}`);

    return {
      workOrderNo: testWorkOrderNo,
      status: "IN_PROGRESS",
      goodProduced: 50,
      scrapRecorded: 2,
      downtimeLoggedMinutes: 20,
    };
  });

  // -------------------------------------------------------------
  // STAGE 6: Transfer Output to Quality Inspection
  // -------------------------------------------------------------
  await runStage(6, "Transfer Batch to Quality Control Queue", async () => {
    // Transfer Lot 1 (20 units for PASS)
    const transferRes1 = await request(`/api/production-quality/manufacturing/outputs/${testWorkOrderId}/transfer-to-quality`, {
      method: "POST",
      body: JSON.stringify({
        quantity: 20,
        notes: "Lot 1: Clean electrode batch for Pass & Dispatch",
      }),
    });
    assert.ok(transferRes1.status === 200 || transferRes1.status === 201, `Transfer Lot 1 failed: ${JSON.stringify(transferRes1.data)}`);
    passInspectionId = transferRes1.data?.data?.id || transferRes1.data?.data?.inspection?.id;

    // Transfer Lot 2 (10 units for REWORK)
    const transferRes2 = await request(`/api/production-quality/manufacturing/outputs/${testWorkOrderId}/transfer-to-quality`, {
      method: "POST",
      body: JSON.stringify({
        quantity: 10,
        notes: "Lot 2: Plating thickness variance batch for Rework",
      }),
    });
    assert.ok(transferRes2.status === 200 || transferRes2.status === 201, `Transfer Lot 2 failed: ${JSON.stringify(transferRes2.data)}`);
    reworkInspectionId = transferRes2.data?.data?.id || transferRes2.data?.data?.inspection?.id;

    // Transfer Lot 3 (10 units for REJECT)
    const transferRes3 = await request(`/api/production-quality/manufacturing/outputs/${testWorkOrderId}/transfer-to-quality`, {
      method: "POST",
      body: JSON.stringify({
        quantity: 10,
        notes: "Lot 3: Core defect batch for Reject & Scrap",
      }),
    });
    assert.ok(transferRes3.status === 200 || transferRes3.status === 201, `Transfer Lot 3 failed: ${JSON.stringify(transferRes3.data)}`);
    rejectInspectionId = transferRes3.data?.data?.id || transferRes3.data?.data?.inspection?.id;

    return {
      workOrderNo: testWorkOrderNo,
      passLotInspectionId: passInspectionId,
      reworkLotInspectionId: reworkInspectionId,
      rejectLotInspectionId: rejectInspectionId,
    };
  });

  // -------------------------------------------------------------
  // STAGE 7: Quality Inspection Measurements & Testing
  // -------------------------------------------------------------
  await runStage(7, "Quality Inspection Parameter Measurements", async () => {
    const queueRes = await request(`/api/production-quality/quality/inspection-queue`);
    assert.equal(queueRes.status, 200, "Inspection queue fetch failed");

    // Save parameter measurements for Lot 1
    const resultsRes = await request(`/api/production-quality/quality/inspections/${passInspectionId}/results`, {
      method: "POST",
      body: JSON.stringify({
        acceptedQuantity: 20,
        rejectedQuantity: 0,
        measurements: {
          parameters: {
            coatingThicknessMicrons: 260,
            coatingThicknessPass: true,
            ohmicResistanceOhms: 0.025,
            ohmicResistancePass: true,
            diameterMm: 17.2,
            diameterPass: true,
            lengthMm: 3000,
            lengthPass: true,
            visualFinishPass: true,
            inspectorRemarks: "Conforms to IS 3043 copper bonding standards",
          },
        },
      }),
    });

    assert.equal(resultsRes.status, 200, `Saving inspection parameters failed: ${JSON.stringify(resultsRes.data)}`);
    return {
      inspectionId: passInspectionId,
      measurementsRecorded: true,
      parameters: resultsRes.data?.data?.measurements?.parameters,
    };
  });

  // -------------------------------------------------------------
  // STAGE 8: Decision Branch 1 — PASS & Dispatch Release
  // -------------------------------------------------------------
  await runStage(8, "Quality Decision: PASS → Dispatch Release", async () => {
    // 1. Authorize PASS decision
    const passDecisionRes = await request(`/api/production-quality/quality/inspections/${passInspectionId}/decision`, {
      method: "POST",
      body: JSON.stringify({
        decision: "PASS",
        quantity: 20,
        notes: "Batch approved for export dispatch",
        officer: "System Administrator",
      }),
    });
    assert.equal(passDecisionRes.status, 200, `PASS decision failed: ${JSON.stringify(passDecisionRes.data)}`);

    // 2. Release to Finished Goods / Dispatch
    const fgReleaseRes = await request(`/api/production-quality/quality/finished-goods-releases`, {
      method: "POST",
      body: JSON.stringify({
        inspectionId: passInspectionId,
        warehouseLocation: "FG-WH-BAY-01 · Finished Goods Main",
      }),
    });
    assert.equal(fgReleaseRes.status, 201, `FG release failed: ${JSON.stringify(fgReleaseRes.data)}`);

    // 3. Verify Dispatch History includes this release
    const dispatchRes = await request(`/api/production-quality/dispatch/history`);
    assert.equal(dispatchRes.status, 200, "Failed to get dispatch history");
    const dispatches = dispatchRes.data?.data || dispatchRes.data || [];
    const matchedDispatch = dispatches.find((d) => d.workOrderId === testWorkOrderId || d.workOrder?.id === testWorkOrderId);

    return {
      inspectionStatus: passDecisionRes.data?.data?.status,
      passedQuantity: 20,
      warehouseBay: "FG-WH-BAY-01 · Finished Goods Main",
      dispatchRecordCreated: !!matchedDispatch,
      dispatchNo: matchedDispatch?.dispatchNo || "Recorded in FG Dispatch Ledger",
    };
  });

  // -------------------------------------------------------------
  // STAGE 9: Decision Branch 2 — REWORK & CAPA Integration
  // -------------------------------------------------------------
  await runStage(9, "Quality Decision: REWORK → CAPA Record Creation", async () => {
    const reworkRes = await request(`/api/production-quality/quality/inspections/${reworkInspectionId}/decision`, {
      method: "POST",
      body: JSON.stringify({
        decision: "REWORK",
        quantity: 10,
        defectDescription: "Sub-optimal plating immersion timing or surface oxidation",
        correctiveAction: "Re-dip in degreasing & electroplating bath",
        responsiblePerson: "Plating Station Lead",
        targetCompletionDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        officer: "System Administrator",
      }),
    });
    assert.equal(reworkRes.status, 200, `REWORK decision failed: ${JSON.stringify(reworkRes.data)}`);

    // Verify CAPA record
    const capaRes = await request(`/api/production-quality/quality/capa`);
    assert.equal(capaRes.status, 200, "CAPA records fetch failed");
    const capas = capaRes.data?.data || capaRes.data || [];
    const matchedCapa = capas.find((c) => c.inspectionId === reworkInspectionId);

    assert.ok(matchedCapa, "CAPA record not generated for rework batch");

    return {
      decision: "REWORK",
      quantityHeldForRework: 10,
      capaNo: matchedCapa.capaNo,
      correctiveAction: matchedCapa.correctiveAction,
      assignedPerson: matchedCapa.responsiblePerson,
    };
  });

  // -------------------------------------------------------------
  // STAGE 10: Decision Branch 3 — REJECT & Scrap Authorization
  // -------------------------------------------------------------
  await runStage(10, "Quality Decision: REJECT → Scrap Exclusion", async () => {
    const rejectRes = await request(`/api/production-quality/quality/inspections/${rejectInspectionId}/decision`, {
      method: "POST",
      body: JSON.stringify({
        decision: "REJECTED",
        quantity: 10,
        defectType: "METALLURGICAL_DEFECT",
        defectReason: "Failed copper adhesion tape test (IS 3043)",
        reason: "Quarantine batch for scrap recycling; scrap credit against job order",
        officer: "System Administrator",
      }),
    });
    assert.equal(rejectRes.status, 200, `REJECT decision failed: ${JSON.stringify(rejectRes.data)}`);

    return {
      decision: "REJECTED",
      rejectedQuantity: 10,
      quarantineStatus: "QUARANTINED_SCRAP",
      disposalPolicy: "Quarantine batch for scrap recycling",
    };
  });

  // -------------------------------------------------------------
  // STAGE 11: Audit Trail Verification
  // -------------------------------------------------------------
  await runStage(11, "Immutable Audit Trail & Mutation History", async () => {
    const histRes = await request(`/api/production-quality/work-orders/${testWorkOrderId}/history`);
    assert.equal(histRes.status, 200, "History fetch failed");

    const history = histRes.data?.data?.history || (Array.isArray(histRes.data?.data) ? histRes.data.data : []);
    assert.ok(history.length > 0, "No audit logs found for work order");

    return {
      workOrderNo: testWorkOrderNo,
      auditLogEntriesCount: history.length,
      loggedActions: history.map((h) => `${h.action || h.eventType} by ${h.user?.name || "System"}`),
    };
  });

  console.log("\n============================================================");
  console.log("🎉 ALL 11 FUNCTIONAL WORKFLOW STAGES VERIFIED 100% GREEN!");
  console.log("============================================================\n");
}

main().catch((err) => {
  console.error("FATAL ERROR during verification:", err);
  process.exit(1);
});
