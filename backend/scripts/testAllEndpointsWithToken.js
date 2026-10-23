
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB5YXNoZ3JvdXAuY29tIiwicm9sZSI6IkFETUlOIiwibmFtZSI6IlN5c3RlbSBBZG1pbmlzdHJhdG9yIiwiaWF0IjoxNzkyNjg2MDQzLCJleHAiOjE3OTMyOTA4NDN9.KDlekuYhinZzC8_fDFuKtafi5usb7RLE-zIrJMCAYx4';
const BASE_URL = 'http://localhost:5000';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`
};

async function req(method, endpoint, body = null, desc = '') {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const start = Date.now();
  let res;
  let json;
  try {
    res = await fetch(url, options);
    json = await res.json().catch(() => ({ raw: 'non-json' }));
  } catch (err) {
    return {
      desc,
      method,
      endpoint,
      status: 0,
      ok: false,
      duration: Date.now() - start,
      error: err.message
    };
  }

  return {
    desc,
    method,
    endpoint,
    status: res.status,
    ok: res.ok,
    duration: Date.now() - start,
    data: json
  };
}

async function run() {
  console.log('='.repeat(80));
  console.log('COMPREHENSIVE BACKEND API TEST WITH USER BEARER TOKEN');
  console.log(`Server: ${BASE_URL}`);
  console.log(`Token: ${TOKEN.slice(0, 32)}...${TOKEN.slice(-16)}`);
  console.log('='.repeat(80));

  const results = [];

  // 1. System & Health
  results.push(await req('GET', '/', null, 'Root API landing info'));
  results.push(await req('GET', '/api/health', null, 'Health Check'));

  // 2. Planning (M4.1) Endpoints
  results.push(await req('GET', '/api/production-quality/planning/dashboard', null, 'Planning Dashboard'));
  results.push(await req('GET', '/api/production-quality/production-calendar', null, 'Production Calendar (Month view)'));
  results.push(await req('GET', '/api/production-quality/production-calendar?startDate=2026-10-01&endDate=2026-10-31', null, 'Production Calendar (Date range)'));

  // Create Work Order #1 (for full happy-path lifecycle)
  const createWoRes = await req('POST', '/api/production-quality/work-orders', {
    salesOrderId: 1,
    productId: 1,
    bomRevisionId: 1,
    plannedQuantity: 100,
    plannedStart: new Date(Date.now() + 86400000).toISOString(),
    plannedEnd: new Date(Date.now() + 86400000 * 5).toISOString(),
    priority: 'HIGH',
    notes: 'Urgent Metro Rail order'
  }, 'Create Primary Work Order (POST /work-orders)');
  results.push(createWoRes);

  const woId = createWoRes.data?.data?.id;

  // Create Work Order #2 (specifically to test reject branch)
  const createWo2Res = await req('POST', '/api/production-quality/work-orders', {
    salesOrderId: 1,
    productId: 1,
    bomRevisionId: 1,
    plannedQuantity: 20,
    priority: 'LOW',
    notes: 'Batch for rejection testing'
  }, 'Create Secondary Work Order');
  results.push(createWo2Res);
  const wo2Id = createWo2Res.data?.data?.id;

  // Create Work Order #3 (specifically to test cancel branch)
  const createWo3Res = await req('POST', '/api/production-quality/work-orders', {
    salesOrderId: 1,
    productId: 1,
    bomRevisionId: 1,
    plannedQuantity: 15,
    priority: 'LOW',
    notes: 'Batch for cancellation testing'
  }, 'Create Tertiary Work Order');
  results.push(createWo3Res);
  const wo3Id = createWo3Res.data?.data?.id;

  results.push(await req('GET', '/api/production-quality/work-orders?page=1&limit=10', null, 'List Work Orders (paginated)'));
  results.push(await req('GET', `/api/production-quality/work-orders/${woId}`, null, 'Get Work Order by ID'));
  results.push(await req('PATCH', `/api/production-quality/work-orders/${woId}`, {
    notes: 'Updated priority notes for fabrication shop'
  }, 'Update Work Order Draft'));
  results.push(await req('GET', `/api/production-quality/material-availability/${woId}`, null, 'Check Material Availability'));

  // Lifecycle transitions for primary work order
  results.push(await req('POST', `/api/production-quality/work-orders/${woId}/submit`, {
    notes: 'Submitted for managerial review'
  }, 'Submit Work Order'));

  results.push(await req('POST', `/api/production-quality/work-orders/${woId}/approve`, {
    notes: 'Approved by Production Head'
  }, 'Approve Work Order'));

  results.push(await req('POST', `/api/production-quality/work-orders/${woId}/release`, {
    notes: 'Released to shop floor'
  }, 'Release Work Order to Production'));

  results.push(await req('POST', `/api/production-quality/work-orders/${woId}/hold`, {
    reason: 'Temporary tooling alignment check'
  }, 'Hold Work Order'));

  results.push(await req('POST', `/api/production-quality/work-orders/${woId}/resume`, {
    notes: 'Tooling calibrated, resuming execution'
  }, 'Resume Work Order'));

  results.push(await req('GET', `/api/production-quality/work-orders/${woId}/history`, null, 'Work Order Audit History'));

  // Test Reject branch on secondary work order
  results.push(await req('POST', `/api/production-quality/work-orders/${wo2Id}/submit`, {
    notes: 'Submitted secondary order'
  }, 'Submit Secondary Work Order'));
  results.push(await req('POST', `/api/production-quality/work-orders/${wo2Id}/reject`, {
    reason: 'Capacity constraint this month'
  }, 'Reject Work Order'));

  // Test Cancel branch on tertiary work order
  results.push(await req('POST', `/api/production-quality/work-orders/${wo3Id}/cancel`, {
    reason: 'Customer cancelled requirement'
  }, 'Cancel Work Order'));

  // 3. Manufacturing Execution (M4.2) Endpoints
  results.push(await req('GET', '/api/production-quality/manufacturing/dashboard', null, 'Manufacturing Dashboard'));

  results.push(await req('POST', `/api/production-quality/manufacturing/work-orders/${woId}/start`, {
    shift: 'SHIFT_A',
    workCenter: 'Fabrication Shop',
    notes: 'Line 1 shift A started work'
  }, 'Start Manufacturing Execution'));

  results.push(await req('POST', '/api/production-quality/manufacturing/production-entries', {
    workOrderId: woId,
    shift: 'SHIFT_A',
    quantityProduced: 25,
    workCenter: 'Fabrication Shop',
    notes: 'First batch clean cut'
  }, 'Record Production Entry'));

  results.push(await req('POST', '/api/production-quality/manufacturing/material-issues', {
    workOrderId: woId,
    productId: 2,
    quantity: 75,
    batchNumber: 'BATCH-PIPE-2026-A',
    notes: 'GI pipe batch issue'
  }, 'Issue Material to Work Order'));

  results.push(await req('POST', '/api/production-quality/manufacturing/material-consumption', {
    workOrderId: woId,
    productId: 2,
    quantity: 70,
    notes: 'Consumed in Cutting & Drilling'
  }, 'Record Material Consumption'));

  results.push(await req('POST', '/api/production-quality/manufacturing/material-returns', {
    workOrderId: woId,
    productId: 2,
    quantity: 5,
    reason: 'Surplus pipe cutoffs returned to warehouse'
  }, 'Return Surplus Material'));

  results.push(await req('GET', `/api/production-quality/manufacturing/material-reconciliation/${woId}`, null, 'Material Reconciliation Report'));

  results.push(await req('POST', '/api/production-quality/manufacturing/scrap', {
    workOrderId: woId,
    quantity: 2,
    reason: 'Dimensional tolerance mismatch during turn',
    notes: 'Scrap logged for reconciliation'
  }, 'Record Production Scrap'));

  results.push(await req('POST', '/api/production-quality/manufacturing/downtime', {
    workOrderId: woId,
    machineOrWorkCenter: 'Fabrication Shop',
    durationMinutes: 20,
    reason: 'Routine cutter blade replacement',
    notes: 'Scheduled quick-change tooling'
  }, 'Record Machine Downtime'));

  results.push(await req('POST', '/api/production-quality/manufacturing/delays', {
    workOrderId: woId,
    reason: 'Crane availability delay for heavy raw bundle transfer',
    impactMinutes: 15,
    correctiveAction: 'Delay mitigated by line coordinator'
  }, 'Record Production Delay'));

  const transferRes = await req('POST', `/api/production-quality/manufacturing/outputs/${woId}/transfer-to-quality`, {
    quantity: 24,
    notes: 'Transferred 24 completed electrodes to QC Bay 1'
  }, 'Transfer Output to Quality Inspection');
  results.push(transferRes);

  const qiId = transferRes.data?.data?.inspection?.id || transferRes.data?.data?.id;

  results.push(await req('GET', '/api/production-quality/manufacturing/reports/production?groupBy=daily', null, 'Planned vs Actual Production Report'));

  // 4. Quality Control & Output (M4.3) Endpoints
  results.push(await req('GET', '/api/production-quality/quality/dashboard', null, 'Quality Dashboard'));
  results.push(await req('GET', '/api/production-quality/quality/inspection-queue?page=1&limit=10', null, 'Inspection Queue'));
  results.push(await req('GET', `/api/production-quality/quality/inspections/${qiId}`, null, 'Get Inspection by ID'));

  results.push(await req('POST', `/api/production-quality/quality/inspections/${qiId}/start`, {}, 'Start Quality Inspection'));

  results.push(await req('POST', `/api/production-quality/quality/inspections/${qiId}/results`, {
    acceptedQuantity: 22,
    rejectedQuantity: 2,
    measurements: {
      dimensional: [
        { parameter: 'Length (mm)', specification: '3000 ± 5', measured: '3002', result: 'PASS' },
        { parameter: 'Outer Diameter (mm)', specification: '50 ± 0.5', measured: '50.1', result: 'PASS' }
      ]
    },
    evidenceNotes: '2 units failed thread pitch check, 22 units passed full QA'
  }, 'Record Inspection Measurements & Results'));

  results.push(await req('POST', `/api/production-quality/quality/inspections/${qiId}/hold`, {
    reason: 'Investigating supplier lot variance on 2 failed thread units'
  }, 'Place Inspection on Hold'));

  results.push(await req('POST', `/api/production-quality/quality/inspections/${qiId}/rework`, {
    notes: 'Rework threads on 2 units with precision die tool'
  }, 'Request Rework'));

  results.push(await req('POST', '/api/production-quality/quality/non-conformance', {
    inspectionId: qiId,
    defectType: 'Thread pitch deviation',
    severity: 'MAJOR',
    description: 'Thread pitch exceeded ISO standard pitch tolerance by 0.1mm',
    rootCause: 'Worn threading chaser on machine LATHE-01',
    proposedAction: 'REWORK'
  }, 'Log Non-Conformance Report (NCR)'));

  results.push(await req('POST', '/api/production-quality/quality/corrective-actions', {
    ncrId: `NCR-${qiId}`,
    actionDescription: 'Replaced chasers and recalibrated toolpost offset',
    targetDate: new Date(Date.now() + 86400000 * 7).toISOString(),
    assignedToId: 1
  }, 'Log Corrective and Preventive Action (CAPA)'));

  results.push(await req('POST', '/api/production-quality/quality/scrap-approvals', {
    inspectionId: qiId,
    quantity: 2,
    reason: 'Unrecoverable thread undercut beyond tolerance',
    scrapCost: 450.00
  }, 'Authorize Scrap Disposal'));

  results.push(await req('POST', `/api/production-quality/quality/inspections/${qiId}/approve`, {
    notes: 'Final QC Manager Signoff - 22 units approved for FG store'
  }, 'Approve Quality Inspection'));

  results.push(await req('POST', '/api/production-quality/quality/finished-goods-releases', {
    inspectionId: qiId,
    warehouseLocation: 'FG-RACK-A12',
    batchNumber: 'FG-BATCH-2026-001',
    notes: '22 units released into ERP inventory stock'
  }, 'Release Finished Goods to Inventory'));

  results.push(await req('GET', '/api/production-quality/quality/reports/inspection', null, 'Inspection Compliance Report'));

  // Summary Report
  console.log('\n' + '='.repeat(80));
  console.log('FINAL API TEST EXECUTION REPORT (WITH PROVIDED JWT BEARER TOKEN)');
  console.log('='.repeat(80));
  let passCount = 0;
  let failCount = 0;

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const isSuccess = r.ok && (r.status >= 200 && r.status < 300);
    if (isSuccess) passCount++;
    else failCount++;

    const statusBadge = isSuccess ? ' [PASS] ' : ' [FAIL] ';
    console.log(
      `${String(i + 1).padStart(2, '0')}. ${statusBadge} ${r.method.padEnd(6)} ${r.endpoint.padEnd(52)} -> ${r.status} (${r.duration}ms) | ${r.desc}`
    );
    if (!isSuccess) {
      console.log(`    Error Response:`, JSON.stringify(r.data));
    }
  }

  console.log('='.repeat(80));
  console.log(`TOTAL ENDPOINTS TESTED : ${results.length}`);
  console.log(`PASSED                 : ${passCount}`);
  console.log(`FAILED                 : ${failCount}`);
  console.log(`SUCCESS RATE           : ${Math.round((passCount / results.length) * 100)}%`);
  console.log('='.repeat(80));
}

run().catch(console.error);
