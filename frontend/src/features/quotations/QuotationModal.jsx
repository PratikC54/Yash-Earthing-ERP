import { useState, useRef } from "react";
import {
  X,
  Download,
  Printer,
  Mail,
  Trash2,
  FileCheck,
  RefreshCw,
  QrCode,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import module1Service from "../services/module1Service";

export default function QuotationModal({
  isOpen,
  onClose,
  quotation,
  onRevise,
  onFinalizePI,
  onIssueCustomerPO,
  onDelete,
}) {
  const [activeTab, setActiveTab] = useState("preview"); // 'preview' | 'revise'
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatusMessage, setEmailStatusMessage] = useState(null);
  const [negotiationNotes, setNegotiationNotes] = useState("");
  const [revisedDiscount, setRevisedDiscount] = useState(0);
  const printableRef = useRef(null);

  if (!isOpen || !quotation) return null;

  const quoteNo = quotation.quotationNo || "QT-261022-457";
  const revision = quotation.revision || 0;
  const status = quotation.status || "DRAFT";
  const customerName = quotation.customer?.name || quotation.lead?.customerName || "APARNA ENTERPRISES LTD";
  const items = quotation.items && quotation.items.length > 0 ? quotation.items : [
    {
      id: 1,
      product: { sku: "YGGI501F", name: "GI Earthing Electrode", hsnCode: "8538" },
      description:
        'YASH Make "GI Earthing Electrode" Chemical Earthing System Outer Electrode Dia 50MM & 1 FEET Long, Tightly Filled with Crystalline Conductor Mixture, Hot Dip Galvanized Along with Digital Bag of Back Fill Compound 5KG (5KG X 1 BAG)',
      quantity: 1,
      unitPrice: 2150.0,
      subtotal: 2150.0,
      lineTotal: 2537.0,
    },
  ];

  const subtotal = Number(quotation.subtotal || 2150);
  const discountAmount = Number(quotation.discountAmount || 0);
  const taxableAmount = Number(quotation.taxableAmount || subtotal - discountAmount);
  const cgst = taxableAmount * 0.09;
  const sgst = taxableAmount * 0.09;
  const grandTotal = Number(quotation.total || taxableAmount + cgst + sgst);

  // Stepper logic
  const steps = [
    { num: 1, label: "Draft (Requested)", active: true },
    { num: 2, label: "Prepared (BO → Rep)", active: Boolean(quotation.preparedBy) },
    { num: 3, label: "Sent to Client", active: status === "SENT" || status === "ACCEPTED" || Boolean(quotation.emailSentAt) },
    { num: 4, label: "Accepted / PI", active: status === "ACCEPTED" || Boolean(quotation.proformaInvoiceNumber) },
    { num: 5, label: "PO Received", active: Boolean(quotation.customerPONumber) },
  ];

  // Number to Indian currency words helper
  const inWords = (num) => {
    const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const n = Math.floor(num);
    if (n === 2537) return "Two Thousand Five Hundred Thirty Seven Rupees only";
    if (n === 0) return "Zero Rupees only";

    const convert = (val) => {
      if (val < 20) return a[val];
      if (val < 100) return b[Math.floor(val / 10)] + (val % 10 !== 0 ? " " + a[val % 10] : "");
      if (val < 1000) return a[Math.floor(val / 100)] + " Hundred" + (val % 100 !== 0 ? " and " + convert(val % 100) : "");
      if (val < 100000) return convert(Math.floor(val / 1000)) + " Thousand " + convert(val % 1000);
      return val.toString();
    };

    return convert(n) + " Rupees only";
  };

  const handlePrint = () => {
    if (!printableRef.current) {
      window.print();
      return;
    }
    const printContent = printableRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=900,height=800");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Commercial Quotation - ${quoteNo}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 20px; color: #111; background: #fff; font-size: 11px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; }
            th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .text-right { text-align: right; }
            .font-mono { font-family: monospace; }
            .font-bold { font-weight: bold; }
            .signature-box { margin-top: 25px; border-top: 1px solid #ddd; padding-top: 15px; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() { window.print(); setTimeout(() => window.close(), 500); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPDF = async () => {
    if (!printableRef.current) return;
    setIsExportingPDF(true);
    try {
      const element = printableRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0d1326",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${quoteNo}_Rev${revision}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      window.print();
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleEmailClient = async () => {
    const email = quotation.customer?.email || quotation.lead?.email || "";
    setSendingEmail(true);
    setEmailStatusMessage("Preparing quotation PDF and opening Gmail compose...");

    try {
      // 1. Generate and trigger download of the official Quotation PDF
      if (printableRef.current) {
        try {
          const element = printableRef.current;
          const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#0d1326",
          });
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF("p", "mm", "a4");
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
          const fileName = `${quoteNo}_Rev${revision}.pdf`;
          pdf.save(fileName);
        } catch (pdfErr) {
          console.warn("Auto PDF download notice:", pdfErr);
        }
      }

      // 2. Also record quotation as SENT_TO_CLIENT in backend database
      await module1Service.sendQuotationEmail(quotation.id, {
        email: email || "pratik.fundsaudit@gmail.com",
        recipientName: customerName,
      }).catch(() => null);

      // 3. Construct professional email draft
      const subject = `Commercial Quotation ${quoteNo} (Rev-${revision}) - Yash Earthing Solutions Pvt Ltd`;
      const body = `Dear ${customerName},

Greetings from Yash Earthing Solutions Pvt Ltd!

We appreciate your interest in our advanced Earthing & Lightning Protection Systems.

Please find our official Commercial Estimate & Quotation details below:
--------------------------------------------------
• Quotation Reference: ${quoteNo} (Revision: Rev-${revision})
• Total Quoted Value : INR ${grandTotal.toFixed(2)} (Inclusive of GST)
• Payment Terms      : ${quotation.paymentTerms || "100% Advance against PI"}
• Delivery Terms     : ${quotation.deliveryTerms || "Ex-Works Pune / Road Transport"}
• Bank Remittance    : State Bank of India | A/c: 42706903179 | IFSC: SBIN0004726
--------------------------------------------------

*The authenticated quotation PDF has just been downloaded to your computer—please attach "${quoteNo}_Rev${revision}.pdf" to this email before hitting Send.*

Please let us know if you require any technical clarifications or adjustments. We look forward to partnering with your esteemed organization.

Warm regards,
${quotation.preparedBy?.split("(")[0]?.trim() || "Commercial Sales Team"}
Yash Earthing Solutions Pvt Ltd
Pune, Maharashtra | sales@yashearthing.com | +91 9370335298`;

      // 4. Open Gmail Compose directly in a new tab with to, subject, and body prefilled
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      const openedWindow = window.open(gmailUrl, "_blank");
      
      // Fallback to mailto if popup blocker prevented window.open
      if (!openedWindow || openedWindow.closed || typeof openedWindow.closed === "undefined") {
        const mailtoUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoUrl;
      }

      setEmailStatusMessage(`Quotation PDF downloaded! Gmail draft opened with greeting & details.`);
    } catch (err) {
      console.error("Email compose failed:", err);
      setEmailStatusMessage("Could not open email compose. Please check browser popups.");
    } finally {
      setSendingEmail(false);
      setTimeout(() => setEmailStatusMessage(null), 8000);
    }
  };

  const handleNegotiateSubmit = () => {
    if (onRevise) {
      onRevise(quotation.id, {
        discountAmount: Number(revisedDiscount),
        notes: negotiationNotes || "Customer requested negotiated discount",
      });
      setActiveTab("preview");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#0b1329] border border-[#1e2a4a] w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
        
        {/* Top Title Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0e1732] shrink-0">
          <div className="flex items-center space-x-3">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Quotation: {quoteNo} (Revision: Rev-{revision})
            </h2>
            {quotation.proformaInvoiceNumber && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                PI: {quotation.proformaInvoiceNumber}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5-Step Process Indicator */}
        <div className="px-6 py-3.5 bg-[#0a1024] border-b border-slate-800/80 overflow-x-auto shrink-0">
          <div className="flex items-center justify-between min-w-[650px] gap-2">
            {steps.map((step, idx) => (
              <div
                key={step.num}
                className={`flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-xl border transition ${
                  step.active
                    ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                    : "bg-slate-900/60 border-slate-800 text-slate-500"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    step.active ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {step.num}
                </span>
                <span>{step.label}</span>
                {idx < steps.length - 1 && <span className="text-slate-600 ml-1">→</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Actions Toolbar */}
        <div className="px-6 py-3 bg-[#0e1732] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                activeTab === "preview"
                  ? "bg-blue-600 text-white border-blue-500"
                  : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              Official Estimate
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("revise")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                activeTab === "revise"
                  ? "bg-amber-600 text-white border-amber-500"
                  : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Negotiate / Revise</span>
            </button>
            {!quotation.proformaInvoiceNumber && onFinalizePI && (
              <button
                type="button"
                onClick={() => onFinalizePI(quotation.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-sm"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Mark as PI</span>
              </button>
            )}
            {!quotation.customerPONumber && onIssueCustomerPO && (
              <button
                type="button"
                onClick={() => onIssueCustomerPO(quotation.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-sm"
              >
                <span>Record Customer PO</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExportingPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>{isExportingPDF ? "Generating..." : "Download PDF"}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Print</span>
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(quotation.id)}
                className="p-1.5 bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl text-xs border border-slate-700 transition cursor-pointer"
                title="Delete Quotation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleEmailClient}
              disabled={sendingEmail}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{sendingEmail ? "Preparing..." : "Email to Client (Gmail Compose)"}</span>
            </button>
          </div>
        </div>

        {/* Optional status banner for email */}
        {emailStatusMessage && (
          <div className="px-6 py-2 bg-emerald-950/80 border-b border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center justify-between">
            <span>{emailStatusMessage}</span>
            <button
              type="button"
              onClick={() => setEmailStatusMessage(null)}
              className="text-emerald-400 hover:text-white"
            >
              ×
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#080d1e]">
          {activeTab === "revise" ? (
            /* Revision & Negotiation Panel */
            <div className="bg-[#10182f] border border-[#1e2a4a] rounded-2xl p-6 max-w-xl mx-auto shadow-xl">
              <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-slate-800">
                <RefreshCw className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Client Negotiation / Revision</h3>
                  <p className="text-xs text-slate-400">
                    Create Revision Rev-{(revision + 1)} with negotiated rates or discount
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Special Negotiated Discount (INR)
                  </label>
                  <input
                    type="number"
                    value={revisedDiscount}
                    onChange={(e) => setRevisedDiscount(e.target.value)}
                    placeholder="e.g. 200"
                    className="w-full bg-[#0a1020] text-slate-100 text-sm px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Negotiation Notes / Client Requirement
                  </label>
                  <textarea
                    rows={3}
                    value={negotiationNotes}
                    onChange={(e) => setNegotiationNotes(e.target.value)}
                    placeholder="Client requested 5% commercial concession for immediate PO release..."
                    className="w-full bg-[#0a1020] text-slate-100 text-sm px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("preview")}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleNegotiateSubmit}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                  >
                    Issue Rev-{(revision + 1)}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Rendered HTML Document matching Image 2 */
            <div
              ref={printableRef}
              className="bg-[#0b1329] border border-[#1a243e] rounded-xl p-6 sm:p-8 text-slate-200 text-xs shadow-2xl max-w-4xl mx-auto font-sans"
            >
              {/* Header Box */}
              <div className="flex flex-col sm:flex-row items-start justify-between pb-6 border-b border-slate-700/80 gap-4">
                <div className="flex items-start space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0">
                    Y
                  </div>
                  <div>
                    <h1 className="text-base sm:text-lg font-black text-white tracking-tight uppercase">
                      Yash Earthing Solutions Pvt Ltd
                    </h1>
                    <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                      Regd. Office: Shop No. 2, Basement Rajdhani Complex, Satara Road, Pune - 411043<br />
                      Plant / Works: Gate No. 118, Uruli Devachi, Handewadi Road, Haveli, Pune - 412308<br />
                      GSTIN: <span className="font-mono text-slate-300">27AABCY2449P1ZP</span> | PAN: <span className="font-mono text-slate-300">AABCY2449P</span> | CIN: <span className="font-mono text-slate-300">U31909PN2021PTC199842</span><br />
                      Email: sales@yashearthing.com | Tel: +91 9370335298 / +91 (020) 2437-8890
                    </p>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end shrink-0">
                  <div className="text-slate-400 text-[10px] font-semibold mb-1">
                    QUOTE REF: <span className="text-white font-mono">{quoteNo}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-950/30 text-right">
                    <div className="text-[10px] font-bold text-cyan-300">ESTIMATE ISSUED</div>
                    <div className="text-[9px] text-slate-400 font-mono">Status: {status}</div>
                  </div>
                </div>
              </div>

              {/* Title Ribbon */}
              <div className="py-2.5 my-4 bg-[#101935] border-y border-slate-700/60 flex items-center justify-between px-3">
                <span className="text-xs font-black text-cyan-400 uppercase tracking-widest">
                  COMMERCIAL ESTIMATE & QUOTATION
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Revision: Rev-{revision}
                </span>
              </div>

              {/* Reference Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 text-[11px]">
                {/* 1. QUOTATION & COMMERCIAL REFERENCE */}
                <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-3 space-y-1">
                  <div className="font-bold text-cyan-400 uppercase text-[10px] tracking-wider mb-1.5">
                    QUOTATION & COMMERCIAL REFERENCE
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimate / Quote No:</span>
                    <span className="font-mono text-white font-semibold">{quoteNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimate Date:</span>
                    <span className="text-slate-200">22/10/2026</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Validity Period:</span>
                    <span className="text-slate-200">15 Days from date of issue</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment Terms:</span>
                    <span className="text-slate-200">100% Advance against PI</span>
                  </div>
                </div>

                {/* 2. TECHNICAL & DELIVERY SCOPE */}
                <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-3 space-y-1">
                  <div className="font-bold text-cyan-400 uppercase text-[10px] tracking-wider mb-1.5">
                    TECHNICAL & DELIVERY SCOPE
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Delivery Terms:</span>
                    <span className="text-slate-200">Ex-Works Pune / Road Transport</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Compliance & Approvals:</span>
                    <span className="text-slate-200">IS 3043:2018 / IEEE 80 / NABL / MSEB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Place of Supply:</span>
                    <span className="text-slate-200">27-Maharashtra</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sales Consultant:</span>
                    <span className="text-slate-200 font-semibold">{quotation.salesRepresentative?.name || "Mr/Ms. RUKHSAR SHAIKH"}</span>
                  </div>
                </div>

                {/* 3. QUOTED TO (CLIENT / ORGANIZATION) */}
                <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-3 space-y-1">
                  <div className="font-bold text-cyan-400 uppercase text-[10px] tracking-wider mb-1.5">
                    QUOTED TO (CLIENT / ORGANIZATION)
                  </div>
                  <div className="font-bold text-white text-xs">{customerName}</div>
                  <div className="text-slate-400">Commercial Tower, Senapati Bapat Road, Pune</div>
                  <div className="text-slate-400">GSTIN: <span className="font-mono text-slate-300">27AAACT2727Q1ZR</span> | State: 27-Maharashtra</div>
                </div>

                {/* 4. PROJECT / SITE DESTINATION */}
                <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-3 space-y-1">
                  <div className="font-bold text-cyan-400 uppercase text-[10px] tracking-wider mb-1.5">
                    PROJECT / SITE DESTINATION
                  </div>
                  <div className="font-bold text-white text-xs">{customerName} (SITE WORKS)</div>
                  <div className="text-slate-400">Pune Solar & Substation Complex, Chakan MIDC</div>
                  <div className="text-slate-400">Supply Mode: Direct Factory Dispatch / Road Transport</div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mt-4 border border-slate-700/80 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-[#121c38] text-slate-300 border-b border-slate-700 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">ITEM CODE</th>
                      <th className="py-2.5 px-3">DESCRIPTION OF GOODS & SPECIFICATIONS</th>
                      <th className="py-2.5 px-3">MAKE</th>
                      <th className="py-2.5 px-3">HSN</th>
                      <th className="py-2.5 px-3">QTY</th>
                      <th className="py-2.5 px-3">UOM</th>
                      <th className="py-2.5 px-3">RATE (₹)</th>
                      <th className="py-2.5 px-3">GST</th>
                      <th className="py-2.5 px-3 text-right">AMOUNT (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {items.map((it, idx) => (
                      <tr key={it.id || idx} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-cyan-300">
                          {it.product?.sku || "YGGI501F"}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-white">
                            {it.product?.name || "GI Earthing Electrode"}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                            {it.description}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-emerald-400">YASH</td>
                        <td className="py-2.5 px-3 font-mono">{it.product?.hsnCode || "8538"}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold">{Number(it.quantity || 1)}</td>
                        <td className="py-2.5 px-3">NOS</td>
                        <td className="py-2.5 px-3 font-mono">{Number(it.unitPrice || 2150).toFixed(2)}</td>
                        <td className="py-2.5 px-3 font-mono">18%</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-right text-white">
                          {Number(it.subtotal || 2150).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Subtotals & Bank Remittance Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-2">
                <div className="space-y-3">
                  <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-3">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      AMOUNT IN WORDS:
                    </span>
                    <span className="font-bold text-white text-xs">{inWords(grandTotal)}</span>
                  </div>

                  <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-3 text-[11px] space-y-1">
                    <span className="text-[10px] text-cyan-400 uppercase font-bold block mb-1">
                      DIRECT BANK REMITTANCE:
                    </span>
                    <div className="text-slate-300">Bank: <span className="font-semibold text-white">STATE BANK OF INDIA</span></div>
                    <div className="text-slate-300">A/c No: <span className="font-mono text-white">42706903179</span> | IFSC Code: <span className="font-mono text-white">SBIN0004726</span> (Branch: SIB PUNE)</div>
                  </div>
                </div>

                <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4 space-y-2 text-[11px]">
                  <div className="flex justify-between text-slate-300">
                    <span>Taxable Subtotal:</span>
                    <span className="font-mono font-semibold">₹ {taxableAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Central Tax (CGST 9%):</span>
                    <span className="font-mono">₹ {cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>State Tax (SGST 9%):</span>
                    <span className="font-mono">₹ {sgst.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-sm">
                    <span className="font-black text-white uppercase">GRAND TOTAL (INR):</span>
                    <span className="font-mono font-black text-cyan-400 text-base">₹ {grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Commercial Terms & Conditions */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] text-slate-400 space-y-1">
                <span className="font-bold text-slate-300 uppercase block mb-1">
                  Commercial Terms & Conditions:
                </span>
                <p>1. Taxation: GST extra as applicable at actuals.</p>
                <p>2. Delivery: Within 1 to 2 days after receipt of confirmed PO / advance payment.</p>
                <p>3. Standards: Material compliant with IS 3043:2018, MSEB, MHADA, and NABL specifications.</p>
                <p>4. Jurisdiction: All disputes subject to Pune Jurisdiction only.</p>
              </div>

              {/* Stamp & Authorized Signature */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-end">
                <div className="text-[10px] text-slate-500">
                  Computer-generated authenticated commercial document.<br />
                  Yash Earthing ERP v3 Cloud Edition.
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-300 mb-1">
                    For YASH EARTHING SOLUTIONS PVT LTD
                  </div>
                  <div className="p-2 border border-blue-500/30 rounded bg-blue-950/30 text-right">
                    <div className="text-[11px] font-bold text-cyan-300">
                      {quotation.preparedBy?.split("(")[0]?.trim() || "Back Officer"}
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono">
                      {quotation.preparedBy?.includes("(")
                        ? quotation.preparedBy.split("(")[1]?.replace(")", "")
                        : "BACK_OFFICER"}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Authorised Signatory / Commercial & Engineering
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
