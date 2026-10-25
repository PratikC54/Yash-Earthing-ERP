import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FileText,
  Download,
  Printer,
  ExternalLink,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import ModuleHeader from "../components/shared/ModuleHeader";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import Loader from "../../../components/common/Loader";
import axiosInstance from "../../../services/axiosInstance";

export default function WorkOrderReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const [filename, setFilename] = useState(`WO-${id}-Production-Quality-Report.pdf`);
  const [workOrderMeta, setWorkOrderMeta] = useState(null);
  const iframeRef = useRef(null);

  const fetchPdfReport = async () => {
    try {
      setLoading(true);
      setError(null);

      // Clean up previous blob URL if any
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }

      const response = await axiosInstance.get(
        `/production-quality/work-orders/${id}/report.pdf`,
        {
          responseType: "blob",
        }
      );

      // Extract filename from content-disposition header if present
      const disposition = response.headers?.["content-disposition"] || "";
      const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
      const resolvedFilename = filenameMatch
        ? filenameMatch[1]
        : `WO-${id}-Production-Quality-Report.pdf`;
      setFilename(resolvedFilename);

      // Create blob with explicit application/pdf MIME type
      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const objectUrl = URL.createObjectURL(pdfBlob);
      setBlobUrl(objectUrl);

      // Fetch quick metadata for header display
      try {
        const metaRes = await axiosInstance.get(`/production-quality/work-orders/${id}`);
        if (metaRes?.data) {
          setWorkOrderMeta(metaRes.data);
        }
      } catch {
        // Metadata is non-critical, PDF is the primary payload
      }
    } catch (err) {
      console.error("Failed to load Work Order PDF report:", err);
      const status = err.response?.status;
      if (status === 404) {
        setError(`Work Order #${id} was not found. Please verify the Work Order number or ID.`);
      } else if (status === 401 || status === 403) {
        setError("You are not authorized to view this Production & Quality Report. Please log in.");
      } else {
        setError("Unable to generate or download the Work Order PDF report. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPdfReport();
    }
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [id]);

  const handleDownload = () => {
    if (!blobUrl) return;
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
        return;
      } catch (err) {
        console.warn("Direct iframe print failed, falling back to window.open print:", err);
      }
    }
    if (blobUrl) {
      const printWindow = window.open(blobUrl, "_blank");
      if (printWindow) {
        printWindow.focus();
      }
    }
  };

  const handleOpenNewTab = () => {
    if (blobUrl) {
      window.open(blobUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Module Navigation Header */}
      <ModuleHeader
        title={
          workOrderMeta?.workOrderNo
            ? `Production & Quality PDF Report — ${workOrderMeta.workOrderNo}`
            : `Work Order #${id} Production & Quality Report`
        }
        subtitle="Official ISO 9001:2015 Manufacturing, Quality Inspection, and Compliance Document"
        badgeText="ISO 9001:2015"
        badgeVariant="blue"
      />

      {/* Action and Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#10182f] p-4 rounded-xl border border-[#1e2a4a] shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            to={`/production/work-orders/${id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e2a4a] hover:bg-slate-700 text-xs font-medium text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" />
            <span>Back to Work Order</span>
          </Link>

          {workOrderMeta?.workOrderNo && (
            <span className="hidden sm:inline-flex font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {workOrderMeta.workOrderNo}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchPdfReport}
            disabled={loading}
            icon={RefreshCw}
          >
            Refresh
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleOpenNewTab}
            disabled={!blobUrl || loading}
            icon={ExternalLink}
          >
            Open in New Tab
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrint}
            disabled={!blobUrl || loading}
            icon={Printer}
          >
            Print Report
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleDownload}
            disabled={!blobUrl || loading}
            icon={Download}
          >
            Download PDF
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <Card>
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
            <Loader size="lg" />
            <div>
              <h3 className="text-base font-semibold text-white">
                Compiling Production & Quality Report
              </h3>
              <p className="text-xs text-[#94a3b8] mt-1 max-w-md">
                Retrieving live manufacturing logs, shop floor execution history, quality inspection
                checklists, and CAPA defect records...
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Error State */}
      {!loading && error && (
        <Card>
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-3 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="max-w-md">
              <h3 className="text-base font-semibold text-white">Failed to Load Report</h3>
              <p className="text-xs text-rose-300 mt-1">{error}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="primary" size="sm" onClick={fetchPdfReport}>
                Retry
              </Button>
              <Link
                to={`/production/work-orders/${id}`}
                className="px-4 py-2 rounded-lg bg-[#1e2a4a] text-xs font-medium text-white hover:bg-slate-700 transition-colors"
              >
                Go to Work Order
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Successful PDF Display */}
      {!loading && !error && blobUrl && (
        <div className="space-y-4">
          {/* Quick Notice Banner */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Official PDF generated directly from real-time ERP records. Scanned via QR Code.
              </span>
            </div>
            <span className="font-mono text-[11px] text-[#94a3b8]">{filename}</span>
          </div>

          {/* Embedded PDF Viewer (A4 Container) */}
          <div className="bg-[#0b1324] rounded-2xl border border-[#1e2a4a] overflow-hidden shadow-2xl p-2 sm:p-4">
            <iframe
              ref={iframeRef}
              src={blobUrl}
              title={`Work Order ${id} Production & Quality Report`}
              className="w-full h-[78vh] min-h-[560px] rounded-xl border border-[#1e2a4a] bg-white shadow-inner"
            />
          </div>

          {/* Mobile Fallback Card (in case iframe cannot render PDF on mobile Safari / Chrome) */}
          <div className="block sm:hidden bg-[#10182f] p-4 rounded-xl border border-[#1e2a4a] text-center space-y-3">
            <FileText className="w-8 h-8 text-blue-400 mx-auto" />
            <div className="text-xs text-[#94a3b8]">
              Viewing on mobile? If the PDF doesn't preview automatically inside your mobile browser, tap below to open or download:
            </div>
            <Button
              variant="primary"
              size="sm"
              className="w-full justify-center"
              onClick={handleDownload}
              icon={Download}
            >
              Download PDF ({filename})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
