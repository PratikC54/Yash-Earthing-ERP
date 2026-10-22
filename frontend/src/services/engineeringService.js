import api from '../api/api';

const BASE_URL = '/engineering';

export const engineeringService = {
  // KPIs
  getDashboardKpis: async () => {
    const res = await api.get(`${BASE_URL}/dashboard/kpis`);
    return res.data;
  },

  // Categories & Templates
  getCategories: async () => {
    const res = await api.get(`${BASE_URL}/categories`);
    return res.data;
  },

  getCategoryTemplate: async (categoryId) => {
    const res = await api.get(`${BASE_URL}/categories/${categoryId}/spec-template`);
    return res.data;
  },

  // Products
  getProducts: async (params = {}) => {
    const res = await api.get(`${BASE_URL}/products`, { params });
    return res.data;
  },

  getProductById: async (id) => {
    const res = await api.get(`${BASE_URL}/products/${id}`);
    return res.data;
  },

  createProduct: async (productData) => {
    const res = await api.post(`${BASE_URL}/products`, productData);
    return res.data;
  },

  updateProduct: async (id, productData) => {
    const res = await api.patch(`${BASE_URL}/products/${id}`, productData);
    return res.data;
  },

  archiveProduct: async (id) => {
    const res = await api.post(`${BASE_URL}/products/${id}/archive`);
    return res.data;
  },

  updateSpecifications: async (productId, specifications) => {
    const res = await api.put(`${BASE_URL}/products/${productId}/specifications`, { specifications });
    return res.data;
  },

  // BOMs & Revisions
  getBoms: async () => {
    const res = await api.get(`${BASE_URL}/boms`);
    return res.data;
  },

  getBomById: async (id) => {
    const res = await api.get(`${BASE_URL}/products/${id}/boms`);
    return res.data;
  },

  createBom: async (data) => {
    const res = await api.post(`${BASE_URL}/products/${data.productId}/boms`, data);
    return res.data;
  },

  updateRevisionItems: async (revisionId, data) => {
    const res = await api.put(`${BASE_URL}/bom-revisions/${revisionId}/items`, data);
    return res.data;
  },

  createNextRevision: async (bomId, changeReason) => {
    const res = await api.post(`${BASE_URL}/boms/${bomId}/revisions`, { changeReason });
    return res.data;
  },

  submitRevision: async (revisionId) => {
    const res = await api.post(`${BASE_URL}/bom-revisions/${revisionId}/submit`);
    return res.data;
  },

  approveRevision: async (revisionId) => {
    const res = await api.post(`${BASE_URL}/bom-revisions/${revisionId}/approve`);
    return res.data;
  },

  rejectRevision: async (revisionId, comment) => {
    const res = await api.post(`${BASE_URL}/bom-revisions/${revisionId}/reject`, { comment });
    return res.data;
  },

  releaseRevision: async (revisionId) => {
    const res = await api.post(`${BASE_URL}/bom-revisions/${revisionId}/release`);
    return res.data;
  },

  calculateRevisionCost: async (revisionId) => {
    const res = await api.get(`${BASE_URL}/bom-revisions/${revisionId}/cost`);
    return res.data;
  },

  compareRevisions: async (bomId, fromRev, toRev) => {
    const res = await api.get(`${BASE_URL}/boms/${bomId}/compare?from=${encodeURIComponent(fromRev)}&to=${encodeURIComponent(toRev)}`);
    return res.data;
  },

  // Costing Policy
  getCostingPolicy: async () => {
    const res = await api.get(`${BASE_URL}/costing-policy`);
    return res.data;
  },

  updateCostingPolicy: async (policyData) => {
    const res = await api.put(`${BASE_URL}/costing-policy`, policyData);
    return res.data;
  },

  // Shortage Calculation
  calculateShortage: async (productId, orderQuantity) => {
    const res = await api.post(`${BASE_URL}/shortages/calculate`, { productId, orderQuantity });
    return res.data;
  },

  // Drawings
  getDrawings: async (params = {}) => {
    const res = await api.get(`${BASE_URL}/drawings`, { params });
    return res.data;
  },

  createDrawing: async (drawingData) => {
    const res = await api.post(`${BASE_URL}/drawings`, drawingData);
    return res.data;
  },

  downloadDrawing: async (drawingId) => {
    const res = await api.get(`${BASE_URL}/drawings/${drawingId}/download`);
    return res.data;
  }
};
