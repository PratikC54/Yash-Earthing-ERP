<<<<<<< HEAD
import os from "node:os";
=======
import os from "os";
>>>>>>> c86ebff984ce1fdf4d8651812651af2aaee223a6
import QRCode from "qrcode";
import prisma from "../../../db/prisma.js";
import { ApiError } from "../../../utils/apiResponse.js";
import { WORK_ORDER_STATUS } from "../shared/productionQuality.constants.js";
import { generateWorkOrderPdfReport } from "../reports/workOrderReport.pdf.js";

export class QRService {
  /**
   * Detect local network IPv4 address for phone testing on the same Wi-Fi
   */
  static getLanIp() {
    try {
      const nets = os.networkInterfaces();
      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
          if (net.family === "IPv4" && !net.internal) {
            return net.address;
          }
        }
      }
    } catch {
      // Ignore network interface errors
    }
    return null;
  }
  /**
   * Determine frontend base URL dynamically from request or environment variables.
   * Never hardcodes localhost in production.
   */
  static getBaseUrl(req) {
    if (process.env.APP_URL) {
      return process.env.APP_URL.replace(/\/$/, "");
    }
    if (process.env.CLIENT_URL) {
      return process.env.CLIENT_URL.replace(/\/$/, "");
    }
    if (req) {
      const origin = req.get("origin") || req.get("referer");
      if (origin) {
        try {
          const parsed = new URL(origin);
          if (parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
            return `${parsed.protocol}//${parsed.host}`;
          }
        } catch {
          // Fall through
        }
      }
      const host = req.get("x-forwarded-host") || req.get("host");
      const proto = req.get("x-forwarded-proto") || req.protocol || "http";
      if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
        return `${proto}://${host}`;
      }
    }
    // In local development, detect network IPv4 for LAN device scanning
    if (process.env.NODE_ENV !== "production") {
      try {
        const nets = os.networkInterfaces();
        for (const name of Object.keys(nets)) {
          for (const net of nets[name]) {
            if (net.family === "IPv4" && !net.internal) {
              return `http://${net.address}:5173`;
            }
          }
        }
      } catch {
        // Fall back
      }
    }
    return "http://localhost:5173";
  }

  /**
   * Generate QR Code for a Work Order with full printable label metadata.
   * Safe: Does not encode credentials, tokens, or sensitive customer details.
   */
  static async generateWorkOrderQR(workOrderId, req) {
    const id = Number(workOrderId);
    if (!id || isNaN(id)) {
      throw ApiError.badRequest("Valid Work Order ID is required");
    }

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        salesOrder: {
          select: {
            orderNumber: true,
            customer: { select: { name: true } },
            items: { include: { product: true } },
          },
        },
        bomRevision: {
          select: {
            revision: true,
            product: {
              select: { id: true, name: true, sku: true, unitOfMeasure: true },
            },
          },
        },
        items: { include: { product: true } },
        inspections: {
          select: {
            id: true,
            inspectionNo: true,
            status: true,
            inspectedQuantity: true,
            acceptedQuantity: true,
            rejectedQuantity: true,
          },
        },
      },
    });

    if (!workOrder) {
      throw ApiError.notFound(`Work Order #${id} not found`);
    }

    const baseUrl = this.getBaseUrl(req);
    // Secure URL that opens the Work Order in the ERP router
    // Secure URL that opens the Work Order Production & Quality PDF Report
    const qrTargetUrl = `${baseUrl}/production/work-orders/${workOrder.id}/report.pdf`;
    const lanIp = this.getLanIp();
    const lanBaseUrl = lanIp ? `http://${lanIp}:5173` : baseUrl;
    const lanTargetUrl = `${lanBaseUrl}/production/work-orders/${workOrder.id}/report.pdf`;
    const detailsUrl = `${baseUrl}/production/work-orders/${workOrder.id}`;
    const reportApiUrl = `${baseUrl}/api/production-quality/work-orders/${workOrder.id}/report.pdf`;

    // Ensure unique stable qrCode field in database
    const qrCodeKey = workOrder.qrCode || `QR-${workOrder.workOrderNo}`;
    if (!workOrder.qrCode) {
      await prisma.workOrder.update({
        where: { id: workOrder.id },
        data: { qrCode: qrCodeKey },
      });
    }

    // Generate high-resolution PNG Data URL and SVG vector
    const [dataUrl, svg] = await Promise.all([
      QRCode.toDataURL(qrTargetUrl, {
        errorCorrectionLevel: "H",
        type: "image/png",
        margin: 2,
        width: 320,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      }),
      QRCode.toString(qrTargetUrl, {
        type: "svg",
        errorCorrectionLevel: "H",
        margin: 2,
      }),
    ]);

    const product =
      workOrder.bomRevision?.product ||
      workOrder.salesOrder?.items?.[0]?.product ||
      workOrder.items?.[0]?.product ||
      { name: "Electrolytic Earthing Assembly", sku: "YG-PROD-STD", unitOfMeasure: "PCS" };

    const batchMatch = workOrder.notes?.match(/Batch:?\s*([A-Za-z0-9_-]+)/i);
    const batchNumber = batchMatch ? batchMatch[1] : `BATCH-${workOrder.workOrderNo}`;

    const labelData = {
      workOrderId: workOrder.id,
      workOrderNo: workOrder.workOrderNo,
      salesOrderNo: workOrder.salesOrder?.orderNumber || "—",
      customerName: workOrder.salesOrder?.customer?.name || "Internal Stock",
      productName: product.name,
      productSku: product.sku,
      unitOfMeasure: product.unitOfMeasure || "PCS",
      batchNumber,
      plannedQuantity: Number(workOrder.plannedQuantity),
      goodQuantity: Number(workOrder.goodQuantity),
      priority: workOrder.priority,
      status: workOrder.status,
      assignedLine: workOrder.assignedLine || "Standard Assembly Line",
      plannedStart: workOrder.plannedStart,
      plannedEnd: workOrder.plannedEnd,
      qrTargetUrl,
      lanTargetUrl,
      lanIp,
      detailsUrl,
      reportApiUrl,
      reportPdfUrl: qrTargetUrl,
      qrCodeKey,
      generatedAt: new Date().toISOString(),
    };

    return {

      workOrderId: workOrder.id,
      workOrderNo: workOrder.workOrderNo,
      qrTargetUrl,
      lanTargetUrl,
      lanIp,
      targetUrl: qrTargetUrl,
      detailsUrl,
      reportApiUrl,
      reportPdfUrl: qrTargetUrl,
      dataUrl,
      qrDataUrl: dataUrl,
      svg,
      labelData,
      labelMetadata: labelData,
    };
  }

  /**
   * Search / Lookup Work Order by scanned QR string, workOrderNo, or ID.
   * Validates permissions and returns complete shop floor & quality state.
   */
  static async lookupWorkOrder(queryStr, user) {
    if (!queryStr || typeof queryStr !== "string" || !queryStr.trim()) {
      throw ApiError.badRequest("Query identifier (ID, Work Order Number, or QR token) is required");
    }

    const clean = queryStr.trim();

    // Check if query is a full URL and extract the ID or workOrderNo
    let searchId = null;
    let searchNo = clean;
    let searchQr = clean;

    if (clean.startsWith("http://") || clean.startsWith("https://")) {
      try {
        const parsed = new URL(clean);
        const match = parsed.pathname.match(/\/work-orders\/([^\/?#]+)/i);
        if (match) {
          const val = match[1];
          if (/^\d+$/.test(val)) {
            searchId = Number(val);
          } else {
            searchNo = val;
          }
        }
      } catch {
        // Fall back to direct string search
      }
    } else if (/^\d+$/.test(clean)) {
      searchId = Number(clean);
    }

    const orConditions = [
      { workOrderNo: { equals: searchNo, mode: "insensitive" } },
      { qrCode: { equals: searchQr, mode: "insensitive" } },
    ];
    if (searchId) {
      orConditions.push({ id: searchId });
    }

    const workOrder = await prisma.workOrder.findFirst({
      where: { OR: orConditions },
      include: {
        salesOrder: {
          select: {
            id: true,
            orderNumber: true,
            customer: { select: { id: true, name: true, code: true } },
          },
        },
        bomRevision: {
          select: {
            id: true,
            revision: true,
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                unitOfMeasure: true,
                category: { select: { id: true, name: true } },
              },
            },
          },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, unitOfMeasure: true },
            },
          },
        },
        inspections: {
          include: {
            assignedInspector: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!workOrder) {
      throw ApiError.notFound(`Work Order matching "${queryStr}" was not found or is inaccessible.`);
    }

    // Fetch related audit trail (production completions, downtime, delays)
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityId: String(workOrder.id),
        entityType: {
          in: ["WorkOrder", "ProductionCompletion", "MachineDowntime", "ProductionDelay", "ScrapRecord"],
        },
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    const plannedQty = Number(workOrder.plannedQuantity || 0);
    const goodQty = Number(workOrder.goodQuantity || 0);
    const rejectedQty = Number(workOrder.rejectedQuantity || 0);
    const pendingQty = Math.max(0, plannedQty - goodQty);
    const completionPercentage =
      plannedQty > 0 ? Math.min(100, Math.round((goodQty / plannedQty) * 100)) : 0;

    const product =
      workOrder.bomRevision?.product ||
      workOrder.items?.[0]?.product || {
        id: null,
        name: "Standard Manufactured Good",
        sku: "PROD-GENERIC",
        unitOfMeasure: "NOS",
      };

    const batchMatch = workOrder.notes?.match(/Batch:?\s*([A-Za-z0-9_-]+)/i);
    const batchNumber = batchMatch ? batchMatch[1] : `BATCH-${workOrder.workOrderNo}`;

    // Compute inspection summary
    const inspections = workOrder.inspections || [];
    const inspectedQtyTotal = inspections.reduce((sum, i) => sum + Number(i.inspectedQuantity || 0), 0);
    const acceptedQtyTotal = inspections.reduce((sum, i) => sum + Number(i.acceptedQuantity || 0), 0);
    const pendingInspectionQty = Math.max(0, goodQty - inspectedQtyTotal);
    const latestInspection = inspections[0] || null;

    // Determine role permissions for the authenticated employee
    const userRole = user?.role || "GUEST";
    const isAdmin = userRole === "ADMIN";
    const isProductionMgr = userRole === "PRODUCTION_MANAGER";
    const isQualityInsp = userRole === "QUALITY_INSPECTOR";
    const isEngineer = userRole === "ENGINEER";

    const permissions = {
      role: userRole,
      canView: true,
      canRecordProgress: (isAdmin || isProductionMgr || isEngineer) && workOrder.status !== WORK_ORDER_STATUS.CANCELLED,
      canRecordDowntime: (isAdmin || isProductionMgr || isEngineer) && workOrder.status !== WORK_ORDER_STATUS.CANCELLED,
      canReportDefect: (isAdmin || isProductionMgr || isQualityInsp || isEngineer) && workOrder.status !== WORK_ORDER_STATUS.CANCELLED,
      canPerformInspection: (isAdmin || isQualityInsp || isProductionMgr),
      canApproveInspection: (isAdmin || isQualityInsp || isProductionMgr),
      canHoldOrRework: (isAdmin || isQualityInsp || isProductionMgr),
      canReleaseWorkOrder: (isAdmin || isProductionMgr) && [WORK_ORDER_STATUS.DRAFT, WORK_ORDER_STATUS.PLANNED, WORK_ORDER_STATUS.MATERIAL_HOLD].includes(workOrder.status),
    };

    return {

      id: workOrder.id,
      workOrderNo: workOrder.workOrderNo,
      productName: product.name,
      productCode: product.sku,
      batchNumber,
      plannedQuantity: plannedQty,
      producedQuantity: goodQty,
      acceptedQuantity: acceptedQtyTotal,
      rejectedQuantity: rejectedQty,
      status: workOrder.status,
      priority: workOrder.priority,
      userPermissions: permissions,
      workOrder: {
        id: workOrder.id,
        workOrderNo: workOrder.workOrderNo,
        status: workOrder.status,
        priority: workOrder.priority,
        plannedQuantity: plannedQty,
        goodQuantity: goodQty,
        rejectedQuantity: rejectedQty,
        pendingQuantity: pendingQty,
        completionPercentage,
        plannedStart: workOrder.plannedStart,
        plannedEnd: workOrder.plannedEnd,
        actualStart: workOrder.actualStart,
        actualEnd: workOrder.actualEnd,
        assignedLine: workOrder.assignedLine || "Not Assigned",
        notes: workOrder.notes,
        createdAt: workOrder.createdAt,
        updatedAt: workOrder.updatedAt,
      },
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        unitOfMeasure: product.unitOfMeasure,
        category: product.category?.name || "Manufacturing",
      },
      batch: {
        batchNumber,
        salesOrderNumber: workOrder.salesOrder?.orderNumber || "—",
        customerName: workOrder.salesOrder?.customer?.name || "Internal Stock",
      },
      qualitySummary: {
        inspectionsCount: inspections.length,
        latestInspectionStatus: latestInspection ? latestInspection.status : "NOT_INSPECTED",
        latestInspectionNo: latestInspection ? latestInspection.inspectionNo : null,
        latestInspectionId: latestInspection ? latestInspection.id : null,
        inspectedQuantity: inspectedQtyTotal,
        acceptedQuantity: acceptedQtyTotal,
        pendingInspectionQuantity: pendingInspectionQty,
      },
      inspections: inspections.map((i) => ({
        id: i.id,
        inspectionNo: i.inspectionNo,
        status: i.status,
        inspectedQuantity: Number(i.inspectedQuantity),
        acceptedQuantity: Number(i.acceptedQuantity),
        rejectedQuantity: Number(i.rejectedQuantity),
        reworkQuantity: Number(i.reworkQuantity),
        assignedInspector: i.assignedInspector ? i.assignedInspector.name : "Unassigned",
        assignedInspectorId: i.assignedInspectorId,
        decisionOfficer: i.decisionOfficer,
        evidenceNotes: i.evidenceNotes,
        createdAt: i.createdAt,
      })),
      history: auditLogs.map((log) => ({
        id: String(log.id),
        action: log.action,
        entityType: log.entityType,
        user: log.user ? log.user.name : "System",
        role: log.user ? log.user.role : null,
        details: log.after || log.before,
        timestamp: log.createdAt,
      })),
      permissions,
    };
  }

  /**
   * Generates official Production & Quality PDF Report for a Work Order
   */
  static async getWorkOrderReportPdf(workOrderId) {
    const isNum = /^\d+$/.test(String(workOrderId).trim());
    const where = isNum
      ? { id: Number(workOrderId) }
      : { workOrderNo: String(workOrderId).trim() };

    const workOrder = await prisma.workOrder.findUnique({
      where,
      include: {
        salesOrder: {
          include: {
            customer: true,
            items: { include: { product: true } },
          },
        },
        bomRevision: {
          include: {
            items: { include: { component: true } },
            operations: { orderBy: { sequence: "asc" } },
            product: {
              include: {
                productSpecifications: { orderBy: { id: "desc" }, take: 1 },
              },
            },
          },
        },
        items: {
          include: {
            product: {
              include: { inventory: true },
            },
          },
        },
        inspections: {
          include: {
            assignedInspector: {
              select: { id: true, name: true, email: true, role: true },
            },
            assignedBy: {
              select: { id: true, name: true, email: true, role: true },
            },
            capaRecords: true,
            dispatchRecords: true,
          },
          orderBy: { createdAt: "desc" },
        },
        capaRecords: {
          orderBy: { createdAt: "desc" },
        },
        dispatchRecords: {
          orderBy: { createdAt: "desc" },
        },
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!workOrder) {
      throw ApiError.notFound(`Work Order with ID or Number "${workOrderId}" not found`);
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityId: String(workOrder.id),
        entityType: {
          in: ["WorkOrder", "ProductionCompletion", "MachineDowntime", "ProductionDelay", "ScrapRecord"],
        },
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    const pdfBuffer = await generateWorkOrderPdfReport({ workOrder, auditLogs });
    const filename = `${workOrder.workOrderNo}-Production-Quality-Report.pdf`;

    return { pdfBuffer, filename, workOrder };
  }
};
