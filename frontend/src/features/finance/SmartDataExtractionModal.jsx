import React, { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  Database,
  RefreshCw,
  X,
  HelpCircle,
  Download
} from 'lucide-react';
import { financeService } from '../../services/financeService';

export default function SmartDataExtractionModal({ isOpen, onClose, onImportSuccess }) {
  const [importType, setImportType] = useState('BANK_STATEMENT');
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [ingesting, setIngesting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  if (!isOpen) return null;

  // Sample data templates for quick demonstration & user testing
  const sampleBankStatement = `Date,Reference_UTR,Party_Narration,Credit_Amount,Remarks
2026-10-23,CMS-HDFC-991204,Tata Power Renewable Energy Ltd,51920,RTGS received for Electrode dispatch
2026-10-22,NEFT-SBI-440192,Adani Solar Energy Kutchh One,115000,Adani Solar Project Phase-1 Inward
2026-10-21,UPI-AXIS-881290,Sterling & Wilson Renewable,65000,Solar Earthing materials advance`;

  const sampleVendorSheet = `Date,Bill_No,Vendor_Name,Taxable_Value,GST_Amount,Total_Amount,Remarks
2026-10-20,HINDALCO/2026/099,Hindalco Industries Ltd,120000,21600,141600,Copper Strip 25x3mm Supply
2026-10-21,JINDAL/SS/8810,Jindal Stainless Steel Hisar,95000,17100,112100,SS Earthing Rod Batch-4
2026-10-22,TATA-STEEL-4412,Tata Steel BSL Ltd,150000,27000,177000,GI Earthing Pipe Class B`;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setRawText(event.target.result);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read file. Please ensure it is a valid CSV or plain text file.');
    };
    reader.readAsText(file);
  };

  const loadSample = () => {
    if (importType === 'BANK_STATEMENT') {
      setRawText(sampleBankStatement);
      setFileName('sample_bank_statement.csv');
    } else {
      setRawText(sampleVendorSheet);
      setFileName('sample_vendor_bills.csv');
    }
    setError(null);
    setExtractedData(null);
  };

  const handleExtract = async () => {
    if (!rawText.trim()) {
      setError('Please upload a file or paste statement text to extract.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await financeService.extractImportData(rawText, importType);
      if (res.success) {
        setExtractedData(res.data);
      } else {
        setError(res.message || 'Failed to extract file contents.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Extraction parsing error.');
    } finally {
      setLoading(false);
    }
  };

  const handleIngest = async () => {
    if (!extractedData || !extractedData.rows || extractedData.rows.length === 0) return;

    try {
      setIngesting(true);
      setError(null);
      const res = await financeService.ingestImportData(importType, extractedData.rows);
      if (res.success) {
        setSuccessMessage(`Successfully ingested ${res.ingestedCount} records directly into Module 6 live database!`);
        setTimeout(() => {
          onImportSuccess();
          onClose();
        }, 1500);
      } else {
        setError(res.message || 'Ingestion failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to commit imported records.');
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="bg-[#141d30] text-white p-5 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Smart File Extraction & Ingestion Engine</h2>
              <p className="text-xs text-slate-400">
                AI & Relational Parser for Bank Statements (UTR/Cheque) & Vendor Bills (GSTR-2B)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
            <button
              onClick={() => {
                setImportType('BANK_STATEMENT');
                setExtractedData(null);
              }}
              className={`flex-1 py-2 rounded-lg transition flex items-center justify-center space-x-2 ${
                importType === 'BANK_STATEMENT'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>1. Bank Remittance Statement (Auto-Match & Collect)</span>
            </button>
            <button
              onClick={() => {
                setImportType('VENDOR_BILLS');
                setExtractedData(null);
              }}
              className={`flex-1 py-2 rounded-lg transition flex items-center justify-center space-x-2 ${
                importType === 'VENDOR_BILLS'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>2. Vendor Bills & Invoices (3-Way Payables)</span>
            </button>
          </div>

          {/* Upload Dropzone & Direct Paste */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-slate-700">Upload CSV, Excel Text, or Tab-Delimited Statement:</label>
              <button
                type="button"
                onClick={loadSample}
                className="text-blue-600 hover:text-blue-800 font-bold underline flex items-center space-x-1"
              >
                <span>Load Pre-filled Sample Data</span>
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center bg-slate-50 hover:bg-slate-100/80 transition relative">
              <input
                type="file"
                accept=".csv, .txt, .tsv"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-700">
                {fileName ? `Loaded: ${fileName}` : 'Click to select CSV/Excel statement or drop file here'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Supports UTF-8 CSV, Tabular Text, or Bank exports</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Raw File Content / Tabular View:</label>
              <textarea
                rows={5}
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.result || e.target.value);
                  setExtractedData(null);
                }}
                placeholder="Paste CSV rows here (e.g. Date, Reference, Party, Amount, Remarks)..."
                className="w-full text-xs font-mono bg-white border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleExtract}
                disabled={loading || !rawText.trim()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm transition"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
                <span>{loading ? 'Parsing Columns & Matching...' : 'Run Extraction & Relational Match'}</span>
              </button>
            </div>
          </div>

          {/* Extracted Preview Table */}
          {extractedData && (
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Extracted Data Preview ({extractedData.totalRows} Records Found)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {extractedData.readyRows} matched automatically against live M1 customers & M2 vendors
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                  {extractedData.readyRows} OF {extractedData.totalRows} READY
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Ref / UTR</th>
                      <th className="p-2.5">Party (Statement)</th>
                      <th className="p-2.5">Relational Match</th>
                      <th className="p-2.5 text-right">Amount</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {extractedData.rows.map((row) => (
                      <tr key={row.rowId} className="hover:bg-slate-50 transition">
                        <td className="p-2.5 text-slate-600">{row.date}</td>
                        <td className="p-2.5 font-bold text-blue-600">{row.reference}</td>
                        <td className="p-2.5 font-sans font-medium text-slate-800 max-w-[160px] truncate">
                          {row.partyRaw}
                        </td>
                        <td className="p-2.5 font-sans">
                          {row.matchedCustomer ? (
                            <div>
                              <span className="text-emerald-700 font-bold text-[11px]">
                                Matched: {row.matchedCustomer.name}
                              </span>
                              {row.matchedInvoice && (
                                <div className="text-[10px] text-blue-600">
                                  Auto-allocated: {row.matchedInvoice.invoiceNo} (Due: ₹{row.matchedInvoice.balance.toLocaleString()})
                                </div>
                              )}
                            </div>
                          ) : row.matchedVendor ? (
                            <span className="text-emerald-700 font-bold text-[11px]">
                              Matched: {row.matchedVendor.name}
                            </span>
                          ) : (
                            <span className="text-amber-600 font-semibold text-[10px]">
                              Unmatched (will create advance)
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-900">
                          ₹{Number(row.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.status === 'READY'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Commit / Ingest Action */}
              <div className="flex justify-between items-center pt-2">
                <div className="text-[11px] text-slate-500">
                  Transactions will update invoice balance amounts and audit logs in real time.
                </div>
                <button
                  type="button"
                  onClick={handleIngest}
                  disabled={ingesting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md transition"
                >
                  {ingesting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{ingesting ? 'Committing Ingestion...' : 'Commit & Ingest Records to Live ERP'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
