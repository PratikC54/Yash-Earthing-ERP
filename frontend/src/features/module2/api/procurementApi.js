import api from "../../../api/api.js";

// ============================================================================
// VENDORS
// ============================================================================
export async function getVendors(params = {}) {
  const response = await api.get("/vendors", { params });
  return response.data;
}

export async function getVendorById(id) {
  const response = await api.get(`/vendors/${id}`);
  return response.data;
}

export async function createVendor(data) {
  const response = await api.post("/vendors", data);
  return response.data;
}

export async function updateVendor(id, data) {
  const response = await api.patch(`/vendors/${id}`, data);
  return response.data;
}

export async function toggleVendorActive(id) {
  const response = await api.delete(`/vendors/${id}`);
  return response.data;
}

export async function deleteVendorPermanently(id) {
  const response = await api.delete(`/vendors/${id}/permanent`);
  return response.data;
}

// ============================================================================
// PURCHASE REQUESTS & RFQs
// ============================================================================
export async function getPurchaseRequests(params = {}) {
  const response = await api.get("/purchase-requests", { params });
  return response.data;
}

export async function getPurchaseRequestById(id) {
  const response = await api.get(`/purchase-requests/${id}`);
  return response.data;
}

export async function createPurchaseRequest(data) {
  const response = await api.post("/purchase-requests", data);
  return response.data;
}

export async function updatePurchaseRequest(id, data) {
  const response = await api.patch(`/purchase-requests/${id}`, data);
  return response.data;
}

export async function getRfqs(params = {}) {
  const response = await api.get("/rfqs", { params });
  return response.data;
}

export async function getRfqById(id) {
  const response = await api.get(`/rfqs/${id}`);
  return response.data;
}

export async function createRfq(data) {
  const response = await api.post("/rfqs", data);
  return response.data;
}

export async function updateRfqStatus(id, status) {
  const response = await api.patch(`/rfqs/${id}/status`, { status });
  return response.data;
}

export async function recordRfqResponse(data) {
  const response = await api.post("/rfqs/responses", data);
  return response.data;
}

export async function compareRfqQuotes(id) {
  const response = await api.get(`/rfqs/${id}/comparison`);
  return response.data;
}

export async function awardRfq(id, vendorId) {
  const response = await api.post(`/rfqs/${id}/award`, { vendorId });
  return response.data;
}

// ============================================================================
// PURCHASE ORDERS
// ============================================================================
export async function getPurchaseOrders(params = {}) {
  const response = await api.get("/purchase-orders", { params });
  return response.data;
}

export async function getPurchaseOrderById(id) {
  const response = await api.get(`/purchase-orders/${id}`);
  return response.data;
}

export async function createPurchaseOrder(data) {
  const response = await api.post("/purchase-orders", data);
  return response.data;
}

export async function createPurchaseOrderFromRfq(data) {
  const response = await api.post("/purchase-orders/from-rfq", data);
  return response.data;
}

export async function updatePurchaseOrderStatus(id, status, notes) {
  const response = await api.patch(`/purchase-orders/${id}/status`, { status, notes });
  return response.data;
}

// ============================================================================
// GOODS RECEIPTS (GRN) & QC INSPECTION
// ============================================================================
export async function getGoodsReceipts(params = {}) {
  const response = await api.get("/goods-receipts", { params });
  return response.data;
}

export async function getGoodsReceiptById(id) {
  const response = await api.get(`/goods-receipts/${id}`);
  return response.data;
}

export async function createGoodsReceipt(data) {
  const response = await api.post("/goods-receipts", data);
  return response.data;
}

export async function inspectAndPostGoodsReceipt(id, data) {
  const response = await api.post(`/goods-receipts/${id}/inspect`, data);
  return response.data;
}

// ============================================================================
// INVENTORY & STOCK MOVEMENTS
// ============================================================================
export async function getInventory(params = {}) {
  const response = await api.get("/inventory", { params });
  return response.data;
}

export async function getInventoryByProductId(productId) {
  const response = await api.get(`/inventory/products/${productId}`);
  return response.data;
}

export async function getMovements(params = {}) {
  const response = await api.get("/inventory/movements", { params });
  return response.data;
}

export async function recordInventoryAdjustment(data) {
  const response = await api.post("/inventory/adjustments", data);
  return response.data;
}

// ============================================================================
// MODULE 2 ANALYTICAL DASHBOARD
// ============================================================================
export async function getProcurementDashboardMetrics() {
  const response = await api.get("/procurement/dashboard-kpis");
  return response.data;
}
