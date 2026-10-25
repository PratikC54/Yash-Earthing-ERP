import React, { useState, useEffect, useRef, useMemo } from "react";
import QRCode from "qrcode";
import {
  X,
  Printer,
  Download,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronDown,
  RefreshCw,
  FileText,
} from "lucide-react";
import qrService from "../../services/qrService";
import productionService from "../../services/productionService";

export default function QRLabelModal({
  isOpen,
  onClose,
  workOrderId,
  workOrderNo,
  workOrder = null,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeOrder, setActiveOrder] = useState(workOrder);
  const [qrImage, setQrImage] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState(null);
  const [toast, setToast] = useState(null);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [currentId, setCurrentId] = useState(workOrderId || workOrder?.id);
  const [serverQrInfo, setServerQrInfo] = useState(null);
  const [useLanForMobile, setUseLanForMobile] = useState(true);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const printAreaRef = useRef(null);

  // Sync when modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setToast(null);

      if (workOrder) {
        setActiveOrder(workOrder);
        setCurrentId(workOrder.id || workOrderId);
      } else if (workOrderId && workOrderId !== "undefined" && workOrderId !== "null") {
        setCurrentId(workOrderId);
        fetchOrderDetails(workOrderId);
      } else {
        // Fallback: fetch recent work orders so user can select
        loadRecentOrdersAndSelect();
      }
    } else {
      setQrImage(null);
      setServerQrInfo(null);
    }
  }, [isOpen, workOrderId, workOrder]);

  // Fetch full details if only ID was passed
  const fetchOrderDetails = async (id) => {
    if (!id || id === "undefined" || id === "null") return;
    try {
      setLoading(true);
      setError(null);
      const res = await productionService.getWorkOrderById(id);
      if (res?.data || res?.workOrder) {
        setActiveOrder(res.data || res.workOrder);
      } else if (res && !res.error) {
        setActiveOrder(res);
      } else {
        // Fallback to QR service metadata
        const qrMeta = await qrService.getQRCode(id);
        if (qrMeta?.data?.lookupData) {
          const lData = qrMeta.data.lookupData;
          setActiveOrder({
            id: id,
            workOrderNo: lData.workOrderNo,
            productName: lData.productName,
            productSku: lData.productSku,
            batchNumber: lData.batchNumber,
            plannedQuantity: lData.plannedQuantity,
            status: lData.status,
            priority: lData.priority,
            plannedEnd: lData.plannedEnd,
          });
        } else {
          setError(res?.message || "Failed to load work order details.");
        }
      }
    } catch (err) {
      console.warn("Could not fetch work order details:", err);
      // Attempt fallback through qrService
      try {
        const qrMeta = await qrService.getQRCode(id);
        if (qrMeta?.data?.lookupData) {
          const lData = qrMeta.data.lookupData;
          setActiveOrder({
            id: id,
            workOrderNo: lData.workOrderNo,
            productName: lData.productName,
            productSku: lData.productSku,
            batchNumber: lData.batchNumber,
            plannedQuantity: lData.plannedQuantity,
            status: lData.status,
            priority: lData.priority,
            plannedEnd: lData.plannedEnd,
          });
        } else {
          setError(err?.message || "Failed to load work order details.");
        }
      } catch (fallbackErr) {
        setError(fallbackErr?.message || "Failed to load work order details.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadRecentOrdersAndSelect = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await productionService.listWorkOrders({ limit: 25 });
      const orders = res?.data || res?.workOrders || (Array.isArray(res) ? res : []);
      if (Array.isArray(orders) && orders.length > 0) {
        setAvailableOrders(orders);
        const first = orders[0];
        setCurrentId(first.id);
        setActiveOrder(first);
      } else {
        setError("No work orders available in the ERP database.");
      }
    } catch (err) {
      setError(err?.message || "Failed to load work orders list.");
    } finally {
      setLoading(false);
    }
  };

  // Safe field resolution - strictly preventing undefined or null
  const resolvedWorkOrderId = currentId || activeOrder?.id || workOrderId || null;

  const woNo = useMemo(() => {
    const raw =
      activeOrder?.workOrderNo ||
      activeOrder?.workOrderNumber ||
      activeOrder?.orderNumber ||
      workOrderNo;
    return raw && String(raw).trim() ? String(raw).trim() : (resolvedWorkOrderId ? `WO-${resolvedWorkOrderId}` : "N/A");
  }, [activeOrder, workOrderNo, resolvedWorkOrderId]);

  const productName = useMemo(() => {
    const raw =
      activeOrder?.productName ||
      activeOrder?.product?.name ||
      activeOrder?.bomRevision?.product?.name ||
      activeOrder?.items?.[0]?.product?.name ||
      activeOrder?.salesOrder?.productSummary;
    return raw && String(raw).trim() ? String(raw).trim() : "Standard Manufactured Product";
  }, [activeOrder]);

  const productCode = useMemo(() => {
    const raw =
      activeOrder?.productCode ||
      activeOrder?.productSku ||
      activeOrder?.sku ||
      activeOrder?.product?.sku ||
      activeOrder?.bomRevision?.product?.sku ||
      activeOrder?.items?.[0]?.product?.sku;
    return raw && String(raw).trim() ? String(raw).trim() : "N/A";
  }, [activeOrder]);

  const batchNumber = useMemo(() => {
    const raw =
      activeOrder?.batchNumber ||
      activeOrder?.batch?.batchNumber ||
      activeOrder?.batchNo;
    return raw && String(raw).trim() ? String(raw).trim() : (woNo !== "N/A" ? `BTH-${woNo.replace(/^WO-?/i, "")}` : "BATCH-01");
  }, [activeOrder, woNo]);

  const plannedQty = useMemo(() => {
    const val =
      activeOrder?.plannedQuantity ??
      activeOrder?.quantity ??
      activeOrder?.targetQuantity;
    return val !== undefined && val !== null ? `${val} Units` : "100 Units";
  }, [activeOrder]);

  const status = useMemo(() => {
    const raw = activeOrder?.status || "PLANNED";
    return String(raw).toUpperCase();
  }, [activeOrder]);

  const priority = useMemo(() => {
    const raw = activeOrder?.priority || "MEDIUM";
    return String(raw).toUpperCase();
  }, [activeOrder]);

  const dueDate = useMemo(() => {
    const raw =
      activeOrder?.plannedCompletionDate ||
      activeOrder?.plannedEnd ||
      activeOrder?.dueDate;
    if (!raw) return "N/A";
    try {
      return new Date(raw).toLocaleDateString();
    } catch {
      return "N/A";
    }
  }, [activeOrder]);

  // Fetch verified backend QR metadata (including detected LAN address for mobile devices)
  useEffect(() => {
    if (!isOpen || !resolvedWorkOrderId) {
      setServerQrInfo(null);
      return;
    }
    let isMounted = true;
    qrService
      .getQRCode(resolvedWorkOrderId)
      .then((res) => {
        if (isMounted && res?.data) {
          setServerQrInfo(res.data);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch backend QR info:", err);
      });
    return () => {
      isMounted = false;
    };
  }, [isOpen, resolvedWorkOrderId]);

  // Semantic status and priority color helpers for QR preview card
  const getStatusColor = (st) => {
    const s = String(st || "").toUpperCase();
    if (s.includes("PASS") || s.includes("COMPLET") || s.includes("RELEASE") || s.includes("READY")) return "text-emerald-400";
    if (s.includes("FAIL") || s.includes("REJECT") || s.includes("CANCEL")) return "text-rose-400";
    if (s.includes("HOLD") || s.includes("BLOCK") || s.includes("WAIT")) return "text-amber-400";
    if (s.includes("PROGRESS") || s.includes("RUN") || s.includes("EXEC")) return "text-blue-400";
    return "text-emerald-400";
  };

  const getPriorityColor = (pr) => {
    const p = String(pr || "").toUpperCase();
    if (p.includes("HIGH") || p.includes("URGENT") || p.includes("CRITICAL")) return "text-rose-400 font-bold";
    if (p.includes("MED")) return "text-amber-400 font-bold";
    if (p.includes("LOW")) return "text-emerald-400 font-bold";
    return "text-[#f1f5f9] font-bold";
  };

  // Dynamic application target URL using canonical /production/work-orders/:id route
  const targetUrl = useMemo(() => {
    if (!resolvedWorkOrderId) return "";

    // 1. Mobile LAN target if available and toggle enabled
    if (useLanForMobile && serverQrInfo?.lanTargetUrl) {
      return serverQrInfo.lanTargetUrl;
    }

    // 2. Server returned verified targetUrl
    if (serverQrInfo?.targetUrl || serverQrInfo?.qrTargetUrl) {
      return serverQrInfo.targetUrl || serverQrInfo.qrTargetUrl;
    }

    // 3. Environment or Vite public base URL override
    const explicitAppUrl =
      typeof window !== "undefined" && window.__ERP_CONFIG__?.APP_URL;
    if (explicitAppUrl) {
      return `${explicitAppUrl.replace(/\/+$/, "")}/production/work-orders/${resolvedWorkOrderId}/report.pdf`;
    }

    // 4. Detected LAN IP from server
    if (serverQrInfo?.lanIp) {
      const port =
        typeof window !== "undefined" && window.location.port
          ? `:${window.location.port}`
          : "";
      const protocol =
        typeof window !== "undefined" ? window.location.protocol : "http:";
      return `${protocol}//${serverQrInfo.lanIp}${port}/production/work-orders/${resolvedWorkOrderId}/report.pdf`;
    }

    // 5. In browser environment: use window.location.origin
    if (typeof window !== "undefined" && window.location.origin) {
      return `${window.location.origin}/production/work-orders/${resolvedWorkOrderId}/report.pdf`;
    }

    // 6. Absolute default
    return `http://localhost:5173/production/work-orders/${resolvedWorkOrderId}/report.pdf`;
  }, [resolvedWorkOrderId, serverQrInfo, useLanForMobile]);

  // Generate QR Image client-side with fallback
  useEffect(() => {
    if (!isOpen || !targetUrl) return;

    let isMounted = true;
    setQrLoading(true);
    setQrError(null);

    QRCode.toDataURL(targetUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (isMounted) {
          setQrImage(url);
          setQrLoading(false);
        }
      })
      .catch((err) => {
        console.error("QR Code generation error:", err);
        if (isMounted) {
          // If server provided pre-generated base64, use it
          if (serverQrInfo?.qrCodeDataUri || serverQrInfo?.qrImage) {
            setQrImage(serverQrInfo.qrCodeDataUri || serverQrInfo.qrImage);
            setQrLoading(false);
          } else {
            setQrError("Could not generate QR code image.");
            setQrLoading(false);
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, targetUrl, serverQrInfo]);

  // Handlers
  const handleOrderChange = (e) => {
    const selectedId = e.target.value;
    setCurrentId(selectedId);
    const found = availableOrders.find((o) => String(o.id) === String(selectedId));
    if (found) {
      setActiveOrder(found);
    } else {
      fetchOrderDetails(selectedId);
    }
  };

  const handleCopyLink = () => {
    if (!targetUrl) return;
    navigator.clipboard
      .writeText(targetUrl)
      .then(() => {
        setToast({
          message: "PDF Report URL copied to clipboard!",
          type: "success",
        });
        setTimeout(() => setToast(null), 3000);
      })
      .catch(() => {
        setToast({ message: "Failed to copy link.", type: "error" });
        setTimeout(() => setToast(null), 3000);
      });
  };

  const handleDownloadQRCode = () => {
    if (!qrImage) {
      setToast({
        message: "QR code is still loading. Please wait a moment.",
        type: "error",
      });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    try {
      const link = document.createElement("a");
      link.href = qrImage;
      link.download = `${woNo}_QR_Label.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setToast({
        message: "QR Code image downloaded successfully!",
        type: "success",
      });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error("Failed to trigger QR download:", err);
      setToast({ message: "Could not download QR image.", type: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDownloadPdfReport = async () => {
    if (!resolvedWorkOrderId) return;
    try {
      setPdfDownloading(true);
      const blob = await productionService.downloadWorkOrderReport(
        resolvedWorkOrderId
      );
      const dlUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = dlUrl;
      link.download = `WorkOrder_Report_${woNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(dlUrl);

      setToast({
        message: "PDF Report downloaded successfully!",
        type: "success",
      });
      setTimeout(() => setToast(null), 3500);
    } catch (err) {
      console.error("Failed to download PDF report:", err);
      setToast({
        message: "Failed to download PDF report. Please try again.",
        type: "error",
      });
      setTimeout(() => setToast(null), 3500);
    } finally {
      setPdfDownloading(false);
    }
  };

  const handlePrint = () => {
    if (!qrImage) {
      setToast({
        message: "QR code is still loading. Please wait before printing.",
        type: "error",
      });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs">
      {/* Print Specific CSS to isolate printable QR label on physical sticker printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-qr-label, #printable-qr-label * {
            visibility: visible !important;
          }
          #printable-qr-label {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 105mm !important;
            max-width: 105mm !important;
            padding: 8mm !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            border: 2px dashed #334155 !important;
            border-radius: 6px !important;
            box-shadow: none !important;
            display: flex !important;
            flex-direction: row !important;
            page-break-after: always;
          }
          #printable-qr-label .qr-preview-info-area {
            background: #ffffff !important;
            color: #0f172a !important;
          }
          #printable-qr-label .qr-preview-info-area * {
            color: #0f172a !important;
            border-color: #cbd5e1 !important;
            background: transparent !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Modal Dialog Container with Module Navy Theme */}
      <div className="relative w-full max-w-lg bg-[#10182f] border border-[#1e2a4a] rounded-2xl shadow-2xl overflow-hidden text-[#f1f5f9] max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[#1e2a4a] bg-[#0b172d] no-print shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-[#f1f5f9] tracking-tight leading-snug">
                Work Order QR Code
              </h3>
              <p className="text-xs text-[#94a3b8] font-medium truncate mt-0.5">
                {woNo !== "N/A" ? `Work Order: ${woNo}` : "Production & Quality Module"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#1e2a4a] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 bg-[#10182f]">
          {/* Order Selector (if opened without pre-selected ID) */}
          {!workOrderId && !workOrder && availableOrders.length > 0 && (
            <div className="mb-4 no-print">
              <label className="block text-xs font-semibold text-[#94a3b8] mb-1.5">
                Select Work Order to Display
              </label>
              <div className="relative">
                <select
                  value={currentId || ""}
                  onChange={handleOrderChange}
                  className="w-full px-3 py-2 rounded-xl bg-[#0a1020] border border-[#1e2a4a] text-xs text-[#f1f5f9] appearance-none focus:outline-none focus:border-blue-500 pr-8 cursor-pointer"
                >
                  {availableOrders.map((wo) => {
                    const num = wo.workOrderNo || wo.workOrderNumber || `WO-${wo.id}`;
                    const name = wo.productName || "Work Order";
                    return (
                      <option key={wo.id} value={wo.id} className="bg-[#0a1020] text-[#f1f5f9]">
                        {num} — {name} ({wo.status || "PLANNED"})
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="w-4 h-4 text-[#94a3b8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Toast Notification Alert */}
          {toast && (
            <div
              className={`p-3 mb-4 rounded-xl text-xs flex items-center gap-2.5 animate-in fade-in duration-200 ${
                toast.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span className="font-medium">{toast.message}</span>
            </div>
          )}

          {/* General Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-[#94a3b8]">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm">Loading Work Order details...</p>
            </div>
          )}

          {/* Error Message */}
          {error && !loading && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3 my-4">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">{error}</div>
            </div>
          )}

          {/* QR Code and Work Order Details */}
          {!loading && !error && (
            <div className="space-y-4">
              {/* Module-themed QR Preview Card */}
              <div
                id="printable-qr-label"
                ref={printAreaRef}
                className="bg-[#0b172d] text-[#f1f5f9] rounded-xl p-3.5 sm:p-5 border border-[#1e2a4a] shadow-inner flex flex-col sm:flex-row items-center gap-4 sm:gap-5"
              >
                {/* QR Code Graphic Box */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center min-w-[144px] min-h-[144px]">
                    {qrLoading && (
                      <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mb-1 text-blue-600" />
                        <span className="text-[10px] font-medium">Generating...</span>
                      </div>
                    )}
                    {qrError && (
                      <div className="text-center p-2 text-rose-600">
                        <AlertCircle className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-[10px] block">{qrError}</span>
                      </div>
                    )}
                    {!qrLoading && !qrError && qrImage && (
                      <img
                        src={qrImage}
                        alt={`QR Code for ${woNo}`}
                        className="w-36 h-36 object-contain"
                      />
                    )}
                  </div>
                  <span className="text-[9px] font-mono font-bold text-[#94a3b8] mt-1.5 uppercase tracking-wider text-center">
                    Scan to open PDF report
                  </span>
                </div>

                {/* Work Order Metadata Block */}
                <div className="qr-preview-info-area flex-1 w-full text-left space-y-1.5 text-xs">
                  <div className="border-b border-[#1e2a4a] pb-1.5">
                    <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                      Yash Group ERP • Module 4
                    </span>
                    <h4 className="text-base font-bold text-[#f1f5f9] tracking-tight leading-tight">
                      {woNo}
                    </h4>
                    <p className="text-xs font-medium text-slate-300 truncate mt-0.5">
                      {productName}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-1 text-[11px]">
                    <div className="bg-[#0a1020] p-1.5 rounded-lg border border-[#1e2a4a]/60">
                      <span className="text-[#94a3b8] block text-[9px] uppercase font-bold">
                        Product Code / SKU
                      </span>
                      <span className="font-mono font-bold text-[#f1f5f9] truncate block">{productCode}</span>
                    </div>
                    <div className="bg-[#0a1020] p-1.5 rounded-lg border border-[#1e2a4a]/60">
                      <span className="text-[#94a3b8] block text-[9px] uppercase font-bold">
                        Production Batch
                      </span>
                      <span className="font-mono font-bold text-[#f1f5f9] truncate block">{batchNumber}</span>
                    </div>
                    <div className="bg-[#0a1020] p-1.5 rounded-lg border border-[#1e2a4a]/60">
                      <span className="text-[#94a3b8] block text-[9px] uppercase font-bold">
                        Planned Qty
                      </span>
                      <span className="font-bold text-[#f1f5f9]">{plannedQty}</span>
                    </div>
                    <div className="bg-[#0a1020] p-1.5 rounded-lg border border-[#1e2a4a]/60">
                      <span className="text-[#94a3b8] block text-[9px] uppercase font-bold">
                        Status
                      </span>
                      <span className={`font-bold uppercase ${getStatusColor(status)}`}>{status}</span>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-[#1e2a4a] flex items-center justify-between text-[9px] text-[#94a3b8]">
                    <span>
                      Priority: <strong className={`uppercase ${getPriorityColor(priority)}`}>{priority}</strong>
                    </span>
                    <span>Due: <strong className="text-[#f1f5f9]">{dueDate}</strong></span>
                  </div>
                </div>
              </div>

              {/* Mobile Phone / Network Mode Notice */}
              {serverQrInfo?.lanIp && (
                <div className="p-2.5 rounded-xl bg-[#0a1020] border border-[#1e2a4a] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs no-print">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="text-[11px] text-[#94a3b8]">
                      Target: <strong className="text-[#f1f5f9]">{useLanForMobile ? `Wi-Fi Phone (${serverQrInfo.lanIp})` : "Localhost"}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseLanForMobile(!useLanForMobile)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-medium underline text-left sm:text-right cursor-pointer"
                  >
                    {useLanForMobile ? "Switch to Localhost" : "Switch to Mobile Wi-Fi"}
                  </button>
                </div>
              )}

              {/* Encoded PDF Report URL and Copy Action */}
              <div className="p-3 rounded-xl bg-[#0a1020] border border-[#1e2a4a] flex items-center justify-between gap-3 text-xs no-print">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-semibold text-[#94a3b8] block">
                    Encoded Work Order URL
                  </span>
                  <div className="font-mono text-[#f1f5f9] truncate text-[11px] mt-0.5 select-all">
                    {targetUrl || "URL pending..."}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  disabled={!targetUrl}
                  className="px-3 py-1.5 rounded-lg bg-[#10182f] hover:bg-[#1e2a4a] text-[#f1f5f9] border border-[#1e2a4a] disabled:opacity-40 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  title="Copy PDF Report Link"
                >
                  <Copy className="w-3.5 h-3.5 text-blue-400" />
                  <span>Copy PDF Report Link</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 px-4 sm:px-5 py-3 sm:py-4 border-t border-[#1e2a4a] bg-[#0b172d] no-print shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-semibold text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#10182f] transition-colors cursor-pointer text-center border border-transparent"
          >
            Close
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={pdfDownloading || !resolvedWorkOrderId}
              onClick={handleDownloadPdfReport}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors disabled:opacity-50 cursor-pointer border border-emerald-500 shadow-sm"
              title="Download PDF Report"
            >
              <FileText className="w-4 h-4 text-white" />
              <span>{pdfDownloading ? "Downloading..." : "Download PDF Report"}</span>
            </button>
            <button
              type="button"
              disabled={qrLoading || !qrImage}
              onClick={handleDownloadQRCode}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-xs font-bold text-slate-800 transition-colors disabled:opacity-50 cursor-pointer border border-slate-300 shadow-sm"
              title="Download QR Code PNG Image"
            >
              <Download className="w-4 h-4 text-slate-700" />
              <span>Download QR Code</span>
            </button>
            <button
              type="button"
              disabled={qrLoading || !qrImage}
              onClick={handlePrint}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#d4ff00] hover:bg-[#c2ed00] text-xs font-black text-black transition-colors shadow-sm disabled:opacity-50 cursor-pointer border border-lime-400"
              title="Print QR Code Label"
            >
              <Printer className="w-4 h-4 text-black" />
              <span>Print QR Code</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
