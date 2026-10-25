import { Router } from "express";
import { authenticateUser } from "../../../middleware/authenticateUser.js";
import {
  downloadQRCodeImage,
  getWorkOrderQRCode,
  lookupWorkOrderByQR,
} from "./qr.controller.js";

const qrRouter = Router();

// QR endpoints require authentication to protect internal operational data
qrRouter.use(authenticateUser);

qrRouter.get("/work-orders/:id/qr-code", getWorkOrderQRCode);
qrRouter.get("/work-orders/:id/qr-download", downloadQRCodeImage);
qrRouter.get("/work-orders/qr-lookup/:codeOrId", lookupWorkOrderByQR);
qrRouter.get("/work-orders/qr-lookup", lookupWorkOrderByQR);

export default qrRouter;
