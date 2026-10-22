import prisma from "./src/db/prisma.js";
import * as leadService from "./src/features/leads/lead.service.js";
import * as quotationService from "./src/features/quotations/quotation.service.js";
import * as orderService from "./src/features/orders/order.service.js";

async function runEndToEndModule1Test() {
  console.log("==========================================================");
  console.log("🚀 STARTING MODULE 1 END-TO-END WORKFLOW INTEGRATION TEST");
  console.log("==========================================================");

  try {
    // 0. Ensure we have users & products for testing
    const consultant = await prisma.user.findFirst({
      where: { role: "SALES_CONSULTANT" },
    });
    const backOfficer = await prisma.user.findFirst({
      where: { role: "BACK_OFFICER" },
    });
    const salesManager = await prisma.user.findFirst({
      where: { role: "SALES_MANAGER" },
    });
    const product = await prisma.product.findFirst({
      where: { sku: "YGI501F" },
    }) || await prisma.product.findFirst();

    console.log(`👤 Sales Consultant: ${consultant?.name || "Found"}`);
    console.log(`👤 Back Officer: ${backOfficer?.name || "Found"}`);
    console.log(`👤 Sales Manager: ${salesManager?.name || "Found"}`);
    console.log(`📦 Standard Product: ${product?.name} (${product?.sku})`);

    // STEP 1: Inbound Lead Creation & Auto-Assignment to SALES_CONSULTANT
    console.log("\n[STEP 1] Testing Inbound Lead Creation & Auto-Assignment...");
    const testLead = await leadService.createLead({
      customerName: "L&T Infrastructure Projects Ltd",
      phone: "+91 98220 11223",
      email: "procurement@ltinfra.com",
      city: "Mumbai",
      source: "INDIAMART",
      productName: "GI Earthing Electrode 50mm x 1Mtr",
      quantity: 50,
      estimatedValue: 125000,
      priority: "HIGH",
    });

    console.log(`✅ Lead Created: ${testLead.code}`);
    console.log(`   Assigned To: ${testLead.assignedTo?.name} (${testLead.assignedTo?.role})`);
    if (testLead.assignedTo?.role !== "SALES_CONSULTANT") {
      throw new Error("Lead was not auto-assigned to SALES_CONSULTANT!");
    }

    // STEP 2: Call Failed -> Auto-Schedule Follow-up
    console.log("\n[STEP 2] Testing Call Attempt 1: Busy/No Answer -> Auto Follow-up...");
    const call1 = await leadService.logCall(testLead.id, {
      userId: consultant.id,
      outcome: "BUSY",
      durationMinutes: 1,
      notes: "Customer on site meeting. Requested callback tomorrow morning.",
      followUpDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      succeeded: false,
    });
    console.log(`✅ Call Logged: Outcome=${call1.outcome}, Follow-up Scheduled=${call1.followUpDate}`);

    const followups = await leadService.getFollowups({ search: "L&T" });
    console.log(`   Follow-up Register shows: ${followups.length} scheduled callback(s) for this client.`);

    // STEP 3: Call Succeeded -> Finalize Enquiry & Move to QUOTATION_REQUESTED
    console.log("\n[STEP 3] Testing Call Attempt 2: Connected & Requirement Finalized...");
    const call2 = await leadService.logCall(testLead.id, {
      userId: consultant.id,
      outcome: "QUOTATION_REQUESTED",
      durationMinutes: 6,
      notes: "Requirement finalized for 50 units GI Electrodes. Customer asked Back Office for urgent quote with GST breakup.",
      succeeded: true,
    });
    console.log(`✅ Call Logged: Outcome=${call2.outcome}`);

    const updatedLead = await prisma.lead.findUnique({ where: { id: testLead.id } });
    console.log(`   Lead Stage updated to: ${updatedLead.stage}`);
    if (updatedLead.stage !== "REQUIREMENT_CAPTURED") {
      throw new Error("Lead stage did not advance to REQUIREMENT_CAPTURED!");
    }

    // STEP 4: Back Officer Issues Commercial Quotation (HTML Render / PDF Spec)
    console.log("\n[STEP 4] Testing Quotation Issuance by Back Officer...");
    const quotation = await quotationService.createQuotation({
      leadId: testLead.id,
      customerId: testLead.customerId,
      createdById: backOfficer?.id,
      subtotal: 107500,
      discountAmount: 2500,
      freightAmount: 1500,
      items: [
        {
          productId: product.id,
          sku: product.sku,
          description: product.description || "GI Earthing Electrode",
          quantity: 50,
          rate: 2150,
          gstPercent: 18,
        },
      ],
      paymentTerms: "100% Advance against PI",
      deliveryTerms: "Ex-Works Pune / Road Transport",
    });

    console.log(`✅ Quotation Generated: ${quotation.quotationNo} (Rev-${quotation.revision})`);
    console.log(`   Taxable Amount: ₹${quotation.taxableAmount}`);
    console.log(`   CGST (9%): ₹${quotation.cgstAmount} | SGST (9%): ₹${quotation.sgstAmount}`);
    console.log(`   Grand Total: ₹${quotation.total}`);

    // STEP 5: Negotiation -> Issue Quotation Revision (Rev-1)
    console.log("\n[STEP 5] Testing Negotiation & Revision (Rev-1)...");
    const revisedQuote = await quotationService.reviseQuotation(quotation.id, {
      userId: backOfficer?.id,
      discountAmount: 5000,
      notes: "Customer requested 5% bulk discount for 50 electrode units.",
    });
    console.log(`✅ Quotation Revised: ${revisedQuote.quotationNo} (Rev-${revisedQuote.revision})`);
    console.log(`   Status: ${revisedQuote.status}, New Total: ₹${revisedQuote.total}`);
    if (revisedQuote.revision !== 1 || revisedQuote.status !== "UNDER_REVISION") {
      throw new Error("Revision logic did not increment revision number or update status!");
    }

    // STEP 6: Finalize Quotation as Proforma Invoice (PI)
    console.log("\n[STEP 6] Testing Finalization of Quotation as PI...");
    const proforma = await quotationService.finalizeProformaInvoice(revisedQuote.id, {
      userId: backOfficer?.id,
    });
    console.log(`✅ Marked as Proforma Invoice: ${proforma.proformaInvoiceNumber}`);
    console.log(`   Status: ${proforma.status}`);
    if (proforma.status !== "APPROVED" || !proforma.proformaInvoiceNumber.startsWith("PI-")) {
      throw new Error("Quotation was not correctly finalized as PI!");
    }

    // STEP 7: Customer Issues PO -> Back Officer Records Customer PO
    console.log("\n[STEP 7] Testing Customer PO Issuance by Back Officer...");
    const customerPO = await orderService.issueCustomerPO({
      quotationId: proforma.id,
      poNumber: "PO-LT-2026-9921",
      poDate: new Date(),
      deliveryTerms: "Site Delivery - Mumbai Metro Line 4",
      notes: "Official Customer Purchase Order received against PI",
      issuedById: backOfficer?.id,
    });
    console.log(`✅ Customer PO Recorded: ${customerPO.customerPONumber}`);
    console.log(`   Linked Lead Stage: ${customerPO.lead?.stage}`);
    if (customerPO.lead?.stage !== "PO_RECEIVED") {
      throw new Error("Lead stage was not updated to PO_RECEIVED!");
    }

    // STEP 8: Sales Manager Issues & Releases Sales Order (SO)
    console.log("\n[STEP 8] Testing Sales Order Issuance by Sales Manager...");
    const salesOrder = await orderService.createSalesOrder({
      quotationId: proforma.id,
      customerId: proforma.customerId,
      salesManagerId: salesManager?.id,
      deliveryLocation: "Mumbai Metro Line 4 Site Yard",
      remarks: "Commercial terms approved. Released to factory for dispatch reservation.",
    });
    console.log(`✅ Sales Order Issued: ${salesOrder.orderNumber}`);
    console.log(`   Status: ${salesOrder.status}, Grand Total: ₹${salesOrder.grandTotal}`);

    // STEP 9: Inventory Stock Verification & Reservation for Standard Product
    console.log("\n[STEP 9] Testing Inventory Stock Check & Reservation...");
    const stockCheck = await orderService.checkInventoryStockAndReserve(salesOrder.id);
    console.log(`✅ Inventory Check Result:`);
    console.log(`   Order Number: ${stockCheck.orderNumber}`);
    console.log(`   Stock Reserved: ${stockCheck.stockReserved}`);
    console.log(`   Dispatch Status: ${stockCheck.dispatchStatus}`);
    console.log(`   Workflow Message: ${stockCheck.message}`);
    stockCheck.items.forEach((it) => {
      console.log(`   -> Product: ${it.productName} | Ordered: ${it.orderedQuantity} | Stock: ${it.availableStock} | InStock: ${it.inStock}`);
    });

    if (stockCheck.stockReserved) {
      console.log("   🎉 Product is standard, stock was available and successfully RESERVED!");
    }

    console.log("\n==========================================================");
    console.log("🎯 ALL 9 WORKFLOW STEPS PASSED WITH 100% SUCCESS!");
    console.log("==========================================================");
  } catch (error) {
    console.error("❌ E2E TEST FAILED:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runEndToEndModule1Test();
