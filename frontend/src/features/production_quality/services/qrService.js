import axiosInstance from "../../../services/axiosInstance";

/**
 * QR Code-Based Work Order Tracking Service
 * Interfaces with Module 4 QR endpoints
 */
export const qrService = {
  /**
   * Fetch QR code data URL, SVG, and printable label payload for a Work Order
   */
  getQRCode: async (workOrderId) => {
    return await axiosInstance.get(`/production-quality/work-orders/${workOrderId}/qr-code`);
  },

  /**
   * Download QR code directly as PNG or SVG blob
   */
  downloadQR: async (workOrderId, format = "png") => {
    return await axiosInstance.get(
      `/production-quality/work-orders/${workOrderId}/qr-download?format=${format}`,
      { responseType: "blob" }
    );
  },

  /**
   * Fetch work order PDF report as blob
   */
  getWorkOrderReportPdf: async (workOrderId) => {
    return await axiosInstance.get(
      `/production-quality/work-orders/${workOrderId}/report.pdf`,
      { responseType: "blob" }
    );
  },

  /**
   * Look up work order details by scanned URL, QR token, Work Order Number, or ID
   */
  lookupQR: async (codeOrId) => {
    return await axiosInstance.post(`/production-quality/work-orders/qr-lookup`, {
      codeOrId: String(codeOrId).trim(),
    });
  },

  /**
   * Record shop floor production progress from QR details screen
   */
  recordProgress: async (payload) => {
    return await axiosInstance.post("/production-quality/shop-floor/entry", payload);
  },

  /**
   * Report machine breakdown / downtime event
   */
  reportDowntime: async (payload) => {
    return await axiosInstance.post("/production-quality/shop-floor/downtime", payload);
  },

  /**
   * Report scrap / quality defect / non-conformance
   */
  reportDefect: async (payload) => {
    return await axiosInstance.post("/production-quality/non-conformance", payload);
  },
};

export default qrService;
