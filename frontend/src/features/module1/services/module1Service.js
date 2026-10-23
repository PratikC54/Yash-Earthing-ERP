import api from "../../../api/api";

export const module1Service = {
  // ===================== LEADS =====================
  async getLeads(params = {}) {
    const res = await api.get("/leads", { params });
    return res.data;
  },

  async getLeadById(id) {
    const res = await api.get(`/leads/${id}`);
    return res.data;
  },

  async createLead(data) {
    const res = await api.post("/leads", data);
    return res.data;
  },

  async updateLead(id, data) {
    const res = await api.put(`/leads/${id}`, data);
    return res.data;
  },

  async deleteLead(id) {
    const res = await api.delete(`/leads/${id}`);
    return res.data;
  },

  async logCall(leadId, callData) {
    const res = await api.post(`/leads/${leadId}/call`, callData);
    return res.data;
  },

  async getFollowups(params = {}) {
    const res = await api.get("/leads/followups", { params });
    return res.data;
  },

  async getPipelineStats() {
    const res = await api.get("/leads/stats");
    return res.data;
  },

  async getProductsCatalog() {
    const res = await api.get("/leads/products");
    return res.data;
  },

  async bulkImportLeads(leadsArray) {
    const res = await api.post("/leads/import", { leads: leadsArray });
    return res.data;
  },

  async reassignLead(id, data) {
    const res = await api.patch(`/leads/${id}/assign`, data);
    return res.data;
  },

  async getConsultants() {
    const res = await api.get("/users/approvals?status=APPROVED");
    return res.data;
  },

  // ===================== QUOTATIONS =====================
  async getQuotations(params = {}) {
    const res = await api.get("/quotations", { params });
    return res.data;
  },

  async getQuotationById(id) {
    const res = await api.get(`/quotations/${id}`);
    return res.data;
  },

  async createQuotation(data) {
    const res = await api.post("/quotations", data);
    return res.data;
  },

  async reviseQuotation(id, negotiationData) {
    const res = await api.post(`/quotations/${id}/revise`, negotiationData);
    return res.data;
  },

  async finalizeProformaInvoice(id) {
    const res = await api.post(`/quotations/${id}/finalize-pi`);
    return res.data;
  },

  async finalizePI(id) {
    return this.finalizeProformaInvoice(id);
  },

  async sendQuotationEmail(id, emailData) {
    const res = await api.post(`/quotations/${id}/send-email`, emailData);
    return res.data;
  },

  async deleteQuotation(id) {
    const res = await api.delete(`/quotations/${id}`);
    return res.data;
  },

  // ===================== SALES ORDERS & PO =====================
  async getOrders(params = {}) {
    const res = await api.get("/orders", { params });
    return res.data;
  },

  async getOrderById(id) {
    const res = await api.get(`/orders/${id}`);
    return res.data;
  },

  async issueCustomerPO(quotationId, poData) {
    const res = await api.post(`/orders/po/${quotationId}`, poData);
    return res.data;
  },

  async createSalesOrder(data) {
    const res = await api.post("/orders", data);
    return res.data;
  },

  async checkInventory(orderId) {
    const res = await api.post(`/orders/${orderId}/check-inventory`);
    return res.data;
  },

  async checkStockAndReserve(orderId) {
    return this.checkInventory(orderId);
  },

  async updateSalesOrder(id, data) {
    const res = await api.put(`/orders/${id}`, data);
    return res.data;
  },

  async deleteSalesOrder(id) {
    const res = await api.delete(`/orders/${id}`);
    return res.data;
  },
};

export default module1Service;
