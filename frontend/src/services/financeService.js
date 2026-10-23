import api from '../api/api';

const BASE_URL = '/finance';

export const financeService = {
  // Dashboard & Critical Actions
  getDashboardSummary: async () => {
    const res = await api.get(`${BASE_URL}/dashboard`);
    return res.data;
  },

  // Unified Customer Billing & Receivables Register
  getUnifiedRegister: async () => {
    const res = await api.get(`${BASE_URL}/register`);
    return res.data;
  },

  updateUnifiedRegisterItem: async (id, updateData) => {
    const res = await api.patch(`${BASE_URL}/register/${id}`, updateData);
    return res.data;
  },

  toggleTodoItem: async (id) => {
    const res = await api.patch(`${BASE_URL}/todos/${id}/toggle`);
    return res.data;
  },

  // Billable Orders from Upstream Dispatches
  getBillableOrders: async () => {
    const res = await api.get(`${BASE_URL}/billable`);
    return res.data;
  },

  // Invoices (M6.1)
  getInvoices: async () => {
    const res = await api.get(`${BASE_URL}/invoices`);
    return res.data;
  },

  createInvoice: async (invoiceData) => {
    const res = await api.post(`${BASE_URL}/invoices`, invoiceData);
    return res.data;
  },

  // Receipts & Collections (M6.1)
  getReceipts: async () => {
    const res = await api.get(`${BASE_URL}/receipts`);
    return res.data;
  },

  recordReceipt: async (receiptData) => {
    const res = await api.post(`${BASE_URL}/receipts`, receiptData);
    return res.data;
  },

  // Ageing & Exposure (M6.1)
  getAgeingSummary: async () => {
    const res = await api.get(`${BASE_URL}/ageing`);
    return res.data;
  },

  getCustomerExposure: async (customerId) => {
    const res = await api.get(`${BASE_URL}/customers/${customerId}/exposure`);
    return res.data;
  },

  // Payables & Vendor Bills (M6.2)
  getVendorBills: async () => {
    const res = await api.get(`${BASE_URL}/vendor-bills`);
    return res.data;
  },

  createVendorBill: async (billData) => {
    const res = await api.post(`${BASE_URL}/vendor-bills`, billData);
    return res.data;
  },

  recordVendorPayment: async (paymentData) => {
    const res = await api.post(`${BASE_URL}/vendor-payments`, paymentData);
    return res.data;
  },

  // Costing & Margins (M6.3)
  getJobCosting: async () => {
    const res = await api.get(`${BASE_URL}/costing`);
    return res.data;
  },

  // Admin Settings
  getSettings: async () => {
    const res = await api.get(`${BASE_URL}/settings`);
    return res.data;
  },

  updateCompanyProfile: async (profileData) => {
    const res = await api.put(`${BASE_URL}/settings/company`, profileData);
    return res.data;
  },

  // CRUD extensions
  updateInvoice: async (id, updateData) => {
    const res = await api.patch(`${BASE_URL}/invoices/${id}`, updateData);
    return res.data;
  },

  cancelInvoice: async (id, reason) => {
    const res = await api.delete(`${BASE_URL}/invoices/${id}`, { data: { reason } });
    return res.data;
  },

  deleteReceipt: async (id) => {
    const res = await api.delete(`${BASE_URL}/receipts/${id}`);
    return res.data;
  },

  updateVendorBill: async (id, updateData) => {
    const res = await api.patch(`${BASE_URL}/vendor-bills/${id}`, updateData);
    return res.data;
  },

  deleteVendorBill: async (id) => {
    const res = await api.delete(`${BASE_URL}/vendor-bills/${id}`);
    return res.data;
  },

  // Smart Extraction & Ingestion
  extractImportData: async (rawContent, importType) => {
    const res = await api.post(`${BASE_URL}/import/extract`, { rawContent, importType });
    return res.data;
  },

  ingestImportData: async (importType, rows) => {
    const res = await api.post(`${BASE_URL}/import/ingest`, { importType, rows });
    return res.data;
  },

  deleteInvoice: async (id) => {
    const res = await api.delete(`${BASE_URL}/invoices/${id}?purge=true`);
    return res.data;
  },

  deleteProfitabilityItem: async (id) => {
    const res = await api.delete(`${BASE_URL}/costing/${id}`);
    return res.data;
  },

  updateProfitabilityItem: async (id, updateData) => {
    const res = await api.patch(`${BASE_URL}/costing/${id}`, updateData);
    return res.data;
  }
};
