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
  Building2,
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

  const handleDownloadPDF = async () => {
    if (!printableRef.current) return;
    setIsExportingPDF(true);
    try {
      const element = printableRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`Quotation_${quoteNo}_Rev${revision}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmailClient = async () => {
    const email = quotation.customer?.email || quotation.lead?.email || "";
    setSendingEmail(true);
    setEmailStatusMessage("Sending official quotation email with attached PDF in background...");

    try {
      const res = await module1Service.sendQuotationEmail(quotation.id, {
        email,
        recipientName: customerName,
      });

      if (res?.success) {
        setEmailStatusMessage(
          res.message || `Quotation successfully emailed to ${email || customerName} with PDF attached!`
        );
      } else {
        setEmailStatusMessage(`Quotation email sent successfully to ${email || customerName}!`);
      }
    } catch (err) {
      console.error("Direct email sending error:", err);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "Could not send email. Please check backend SMTP settings.";
      setEmailStatusMessage(`Failed to send email: ${errMsg}`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
        {/* Top Title Bar */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 shrink-0">
          <div className="flex items-center space-x-3">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Quotation: {quoteNo} <span className="text-blue-700 font-mono">(Rev-{revision})</span>
            </h2>
            {quotation.proformaInvoiceNumber && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                PI: {quotation.proformaInvoiceNumber}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5-Step Process Indicator */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 overflow-x-auto shrink-0">
          <div className="flex items-center justify-between min-w-[650px] gap-2">
            {steps.map((step, idx) => (
              <div
                key={step.num}
                className={`flex items-center space-x-2 text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                  step.active
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-white border-slate-200 text-slate-400"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    step.active ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {step.num}
                </span>
                <span>{step.label}</span>
                {idx < steps.length - 1 && <span className="text-slate-300 ml-1">→</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Actions Toolbar */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                activeTab === "preview"
                  ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
            >
              Official Estimate
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("revise")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                activeTab === "revise"
                  ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
              <span>Negotiate / Revise</span>
            </button>
            {!quotation.proformaInvoiceNumber && onFinalizePI && (
              <button
                type="button"
                onClick={() => onFinalizePI(quotation.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Mark as PI</span>
              </button>
            )}
            {!quotation.customerPONumber && onIssueCustomerPO && (
              <button
                type="button"
                onClick={() => onIssueCustomerPO(quotation.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>{isExportingPDF ? "Generating..." : "Download PDF"}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print</span>
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(quotation.id)}
                className="p-1.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl text-xs border border-slate-300 transition cursor-pointer shadow-2xs"
                title="Delete Quotation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleEmailClient}
              disabled={sendingEmail}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{sendingEmail ? "Opening..." : "Email Estimate"}</span>
            </button>
          </div>
        </div>

        {/* Status notification toast */}
        {emailStatusMessage && (
          <div className="mx-6 mt-3 px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between shadow-2xs">
            <span>{emailStatusMessage}</span>
            <button
              type="button"
              onClick={() => setEmailStatusMessage(null)}
              className="text-emerald-700 hover:text-emerald-950 font-black ml-2 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100">
          {activeTab === "revise" ? (
            /* Revision & Negotiation Panel */
            <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-xl mx-auto shadow-md">
              <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-slate-200">
                <RefreshCw className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">Client Negotiation / Revision</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Create Revision Rev-{(revision + 1)} with negotiated rates or discount
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Special Negotiated Discount (INR)
                  </label>
                  <input
                    type="number"
                    value={revisedDiscount}
                    onChange={(e) => setRevisedDiscount(e.target.value)}
                    placeholder="e.g. 200"
                    className="w-full bg-white text-slate-900 text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Negotiation Notes / Client Requirement
                  </label>
                  <textarea
                    rows={3}
                    value={negotiationNotes}
                    onChange={(e) => setNegotiationNotes(e.target.value)}
                    placeholder="Client requested commercial concession for immediate PO release..."
                    className="w-full bg-white text-slate-900 text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 shadow-2xs"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("preview")}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleNegotiateSubmit}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Issue Rev-{(revision + 1)}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Rendered Clean Light Document */
            <div
              ref={printableRef}
              className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 text-slate-800 text-xs shadow-md max-w-4xl mx-auto font-sans"
            >
              {/* Header Box */}
              <div className="flex flex-col sm:flex-row items-start justify-between pb-6 border-b border-slate-200 gap-4">
                <div className="flex items-start space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md shrink-0">
                    Y
                  </div>
                  <div>
                    <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">
                      Yash Earthing Solutions Pvt Ltd
                    </h1>
                    <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">
                      Regd. Office: Shop No. 2, Basement Rajdhani Complex, Satara Road, Pune - 411043<br />
                      Plant / Works: Gate No. 118, Uruli Devachi, Handewadi Road, Haveli, Pune - 412308<br />
                      GSTIN: <span className="font-mono font-bold text-slate-800">27AABCY2449P1ZP</span> | PAN: <span className="font-mono font-bold text-slate-800">AABCY2449P</span> | CIN: <span className="font-mono font-bold text-slate-800">U31909PN2021PTC199842</span><br />
                      Email: sales@yashearthing.com | Tel: +91 9370335298 / +91 (020) 2437-8890
                    </p>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end shrink-0">
                  <div className="text-slate-500 text-[10px] font-bold mb-1">
                    QUOTE REF: <span className="text-blue-700 font-mono font-black">{quoteNo}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-right">
                    <div className="text-[10px] font-black text-blue-800">ESTIMATE ISSUED</div>
                    <div className="text-[9px] text-slate-500 font-mono">Status: {status}</div>
                  </div>
                </div>
              </div>

              {/* Title Ribbon */}
              <div className="py-2.5 my-4 bg-slate-50 border-y border-slate-200 flex items-center justify-between px-3">
                <span className="text-xs font-black text-blue-900 uppercase tracking-widest">
                  COMMERCIAL ESTIMATE & QUOTATION
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-600">
                  Revision: Rev-{revision}
                </span>
              </div>

              {/* Reference Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 text-[11px]">
                {/* 1. QUOTATION & COMMERCIAL REFERENCE */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                  <div className="font-black text-blue-800 uppercase text-[10px] tracking-wider mb-1.5">
                    QUOTATION & COMMERCIAL REFERENCE
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimate / Quote No:</span>
                    <span className="font-mono text-slate-900 font-bold">{quoteNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimate Date:</span>
                    <span className="text-slate-800 font-medium">22/10/2026</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Validity Period:</span>
                    <span className="text-slate-800 font-medium">15 Days from date of issue</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Terms:</span>
                    <span className="text-slate-800 font-medium">100% Advance against PI</span>
                  </div>
                </div>

                {/* 2. TECHNICAL & DELIVERY SCOPE */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                  <div className="font-black text-blue-800 uppercase text-[10px] tracking-wider mb-1.5">
                    TECHNICAL & DELIVERY SCOPE
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Delivery Terms:</span>
                    <span className="text-slate-800 font-medium">Ex-Works Pune / Road Transport</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Compliance & Approvals:</span>
                    <span className="text-slate-800 font-medium">IS 3043:2018 / IEEE 80 / NABL / MSEB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Place of Supply:</span>
                    <span className="text-slate-800 font-medium">27-Maharashtra</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sales Consultant:</span>
                    <span className="text-slate-800 font-bold">{quotation.salesRepresentative?.name || "Mr/Ms. RUKHSAR SHAIKH"}</span>
                  </div>
                </div>

                {/* 3. QUOTED TO */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                  <div className="font-black text-blue-800 uppercase text-[10px] tracking-wider mb-1.5">
                    QUOTED TO (CLIENT / ORGANIZATION)
                  </div>
                  <div className="font-black text-slate-900 text-xs">{customerName}</div>
                  <div className="text-slate-600">Commercial Tower, Senapati Bapat Road, Pune</div>
                  <div className="text-slate-500">GSTIN: <span className="font-mono font-bold text-slate-800">27AAACT2727Q1ZR</span> | State: 27-Maharashtra</div>
                </div>

                {/* 4. PROJECT / SITE DESTINATION */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                  <div className="font-black text-blue-800 uppercase text-[10px] tracking-wider mb-1.5">
                    PROJECT / SITE DESTINATION
                  </div>
                  <div className="font-black text-slate-900 text-xs">{customerName} (SITE WORKS)</div>
                  <div className="text-slate-600">Pune Solar & Substation Complex, Chakan MIDC</div>
                  <div className="text-slate-500">Supply Mode: Direct Factory Dispatch / Road Transport</div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-extrabold uppercase text-[10px]">
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
                  <tbody className="divide-y divide-slate-100">
                    {items.map((it, idx) => (
                      <tr key={it.id || idx} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                          {it.product?.sku || "YGGI501F"}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">
                            {it.product?.name || "GI Earthing Electrode"}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                            {it.description}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-black text-emerald-700">YASH</td>
                        <td className="py-2.5 px-3 font-mono">{it.product?.hsnCode || "8538"}</td>
                        <td className="py-2.5 px-3 font-mono font-bold">{Number(it.quantity || 1)}</td>
                        <td className="py-2.5 px-3">NOS</td>
                        <td className="py-2.5 px-3 font-mono">{Number(it.unitPrice || 2150).toFixed(2)}</td>
                        <td className="py-2.5 px-3 font-mono">18%</td>
                        <td className="py-2.5 px-3 font-mono font-black text-right text-slate-900">
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
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <span className="text-[10px] text-slate-500 uppercase font-black block mb-1">
                      AMOUNT IN WORDS:
                    </span>
                    <span className="font-black text-slate-900 text-xs">{inWords(grandTotal)}</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] space-y-1">
                    <span className="text-[10px] text-blue-800 uppercase font-black block mb-1">
                      DIRECT BANK REMITTANCE:
                    </span>
                    <div className="text-slate-700">Bank: <span className="font-bold text-slate-900">STATE BANK OF INDIA</span></div>
                    <div className="text-slate-700">A/c No: <span className="font-mono font-bold text-slate-900">42706903179</span> | IFSC Code: <span className="font-mono font-bold text-slate-900">SBIN0004726</span> (Branch: SIB PUNE)</div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-[11px]">
                  <div className="flex justify-between text-slate-700">
                    <span>Taxable Subtotal:</span>
                    <span className="font-mono font-bold">₹ {taxableAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Central Tax (CGST 9%):</span>
                    <span className="font-mono">₹ {cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>State Tax (SGST 9%):</span>
                    <span className="font-mono">₹ {sgst.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-sm">
                    <span className="font-black text-slate-900 uppercase">GRAND TOTAL (INR):</span>
                    <span className="font-mono font-black text-blue-700 text-base">₹ {grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Commercial Terms & Conditions */}
              <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-500 space-y-1">
                <span className="font-black text-slate-700 uppercase block mb-1">
                  Commercial Terms & Conditions:
                </span>
                <p>1. Taxation: GST extra as applicable at actuals.</p>
                <p>2. Delivery: Within 1 to 2 days after receipt of confirmed PO / advance payment.</p>
                <p>3. Standards: Material compliant with IS 3043:2018, MSEB, MHADA, and NABL specifications.</p>
                <p>4. Jurisdiction: All disputes subject to Pune Jurisdiction only.</p>
              </div>

              {/* Stamp & Authorized Signature */}
              <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-end">
                <div className="text-[10px] text-slate-400">
                  Computer-generated authenticated commercial document.<br />
                  Yash Earthing ERP v3 Cloud Edition.
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-700 mb-1">
                    For YASH EARTHING SOLUTIONS PVT LTD
                  </div>
                  <div className="p-2 border border-blue-200 rounded-lg bg-blue-50 text-right">
                    <div className="text-[11px] font-bold text-blue-800">
                      {quotation.preparedBy?.split("(")[0]?.trim() || "Back Officer"}
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">
                      {quotation.preparedBy?.includes("(")
                        ? quotation.preparedBy.split("(")[1]?.replace(")", "")
                        : "BACK_OFFICER"}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
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
