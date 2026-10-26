import PDFDocument from "pdfkit";

/**
 * Generate official Yash Earthing Solutions Quotation PDF buffer using PDFKit.
 * @param {Object} quotation - Full quotation record with items and customer/lead relations
 * @returns {Promise<Buffer>}
 */
export async function generateQuotationPdf(quotation) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 36, bottom: 40, left: 36, right: 36 },
        bufferPages: true,
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const quoteNo = quotation.quotationNo || "QT-261022-457";
      const revision = quotation.revision || 0;
      const customerName =
        quotation.customer?.name ||
        quotation.lead?.customerName ||
        "Valued Customer";
      const items = quotation.items && quotation.items.length > 0 ? quotation.items : [];

      const subtotal = Number(quotation.subtotal || 0);
      const discountAmount = Number(quotation.discountAmount || 0);
      const taxableAmount = Number(quotation.taxableAmount || (subtotal - discountAmount));
      const cgst = Number(quotation.cgstAmount || (taxableAmount * 0.09));
      const sgst = Number(quotation.sgstAmount || (taxableAmount * 0.09));
      const grandTotal = Number(quotation.total || (taxableAmount + cgst + sgst));

      // Header Brand
      doc.rect(36, 36, 523, 76).fillAndStroke("#f8fafc", "#e2e8f0");

      doc.fillColor("#1e3a8a").fontSize(15).font("Helvetica-Bold")
        .text("YASH EARTHING SOLUTIONS PVT LTD", 48, 46);

      doc.fillColor("#64748b").fontSize(8).font("Helvetica")
        .text("Regd. Office: Shop No. 2, Basement Rajdhani Complex, Satara Road, Pune - 411043", 48, 64)
        .text("Plant / Works: Gate No. 118, Uruli Devachi, Handewadi Road, Haveli, Pune - 412308", 48, 75)
        .text("GSTIN: 27AABCY2449P1ZP | PAN: AABCY2449P | CIN: U31909PN2021PTC199842", 48, 86)
        .text("Email: sales@yashearthing.com | Tel: +91 9370335298 / +91 (020) 2437-8890", 48, 97);

      // Quote Ref Box
      doc.rect(420, 46, 128, 56).fillAndStroke("#eff6ff", "#bfdbfe");
      doc.fillColor("#1e40af").fontSize(9).font("Helvetica-Bold")
        .text("COMMERCIAL QUOTE", 425, 52, { width: 118, align: "center" });
      doc.fillColor("#0f172a").fontSize(8).font("Helvetica")
        .text(`Ref: ${quoteNo}`, 425, 66, { width: 118, align: "center" })
        .text(`Rev: Rev-${revision}`, 425, 78, { width: 118, align: "center" })
        .text(`Date: ${new Date(quotation.createdAt || Date.now()).toLocaleDateString("en-IN")}`, 425, 89, { width: 118, align: "center" });

      doc.y = 120;

      // Two-column client & commercial info
      const colWidth = 255;
      const col1X = 36;
      const col2X = 304;

      // Col 1: Customer Details
      doc.rect(col1X, 120, colWidth, 75).fillAndStroke("#f8fafc", "#cbd5e1");
      doc.fillColor("#1e3a8a").fontSize(9).font("Helvetica-Bold").text("QUOTED TO (CLIENT):", col1X + 10, 126);
      doc.fillColor("#0f172a").fontSize(9).font("Helvetica-Bold").text(customerName, col1X + 10, 139);
      doc.fillColor("#475569").fontSize(8).font("Helvetica")
        .text(`Contact: ${quotation.lead?.contactName || quotation.customer?.contactPerson || "Commercial Dept"}`, col1X + 10, 151)
        .text(`Phone: ${quotation.lead?.phone || quotation.customer?.phone || "—"}`, col1X + 10, 162)
        .text(`Email: ${quotation.lead?.email || quotation.customer?.email || "—"}`, col1X + 10, 173)
        .text(`GSTIN: ${quotation.customer?.gstin || "27AAACT2727Q1ZR"}`, col1X + 10, 184);

      // Col 2: Terms & Commercials
      doc.rect(col2X, 120, colWidth, 75).fillAndStroke("#f8fafc", "#cbd5e1");
      doc.fillColor("#1e3a8a").fontSize(9).font("Helvetica-Bold").text("COMMERCIAL TERMS:", col2X + 10, 126);
      doc.fillColor("#475569").fontSize(8).font("Helvetica")
        .text(`Payment: ${quotation.paymentTerms || "100% Advance against PI"}`, col2X + 10, 139)
        .text(`Delivery: ${quotation.deliveryTerms || "Ex-Works Pune / Road Transport"}`, col2X + 10, 151)
        .text(`Validity: 15 Days from quote release`, col2X + 10, 162)
        .text(`Place of Supply: 27-Maharashtra`, col2X + 10, 173)
        .text(`Prepared By: ${quotation.preparedBy || "Back Officer"}`, col2X + 10, 184);

      // Items Table
      let startY = 205;
      doc.rect(36, startY, 523, 20).fillAndStroke("#1e3a8a", "#1e3a8a");
      doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold")
        .text("#", 42, startY + 6, { width: 20 })
        .text("Item / Description", 66, startY + 6, { width: 230 })
        .text("Make", 300, startY + 6, { width: 40 })
        .text("Qty", 345, startY + 6, { width: 35, align: "center" })
        .text("Rate (INR)", 385, startY + 6, { width: 55, align: "right" })
        .text("GST", 445, startY + 6, { width: 35, align: "center" })
        .text("Total (INR)", 485, startY + 6, { width: 66, align: "right" });

      startY += 20;

      items.forEach((it, idx) => {
        const itemRowHeight = 36;
        const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
        doc.rect(36, startY, 523, itemRowHeight).fillAndStroke(bg, "#e2e8f0");

        doc.fillColor("#0f172a").fontSize(8).font("Helvetica")
          .text(String(idx + 1), 42, startY + 6, { width: 20 })
          .font("Helvetica-Bold").text(it.product?.name || "GI Earthing Electrode", 66, startY + 6, { width: 230 })
          .font("Helvetica").fontSize(7).fillColor("#64748b")
          .text(it.description || 'YASH Make GI Chemical Earthing Electrode with BFC compound', 66, startY + 17, { width: 230, height: 16, ellipsis: true });

        doc.fillColor("#047857").fontSize(8).font("Helvetica-Bold").text("YASH", 300, startY + 6, { width: 40 });
        doc.fillColor("#0f172a").font("Helvetica").text(String(it.quantity || 1), 345, startY + 6, { width: 35, align: "center" });
        doc.text(Number(it.unitPrice || 0).toFixed(2), 385, startY + 6, { width: 55, align: "right" });
        doc.text("18%", 445, startY + 6, { width: 35, align: "center" });
        doc.font("Helvetica-Bold").text(Number(it.subtotal || (it.quantity * it.unitPrice) || 0).toFixed(2), 485, startY + 6, { width: 66, align: "right" });

        startY += itemRowHeight;
      });

      // Total Calculation Box
      const summaryY = startY + 10;
      doc.rect(36, summaryY, 260, 80).fillAndStroke("#f8fafc", "#cbd5e1");
      doc.fillColor("#1e3a8a").fontSize(8).font("Helvetica-Bold")
        .text("DIRECT BANK REMITTANCE:", 46, summaryY + 8);
      doc.fillColor("#334155").fontSize(8).font("Helvetica")
        .text("Bank Name: STATE BANK OF INDIA", 46, summaryY + 22)
        .text("Account No: 42706903179 (Current A/c)", 46, summaryY + 34)
        .text("IFSC Code: SBIN0004726 | Branch: SIB PUNE", 46, summaryY + 46)
        .text("A/c Holder: YASH EARTHING SOLUTIONS PVT LTD", 46, summaryY + 58);

      // Financial Summary Box
      doc.rect(310, summaryY, 249, 80).fillAndStroke("#ffffff", "#cbd5e1");
      doc.fillColor("#475569").fontSize(8).font("Helvetica")
        .text("Taxable Subtotal:", 320, summaryY + 8)
        .text(`INR ${taxableAmount.toFixed(2)}`, 430, summaryY + 8, { width: 120, align: "right" })
        .text("Central GST (CGST 9%):", 320, summaryY + 22)
        .text(`INR ${cgst.toFixed(2)}`, 430, summaryY + 22, { width: 120, align: "right" })
        .text("State GST (SGST 9%):", 320, summaryY + 36)
        .text(`INR ${sgst.toFixed(2)}`, 430, summaryY + 36, { width: 120, align: "right" });

      doc.rect(310, summaryY + 52, 249, 28).fillAndStroke("#1e3a8a", "#1e3a8a");
      doc.fillColor("#ffffff").fontSize(9).font("Helvetica-Bold")
        .text("GRAND TOTAL (INR):", 320, summaryY + 60)
        .text(`INR ${grandTotal.toFixed(2)}`, 430, summaryY + 60, { width: 120, align: "right" });

      // Signatory
      const signY = summaryY + 95;
      doc.fillColor("#64748b").fontSize(7).font("Helvetica")
        .text("1. All taxes extra as applicable at actuals. Material compliant with IS 3043:2018 specifications.", 36, signY)
        .text("2. Computer-generated authenticated commercial document. Pune Jurisdiction only.", 36, signY + 11);

      doc.fillColor("#1e3a8a").fontSize(8).font("Helvetica-Bold")
        .text("For YASH EARTHING SOLUTIONS PVT LTD", 360, signY, { width: 199, align: "right" });
      doc.fillColor("#475569").fontSize(8).font("Helvetica")
        .text("Authorised Signatory", 360, signY + 24, { width: 199, align: "right" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

