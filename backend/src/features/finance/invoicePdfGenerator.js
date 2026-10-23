// Official GST Tax Invoice Generator for Yash Group ERP M6
export function generateTaxInvoiceHtml(invoice, companyProfile, paymentTerms) {
  const isInterState = invoice.taxType === 'INTER_STATE' || (invoice.placeOfSupply && invoice.placeOfSupply !== companyProfile.stateCode);
  const formatDateStr = (d) => {
    if (!d) return '—';
    try {
      const parts = String(d).split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const mIdx = parseInt(parts[1], 10) - 1;
        if (mIdx >= 0 && mIdx < 12) {
          return `${parts[2]} ${months[mIdx]} ${parts[0]}`;
        }
      }
      const dt = new Date(d);
      if (!isNaN(dt.getTime())) {
        return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      return String(d);
    } catch {
      return String(d);
    }
  };
  const now = formatDateStr(invoice.invoiceDate);
  const due = formatDateStr(invoice.dueDate);

  const itemRows = (invoice.items || []).map((it, idx) => `
    <tr>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace;">${idx + 1}</td>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">
        <strong style="color: #0f172a;">${it.description}</strong>
        <div style="font-size: 10px; color: #64748b; font-family: monospace;">SKU: ${it.sku || 'CUSTOM'}</div>
      </td>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace; font-weight: bold; color: #0284c7;">${it.hsn || '85359090'}</td>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace; font-weight: bold;">${it.qty} ${it.uom || 'NOS'}</td>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace;">₹${Number(it.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace; font-weight: bold;">₹${Number(it.taxableValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      ${!isInterState ? `
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace; color: #475569;">9%<br>₹${Number(it.cgstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace; color: #475569;">9%<br>₹${Number(it.sgstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      ` : `
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace; color: #475569;">18%<br>₹${Number(it.igstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      `}
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace; font-weight: bold; color: #059669;">₹${Number(it.lineTotal || (it.taxableValue * 1.18)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
    </tr>
  `).join('');

  // Number to Indian English Words conversion
  const amountWords = convertNumberToIndianWords(Math.round(invoice.grandTotal));
  const safeFilename = 'GST-INVOICE-' + (invoice.invoiceNo || 'INV').replace(/\//g, '-').replace(/[^a-zA-Z0-9_-]/g, '_') + '.pdf';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>GST Tax Invoice — ${invoice.invoiceNo}</title>
  <style>
    @page { size: A4 portrait; margin: 8mm; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f1f5f9;
      color: #0f172a;
      font-size: 12px;
    }
    .no-print {
      max-width: 850px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      padding: 12px 20px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    .download-btn {
      padding: 10px 18px;
      background: #0284c7;
      color: white;
      border: 1px solid #0369a1;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
      font-size: 13px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .download-btn:hover { background: #0369a1; }
    .print-btn-secondary {
      padding: 10px 16px;
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
      font-size: 13px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .invoice-box {
      max-width: 850px;
      margin: 0 auto;
      background: #ffffff;
      border: 2px solid #0f172a;
      padding: 24px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .title-banner {
      background: #0f172a;
      color: #ffffff;
      text-align: center;
      font-weight: 800;
      font-size: 13px;
      letter-spacing: 2px;
      padding: 4px;
      margin-bottom: 12px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border: 1px solid #cbd5e1;
      margin-bottom: 12px;
    }
    .grid-cell {
      padding: 10px 14px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-bottom: 12px;
    }
    .items-table th {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 8px;
      font-weight: 800;
      color: #334155;
      text-transform: uppercase;
      font-size: 10px;
    }
    @media print {
      body { background: white; padding: 0; }
      .no-print { display: none !important; }
      .invoice-box { border: none; box-shadow: none; padding: 0; width: 100%; max-width: 100%; }
    }
  </style>
  <script src="/api/v1/engineering/assets/html2pdf.bundle.min.js"></script>
  <script>
    function downloadInvoicePdf() {
      var btn = document.getElementById('dl-btn');
      var originalHtml = btn ? btn.innerHTML : '';
      if (btn) {
        btn.innerHTML = 'Generating Statutory GST Invoice PDF...';
        btn.style.opacity = '0.7';
        btn.disabled = true;
      }
      var element = document.querySelector('.invoice-box');
      var opt = {
        margin: [8, 8, 8, 8],
        filename: '${safeFilename}',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      if (typeof html2pdf !== 'undefined') {
        html2pdf().set(opt).from(element).save().then(function() {
          if (btn) {
            btn.innerHTML = 'PDF Downloaded (Click to re-download)';
            btn.style.opacity = '1';
            btn.disabled = false;
          }
        }).catch(function(err) {
          console.error('Invoice PDF generation error:', err);
          if (btn) {
            btn.innerHTML = originalHtml;
            btn.style.opacity = '1';
            btn.disabled = false;
          }
          window.print();
        });
      } else {
        window.print();
      }
    }

    window.addEventListener('DOMContentLoaded', function() {
      var params = new URLSearchParams(window.location.search);
      if (params.get('download') === 'true') {
        setTimeout(downloadInvoicePdf, 600);
      }
    });
  </script>
</head>
<body>
  <!-- Top Action Toolbar -->
  <div class="no-print">
    <div style="display: flex; align-items: center; gap: 10px;">
      <button id="dl-btn" class="download-btn" onclick="downloadInvoicePdf()">
        Download Official GST Invoice (.PDF)
      </button>
      <button class="print-btn-secondary" onclick="window.print()">
        Print Statutory Invoice (Ctrl+P)
      </button>
    </div>
    <div style="font-size: 11px; color: #64748b; font-family: monospace;">
      <span style="color: #059669; font-weight: bold;">STATUTORY COMPLIANCE:</span> CGST Rules (Rule 46) / Standard Tax Invoice
    </div>
  </div>

  <div class="invoice-box">
    <!-- Header Banner -->
    <div class="title-banner">TAX INVOICE (ORIGINAL FOR RECIPIENT)</div>

    <table class="header-table">
      <tr>
        <td style="vertical-align: top; width: 60%;">
          <div style="font-size: 18px; font-weight: 900; color: #0f172a; letter-spacing: 0.5px;">
            ${companyProfile.legalName}
          </div>
          <div style="font-size: 11px; color: #475569; margin-top: 2px;">
            ${companyProfile.address}
          </div>
          <div style="font-size: 11px; color: #0f172a; margin-top: 4px; font-family: monospace;">
            <strong>GSTIN:</strong> ${companyProfile.gstin} · <strong>PAN:</strong> ${companyProfile.pan} · <strong>State:</strong> ${companyProfile.stateName} (Code: ${companyProfile.stateCode})
          </div>
          <div style="font-size: 11px; color: #475569;">
            Email: ${companyProfile.contactEmail} · Phone: ${companyProfile.contactPhone}
          </div>
        </td>
        <td style="vertical-align: top; text-align: right; width: 40%;">
          <div style="font-size: 14px; font-weight: bold; color: #0284c7; font-family: monospace;">
            Invoice No: ${invoice.invoiceNo}
          </div>
          <div style="font-size: 12px; margin-top: 4px; color: #0f172a;">
            <strong>Invoice Date:</strong> <span style="font-family: Arial, sans-serif; font-weight: bold; color: #0f172a;">${now}</span>
          </div>
          <div style="font-size: 12px; margin-top: 3px; color: #dc2626;">
            <strong>Payment Due:</strong> <span style="font-family: Arial, sans-serif; font-weight: bold; color: #dc2626;">${due}</span>
          </div>
          <div style="font-size: 10px; color: #64748b; font-family: monospace; margin-top: 4px;">
            Sales Order: <strong>${invoice.orderNo || 'SO-2026-REF'}</strong><br>
            Customer PO: <strong>${invoice.poNumber || 'N/A'}</strong>
          </div>
        </td>
      </tr>
    </table>

    <!-- Buyer Details Grid -->
    <div class="grid-2">
      <div class="grid-cell" style="border-right: 1px solid #cbd5e1;">
        <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">
          Billed To (Customer Details)
        </div>
        <div style="font-size: 13px; font-weight: bold; color: #0f172a;">
          ${invoice.customerSnapshot?.name || 'Customer Name'}
        </div>
        <div style="color: #475569; margin-top: 2px;">
          ${invoice.customerSnapshot?.address || 'Customer Address'}
        </div>
        <div style="margin-top: 4px; font-family: monospace;">
          <strong>Customer GSTIN:</strong> ${invoice.customerSnapshot?.gstin || 'UNREGISTERED'}<br>
          <strong>State:</strong> ${invoice.customerSnapshot?.stateName || 'Maharashtra'} (Code: ${invoice.placeOfSupply})
        </div>
      </div>
      <div class="grid-cell">
        <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">
          Dispatch & Payment Terms
        </div>
        <div><strong>Payment Terms:</strong> ${paymentTerms?.name || 'Net 30 Days'}</div>
        <div><strong>Place of Supply:</strong> State Code ${invoice.placeOfSupply} (${invoice.taxType === 'INTER_STATE' ? 'Inter-State IGST' : 'Intra-State CGST+SGST'})</div>
        <div><strong>Reverse Charge Applicable:</strong> NO</div>
        <div><strong>Dispatch Mode:</strong> Dedicated Surface Logistics / Road Transport</div>
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 30px;">#</th>
          <th>Item Description & Specifications</th>
          <th style="width: 75px; text-align: center;">HSN Code</th>
          <th style="width: 70px; text-align: right;">Quantity</th>
          <th style="width: 80px; text-align: right;">Unit Rate</th>
          <th style="width: 90px; text-align: right;">Taxable Value</th>
          ${!isInterState ? `
            <th style="width: 70px; text-align: right;">CGST (9%)</th>
            <th style="width: 70px; text-align: right;">SGST (9%)</th>
          ` : `
            <th style="width: 75px; text-align: right;">IGST (18%)</th>
          `}
          <th style="width: 95px; text-align: right;">Total Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <!-- Totals Summary & Bank Details Block -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
      <tr>
        <td style="vertical-align: top; width: 55%; padding-right: 14px;">
          <div style="font-size: 11px; margin-bottom: 8px;">
            <strong>Amount Chargeable (in words):</strong><br>
            <span style="color: #0369a1; font-style: italic; font-weight: 600;">Indian Rupees ${amountWords} Only</span>
          </div>

          <!-- Company Bank Account Block -->
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; font-size: 11px;">
            <div style="font-size: 10px; font-weight: bold; color: #475569; text-transform: uppercase; margin-bottom: 4px;">
              Bank Remittance Details (NEFT / RTGS)
            </div>
            <div>Bank: <strong>${companyProfile.bankDetails?.bankName}</strong></div>
            <div>Account Number: <strong style="font-family: monospace; font-size: 12px; color: #0284c7;">${companyProfile.bankDetails?.accountNumber}</strong></div>
            <div>IFSC Code: <strong style="font-family: monospace;">${companyProfile.bankDetails?.ifsc}</strong> · Branch: ${companyProfile.bankDetails?.branch}</div>
            <div>UPI ID: <span style="color: #059669; font-family: monospace;">${companyProfile.bankDetails?.upiId}</span></div>
          </div>

          <div style="font-size: 10px; color: #64748b; margin-top: 8px; white-space: pre-line;">
            ${companyProfile.footerTerms}
          </div>
        </td>

        <td style="vertical-align: top; width: 45%;">
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <tr>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1; color: #475569;">Total Taxable Value:</td>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace; font-weight: bold;">₹${Number(invoice.taxableTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            ${!isInterState ? `
              <tr>
                <td style="padding: 5px 8px; border: 1px solid #cbd5e1; color: #475569;">Central GST (CGST 9%):</td>
                <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace;">₹${Number(invoice.cgstTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="padding: 5px 8px; border: 1px solid #cbd5e1; color: #475569;">State GST (SGST 9%):</td>
                <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace;">₹${Number(invoice.sgstTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            ` : `
              <tr>
                <td style="padding: 5px 8px; border: 1px solid #cbd5e1; color: #475569;">Integrated GST (IGST 18%):</td>
                <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace;">₹${Number(invoice.igstTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            `}
            <tr>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1; color: #475569;">Round Off:</td>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace;">₹${Number(invoice.roundOff || 0).toFixed(2)}</td>
            </tr>
            <tr style="background: #0f172a; color: #ffffff;">
              <td style="padding: 8px 10px; font-weight: bold; font-size: 13px;">Invoice Grand Total:</td>
              <td style="padding: 8px 10px; text-align: right; font-family: monospace; font-weight: bold; font-size: 14px; color: #38bdf8;">
                ₹${Number(invoice.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </table>

          <!-- Signature Block -->
          <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; margin-top: 14px; text-align: center;">
            <div style="font-size: 10px; color: #64748b; font-weight: bold;">For ${companyProfile.legalName}</div>
            <div style="height: 40px;"></div>
            <div style="font-size: 11px; font-weight: bold; color: #0f172a;">Authorized Signatory</div>
            <div style="font-size: 9px; color: #64748b;">(Digitally Verified & Approved by Finance)</div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

function convertNumberToIndianWords(num) {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if ((num = num.toString()).length > 9) return 'Overflow';
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str.trim();
}
