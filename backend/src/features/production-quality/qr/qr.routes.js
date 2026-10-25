import { Router } from "express";
import { authenticateUser } from "../../../middleware/authenticateUser.js";
import {
  downloadQRCodeImage,
  getWorkOrderQRCode,
  lookupWorkOrderByQR,
  getWorkOrderReportPdf,
} from "./qr.controller.js";

const qrRouter = Router();

// QR endpoints require authentication to protect internal operational data
qrRouter.use(authenticateUser);

qrRouter.get("/work-orders/:id/qr-code", getWorkOrderQRCode);
qrRouter.get("/work-orders/:id/qr-download", downloadQRCodeImage);
qrRouter.get("/work-orders/qr-lookup/:codeOrId", lookupWorkOrderByQR);
qrRouter.get("/work-orders/qr-lookup", lookupWorkOrderByQR);
qrRouter.post("/work-orders/qr-lookup", lookupWorkOrderByQR);
qrRouter.get("/work-orders/:id/report.pdf", getWorkOrderReportPdf);
qrRouter.get("/work-orders/:id/report", getWorkOrderReportPdf);

export default qrRouter;
