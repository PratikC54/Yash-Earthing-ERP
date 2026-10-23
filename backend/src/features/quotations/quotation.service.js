import prisma from "../../db/prisma.js";
import { sendEmail } from "../../services/mailer.service.js";

// Helper to auto-generate quotation number (e.g. QT-261022-457)
export async function generateQuotationNo() {
  const today = new Date();
  const dateStr = today.toISOString().slice(2, 10).replace(/-/g, "");
  const count = await prisma.quotation.count();
  return `QT-${dateStr}-${String(count + 400 + 1).padStart(3, "0")}`;
}

export async function getQuotations({ search, status, page = 1, limit = 50 }) {
  const where = {};

  if (search) {
    where.OR = [
      { quotationNo: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
      { lead: { customerName: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (status && status !== "ALL") {
    where.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [total, quotations] = await Promise.all([
    prisma.quotation.count({ where }),
    prisma.quotation.findMany({
      where,
      include: {
        customer: true,
        lead: true,
        salesRepresentative: {
          select: { id: true, name: true, email: true, role: true },
        },
        items: {
          include: {
            product: true,
          },
        },
        salesOrder: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(limit),
    }),
  ]);

  return { total, page: Number(page), limit: Number(limit), quotations };
}

export async function getQuotationById(id) {
  const quotation = await prisma.quotation.findUnique({
    where: { id: Number(id) },
    include: {
      customer: true,
      lead: true,
      salesRepresentative: {
        select: { id: true, name: true, email: true, phone: true, role: true },
      },
      items: {
        include: {
          product: true,
        },
      },
      salesOrder: true,
    },
  });

  if (!quotation) {
    const error = new Error("Quotation not found");
    error.statusCode = 404;
    throw error;
  }

  return quotation;
}

export async function createQuotation(data, user) {
  const customerId = Number(data.customerId);
  const leadId = data.leadId ? Number(data.leadId) : null;
  const salesRepId = data.salesRepresentativeId ? Number(data.salesRepresentativeId) : user?.id || 1;

  // Prevent duplicate quotations on the same lead if one already exists
  if (leadId) {
    const existing = await prisma.quotation.findFirst({
      where: { leadId },
      orderBy: { createdAt: "desc" },
    });
    if (existing) {
      const error = new Error(
        `Quotation ${existing.quotationNo} has already been issued for this enquiry. Please use "Revise Quotation" to negotiate or update terms.`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  const quotationNo = data.quotationNo || (await generateQuotationNo());

  // Calculate items and totals
  let subtotal = 0;
  const rawItems = data.items && data.items.length > 0 ? data.items : [];

  for (const item of rawItems) {
    const qty = Number(item.quantity || 1);
    const rate = Number(item.unitPrice || item.rate || 2150);
    subtotal += qty * rate;
  }

  const discountPercent = Number(data.discountPercent || 0);
  const discountAmount = Number(data.discountAmount || (subtotal * discountPercent) / 100);
  const freightAmount = Number(data.freightAmount || 0);
  const taxableAmount = Math.max(0, subtotal - discountAmount + freightAmount);
  const gstPercent = Number(data.gstPercent || 18);
  const gstAmount = (taxableAmount * gstPercent) / 100;
  const grandTotal = taxableAmount + gstAmount;

  const quotation = await prisma.quotation.create({
    data: {
      quotationNo,
      customerId,
      leadId,
      salesRepresentativeId: salesRepId,
      status: data.status || "DRAFT",
      preparedBy: user?.name ? `${user.name} (${user.role || "BACK_OFFICER"})` : "Back Officer (BACK_OFFICER)",
      currency: "INR",
      subtotal,
      discountAmount,
      taxableAmount,
      freightAmount,
      gstPercent,
      gstAmount,
      total: grandTotal,
      validityDays: Number(data.validityDays || 15),
      paymentTerms: data.paymentTerms || "100% Advance against PI",
      deliveryTerms: data.deliveryTerms || "Ex-Works Pune / Road Transport",
      termsAndConditions:
        data.termsAndConditions ||
        "1. Taxation: GST extra as applicable at actuals.\n2. Delivery: Within 1 to 2 days after receipt of confirmed PO / advance payment.\n3. Standards: Material compliant with IS 3043:2018, MSEB, MHADA, and NABL specifications.\n4. Jurisdiction: All disputes subject to Pune Jurisdiction only.",
      notes: data.notes || "Commercial Estimate & Quotation",
      revision: 0,
    },
  });

  // Create Quotation Items
  if (rawItems.length > 0) {
    for (const it of rawItems) {
      let prodId = it.productId ? Number(it.productId) : null;
      if (!prodId) {
        // Find or fallback to first product
        const defaultProd = await prisma.product.findFirst();
        prodId = defaultProd?.id || 1;
      }
      const qty = Number(it.quantity || 1);
      const rate = Number(it.unitPrice || it.rate || 2150);
      const lineSubtotal = qty * rate;

      await prisma.quotationItem.create({
        data: {
          quotationId: quotation.id,
          productId: prodId,
          description: it.description || it.productName || "GI Earthing Electrode",
          quantity: qty,
          unitPrice: rate,
          discountPercent: Number(it.discountPercent || 0),
          taxPercent: gstPercent,
          subtotal: lineSubtotal,
          lineTotal: lineSubtotal * (1 + gstPercent / 100),
        },
      });
    }
  }

  // If lead is linked, update its stage to QUOTATION_SENT
  if (leadId) {
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        stage: "QUOTATION_SENT",
        lastActivityNote: `Quotation ${quotationNo} issued by ${user?.name || "Back Officer"}. Total: ₹${grandTotal.toFixed(2)}`,
      },
    }).catch(() => null);
  }

  return getQuotationById(quotation.id);
}

// Revise Quotation for Customer Negotiation
export async function reviseQuotation(id, negotiationData, user) {
  const current = await prisma.quotation.findUnique({
    where: { id: Number(id) },
    include: { items: true },
  });

  if (!current) {
    const error = new Error("Quotation not found");
    error.statusCode = 404;
    throw error;
  }

  const nextRev = (current.revision || 0) + 1;
  const newDiscount = Number(negotiationData.discountAmount || negotiationData.discount || current.discountAmount);
  const newFreight = Number(negotiationData.freightAmount || current.freightAmount);
  const taxable = Math.max(0, Number(current.subtotal) - newDiscount + newFreight);
  const gst = (taxable * Number(current.gstPercent)) / 100;
  const total = taxable + gst;

  const revised = await prisma.quotation.update({
    where: { id: current.id },
    data: {
      revision: nextRev,
      discountAmount: newDiscount,
      freightAmount: newFreight,
      taxableAmount: taxable,
      gstAmount: gst,
      total,
      revisionNotes: negotiationData.notes || `Revision ${nextRev}: Customer negotiated rates/discount applied by ${user?.name || "Back Officer"}`,
      status: "UNDER_REVISION",
    },
    include: {
      items: { include: { product: true } },
      customer: true,
      lead: true,
    },
  });

  return revised;
}

// Finalize Quotation and mark as Proforma Invoice (PI)
export async function finalizeProformaInvoice(id, user) {
  const current = await prisma.quotation.findUnique({
    where: { id: Number(id) },
  });

  if (!current) {
    const error = new Error("Quotation not found");
    error.statusCode = 404;
    throw error;
  }

  const piNumber = `PI-${current.quotationNo.replace("QT-", "")}`;

  const updated = await prisma.quotation.update({
    where: { id: current.id },
    data: {
      status: "APPROVED",
      proformaInvoiceNumber: piNumber,
      proformaInvoiceSentAt: new Date(),
      proformaInvoiceSentChannel: "EMAIL_AND_WHATSAPP",
      approvedAt: new Date(),
      notes: `Finalized as Proforma Invoice (${piNumber}) by ${user?.name || "Back Officer"}`,
    },
    include: {
      customer: true,
      lead: true,
      items: { include: { product: true } },
    },
  });

  // Update lead stage
  if (current.leadId) {
    await prisma.lead.update({
      where: { id: current.leadId },
      data: {
        stage: "QUOTATION_SENT",
        lastActivityNote: `Quotation finalized as Proforma Invoice ${piNumber}`,
      },
    }).catch(() => null);
  }

  return updated;
}

export async function sendQuotationEmail(id, { email, recipientName }) {
  const quotation = await getQuotationById(id);
  const targetEmail = email || quotation.customer?.email || quotation.lead?.email;

  if (!targetEmail) {
    const error = new Error("No recipient email specified for quotation dispatch");
    error.statusCode = 400;
    throw error;
  }

  const itemsHtml = (quotation.items || [])
    .map(
      (it, idx) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>${it.product?.name || "GI Earthing Electrode"}</strong><br/><small>${it.description || ""}</small></td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${it.quantity}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">INR ${Number(it.unitPrice).toFixed(2)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">INR ${Number(it.subtotal || it.lineTotal).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 650px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #0f2b5c; border-bottom: 2px solid #0f2b5c; padding-bottom: 8px;">Yash Earthing Solutions Pvt Ltd</h2>
      <p>Dear <strong>${recipientName || quotation.customer?.name || quotation.lead?.customerName || "Customer"}</strong>,</p>
      <p>Greetings from Yash Earthing Solutions.</p>
      <p>Please find below the commercial estimate and quotation <strong>${quotation.quotationNo}</strong> (Rev-${quotation.revision || 0}).</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
        <thead>
          <tr style="background: #f4f6fa; color: #333;">
            <th style="padding: 8px; border: 1px solid #ddd;">#</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Item Description</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Qty</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Rate</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4" style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">Grand Total (Incl. GST):</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold; color: #0f2b5c;">INR ${Number(quotation.total).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <div style="background: #f8fafc; padding: 12px; border-radius: 6px; font-size: 12px; margin-top: 16px;">
        <p style="margin: 0 0 6px 0;"><strong>Payment Terms:</strong> ${quotation.paymentTerms || "100% Advance against PI"}</p>
        <p style="margin: 0 0 6px 0;"><strong>Delivery:</strong> ${quotation.deliveryTerms || "Ex-Works Pune / Road Transport"}</p>
        <p style="margin: 0;"><strong>Bank Details:</strong> STATE BANK OF INDIA | A/c: 42706903179 | IFSC: SBIN0004726 (Branch: SIB PUNE)</p>
      </div>

      <p style="margin-top: 20px; font-size: 13px;">
        Prepared by: <strong>${quotation.preparedBy || "Back Officer"}</strong><br/>
        For any clarification, please reply directly to this email or contact our Sales Consultant.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <small style="color: #888;">Yash Earthing Solutions Pvt Ltd · Regd Office: Satara Road, Pune 411043</small>
    </div>
  `;

  const mailResult = await sendEmail({
    to: targetEmail,
    subject: `Commercial Quotation ${quotation.quotationNo} (Rev-${quotation.revision || 0}) - Yash Earthing Solutions`,
    html: emailHtml,
    text: `Quotation ${quotation.quotationNo} for amount INR ${Number(quotation.total).toFixed(2)} has been released for ${recipientName || targetEmail}.`,
  });

  await prisma.quotation.update({
    where: { id: Number(id) },
    data: {
      emailSentAt: new Date(),
      emailRecipient: targetEmail,
      status: "SENT_TO_CLIENT",
    },
  });

  return {
    success: true,
    message: `Quotation successfully sent to ${targetEmail} from pratik.fundsaudit@gmail.com`,
    mailResult,
  };
}

export async function deleteQuotation(id) {
  await prisma.quotation.delete({
    where: { id: Number(id) },
  });
  return { success: true };
}
