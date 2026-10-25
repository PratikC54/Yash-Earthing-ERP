import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../utils/apiResponse.js";
import { QRService } from "./qr.service.js";

export const getWorkOrderQRCode = asyncHandler(async (req, res) => {
  const result = await QRService.generateWorkOrderQR(req.params.id, req);
  return sendSuccess(res, {
    message: "Work Order QR code generated successfully",
    data: result,
  });
});

export const lookupWorkOrderByQR = asyncHandler(async (req, res) => {
  const queryStr = req.query.q || req.params.codeOrId || req.body?.code || req.body?.codeOrId;
  const result = await QRService.lookupWorkOrder(queryStr, req.user);
  return sendSuccess(res, {
    message: "Work Order details retrieved via QR lookup",
    data: result,
  });
});

export const downloadQRCodeImage = asyncHandler(async (req, res) => {
  const format = req.query.format === "svg" ? "svg" : "png";
  const result = await QRService.generateWorkOrderQR(req.params.id, req);

  if (format === "svg") {
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="QR-${result.workOrderNo}.svg"`
    );
    return res.send(result.svg);
  }

  // Base64 PNG to binary
  const base64Data = result.dataUrl.replace(/^data:image\/png;base64,/, "");
  const imgBuffer = Buffer.from(base64Data, "base64");
  res.setHeader("Content-Type", "image/png");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="QR-${result.workOrderNo}.png"`
  );
  return res.send(imgBuffer);
});

export const getWorkOrderReportPdf = asyncHandler(async (req, res) => {
  const { pdfBuffer, filename } = await QRService.getWorkOrderReportPdf(req.params.id);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  return res.send(pdfBuffer);
});
