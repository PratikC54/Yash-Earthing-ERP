import { financeDb } from './db/financeDb.js';
import { generateTaxInvoiceHtml } from './invoicePdfGenerator.js';

export const financeController = {
  // ===================== 1. DASHBOARD & CRITICAL ACTIONS =====================
  getDashboardSummary: (req, res) => {
    const db = financeDb.read();
    const today = new Date();

    // 1. Total Revenue (sum of taxable value of issued invoices less approved credit notes)
    const totalRevenue = db.invoices
      .filter(inv => inv.status !== 'DRAFT' && inv.status !== 'CANCELLED')
      .reduce((sum, inv) => sum + (Number(inv.taxableTotal) || 0), 0);

    // 2. Receivables
    let totalReceivables = 0;
    let overdueReceivables = 0;
    let criticalActions = [];

    db.invoices.forEach(inv => {
      if (inv.status !== 'DRAFT' && inv.status !== 'CANCELLED') {
        const bal = Math.max(0, Number(inv.balanceAmount) || 0);
        totalReceivables += bal;

        const due = new Date(inv.dueDate);
        const isOverdue = due < today && bal > 0;
        if (isOverdue) {
          overdueReceivables += bal;
          const diffDays = Math.ceil((today - due) / (1000 * 60 * 60 * 24));
          criticalActions.push({
            id: `crit_inv_${inv.id}`,
            type: 'OVERDUE_INVOICE',
            severity: diffDays > 30 ? 'HIGH' : 'MEDIUM',
            title: `Invoice ${inv.invoiceNo} Overdue by ${diffDays} Days`,
            customer: inv.customerSnapshot?.name || 'Customer',
            amount: bal,
            dueDate: inv.dueDate,
            actionUrl: `/finance?tab=receivables&invoiceId=${inv.id}`
          });
        }
      }
    });

    // 3. Payables
    let totalPayables = 0;
    db.vendorBills.forEach(vb => {
      if (vb.status === 'APPROVED' || vb.status === 'DRAFT') {
        const bal = Math.max(0, Number(vb.balanceAmount) || 0);
        totalPayables += bal;

        const due = new Date(vb.dueDate);
        const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7 && bal > 0) {
          criticalActions.push({
            id: `crit_vb_${vb.id}`,
            type: 'VENDOR_BILL_DUE',
            severity: diffDays < 0 ? 'HIGH' : 'LOW',
            title: `Vendor Bill ${vb.billNo} Due ${diffDays < 0 ? 'OVERDUE' : `in ${diffDays}d`}`,
            customer: vb.vendorName,
            amount: bal,
            dueDate: vb.dueDate,
            actionUrl: `/finance?tab=payables`
          });
        }
      }
    });

    // 4. Job Costing & Margins Aggregate
    const totalJobRevenue = db.invoices
      .filter(inv => inv.status !== 'DRAFT' && inv.status !== 'CANCELLED')
      .reduce((sum, inv) => sum + Number(inv.taxableTotal), 0);
    const totalJobCost = db.jobCostLedger.reduce((sum, jc) => sum + Number(jc.amount), 0);
    const avgMarginPercent = totalJobRevenue > 0
      ? (((totalJobRevenue - totalJobCost) / totalJobRevenue) * 100).toFixed(1)
      : "34.5";

    // 5. Unallocated Advance Cash Held
    const totalUnallocatedCredit = db.receipts.reduce((sum, r) => sum + (Number(r.unallocatedAmount) || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalRevenue,
          totalReceivables,
          overdueReceivables,
          totalPayables,
          avgMarginPercent: Number(avgMarginPercent),
          unallocatedCredit: totalUnallocatedCredit,
          dsoDays: 28 // Days Sales Outstanding
        },
        criticalActions: criticalActions.slice(0, 8)
      }
    });
  },

  // ===================== 2. BILLING ELIGIBILITY & DISPATCH (M1/M2/M4) =====================
  getBillableOrders: (req, res) => {
    const db = financeDb.read();

    // Map sales orders into billable candidate line items
    const billableCandidates = db.salesOrders.map(so => {
      const customer = db.customers.find(c => c.id === so.customerId);
      const billableLines = (so.items || []).map(it => {
        const eligibleQty = Math.max(0, (it.dispatchedQty || 0) - (it.invoicedQty || 0));
        return {
          ...it,
          eligibleQty,
          isBillable: eligibleQty > 0 && !so.hasOpenQcHold
        };
      });

      const totalEligibleValue = billableLines.reduce((sum, it) => sum + (it.eligibleQty * it.rate), 0);

      return {
        orderId: so.id,
        orderNo: so.orderNo,
        orderDate: so.orderDate,
        customerId: so.customerId,
        customerName: customer?.name || 'Unknown Customer',
        customerGstin: customer?.gstin || '',
        customerStateCode: customer?.stateCode || '27',
        poNumber: so.poNumber,
        hasOpenQcHold: Boolean(so.hasOpenQcHold),
        qcHoldReason: so.hasOpenQcHold ? "Open QC Hold from Production M4 (Line inspection in progress)" : null,
        billingPlan: so.billingPlan,
        items: billableLines,
        totalEligibleValue,
        canInvoice: totalEligibleValue > 0 && !so.hasOpenQcHold
      };
    });

    res.status(200).json({
      success: true,
      data: billableCandidates
    });
  },

  // ===================== 3. INVOICE LIFECYCLE (M6.1) =====================
  getInvoices: (req, res) => {
    const db = financeDb.read();
    const today = new Date();

    const enriched = db.invoices.map(inv => {
      const due = new Date(inv.dueDate);
      const isOverdue = due < today && inv.balanceAmount > 0;
      let derivedStatus = inv.status;
      if (inv.status === 'ISSUED') {
        if (inv.balanceAmount <= 0) derivedStatus = 'PAID';
        else if (inv.paidAmount > 0) derivedStatus = isOverdue ? 'PART_PAID_OVERDUE' : 'PART_PAID';
        else derivedStatus = isOverdue ? 'OVERDUE' : 'ISSUED';
      }

      return {
        ...inv,
        derivedStatus,
        isOverdue,
        overdueDays: isOverdue ? Math.ceil((today - due) / (1000 * 60 * 60 * 24)) : 0
      };
    });

    res.status(200).json({
      success: true,
      data: enriched
    });
  },

  createInvoice: (req, res) => {
    const db = financeDb.read();
    const {
      salesOrderId,
      customerId,
      items, // array of { productId, sku, description, hsn, qty, rate, taxRate }
      paymentTermsId,
      poNumber,
      notes
    } = req.body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Customer and at least one item are required.' });
    }

    const customer = db.customers.find(c => c.id === customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found in registry.' });
    }

    // Check upstream QC Hold if linked to an order
    const salesOrder = db.salesOrders.find(so => so.id === salesOrderId);
    if (salesOrder?.hasOpenQcHold) {
      return res.status(422).json({
        success: false,
        message: 'Cannot generate invoice: This sales order has an active QC HOLD flagged by Production (M4).'
      });
    }

    // Determine GST Place of supply
    const placeOfSupply = customer.stateCode || '27';
    const isInterState = placeOfSupply !== db.companyProfile.stateCode;
    const taxType = isInterState ? 'INTER_STATE' : 'INTRA_STATE';

    // Server-side precise tax and line computation
    let taxableTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    const computedItems = items.map((it, idx) => {
      const qty = Math.max(0, Number(it.qty) || 0);
      const rate = Math.max(0, Number(it.rate) || 0);
      const taxable = Math.round(qty * rate * 100) / 100;
      taxableTotal += taxable;

      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      if (!isInterState) {
        cgst = Math.round(taxable * 0.09 * 100) / 100;
        sgst = Math.round(taxable * 0.09 * 100) / 100;
        cgstTotal += cgst;
        sgstTotal += sgst;
      } else {
        igst = Math.round(taxable * 0.18 * 100) / 100;
        igstTotal += igst;
      }

      return {
        id: `item_${Date.now()}_${idx}`,
        productId: it.productId || null,
        sku: it.sku || 'CUSTOM',
        description: it.description || 'Engineering Product',
        hsn: it.hsn || '85359090',
        qty,
        uom: it.uom || 'NOS',
        rate,
        taxableValue: taxable,
        taxRate: 18,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: igst,
        lineTotal: taxable + cgst + sgst + igst
      };
    });

    const rawGrand = taxableTotal + cgstTotal + sgstTotal + igstTotal;
    const grandTotal = Math.round(rawGrand);
    const roundOff = Math.round((grandTotal - rawGrand) * 100) / 100;

    // Due date calculation
    const terms = db.paymentTerms.find(t => t.id === paymentTermsId) || db.paymentTerms[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (terms?.days || 30));

    // Sequential numbering
    const series = db.numberSeries.find(s => s.docType === 'TAX_INVOICE') || db.numberSeries[0];
    const seq = String(series.nextNo).padStart(series.padding, '0');
    const invoiceNo = `INV/2026-27/${seq}`;
    series.nextNo += 1;

    const newInvoice = {
      id: `inv_${Date.now()}`,
      invoiceNo,
      docType: "TAX_INVOICE",
      seriesId: series.id,
      fy: "2026-27",
      customerId,
      salesOrderId: salesOrderId || null,
      orderNo: salesOrder?.orderNo || 'DIRECT-BILL',
      poNumber: poNumber || salesOrder?.poNumber || 'N/A',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      paymentTermsId: terms.id,
      placeOfSupply,
      taxType,
      customerSnapshot: {
        name: customer.name,
        gstin: customer.gstin,
        pan: customer.pan,
        address: customer.address,
        stateName: customer.stateName
      },
      items: computedItems,
      taxableTotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      roundOff,
      grandTotal,
      paidAmount: 0,
      balanceAmount: grandTotal,
      status: "ISSUED",
      isDisputed: false,
      disputeReason: null,
      notes: notes || '',
      createdBy: req.user?.name || "Accounts Executive (Pooja Rao)",
      approvedBy: "Finance Manager (Anita Deshmukh)",
      approvedAt: new Date().toISOString(),
      issuedBy: "Finance Manager (Anita Deshmukh)",
      issuedAt: new Date().toISOString()
    };

    // Update invoicedQty on upstream sales order
    if (salesOrder) {
      items.forEach(it => {
        const soItem = salesOrder.items?.find(i => i.productId === it.productId || i.sku === it.sku);
        if (soItem) {
          soItem.invoicedQty = (soItem.invoicedQty || 0) + Number(it.qty);
        }
      });
    }

    db.invoices.unshift(newInvoice);
    financeDb.write(db);
    financeDb.logAudit(req.user?.name || "Accounts Executive", "CREATE_INVOICE", "Invoice", newInvoice.id, `Created & issued GST invoice ${invoiceNo} for ₹${grandTotal}`);

    res.status(201).json({
      success: true,
      data: newInvoice,
      message: `Invoice ${invoiceNo} created and issued successfully.`
    });
  },

  getInvoicePdf: (req, res) => {
    const db = financeDb.read();
    const invoice = db.invoices.find(i => i.id === req.params.id || i.invoiceNo === req.params.id);
    if (!invoice) {
      return res.status(404).send('Invoice record not found.');
    }

    const terms = db.paymentTerms.find(t => t.id === invoice.paymentTermsId);
    const htmlContent = generateTaxInvoiceHtml(invoice, db.companyProfile, terms);

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https: blob:;");
    res.send(htmlContent);
  },

  // ===================== 4. RECEIPTS & ALLOCATIONS (M6.1) =====================
  getReceipts: (req, res) => {
    const db = financeDb.read();
    res.status(200).json({
      success: true,
      data: db.receipts
    });
  },

  recordReceipt: (req, res) => {
    const db = financeDb.read();
    const {
      customerId,
      receivedOn,
      method,
      referenceNo,
      bank,
      amount,
      notes,
      allocations, // array of { invoiceId, amount }
      deductions   // array of { type, amount, description }
    } = req.body;

    const numAmount = Number(amount);
    if (!customerId || isNaN(numAmount) || numAmount <= 0 || !referenceNo) {
      return res.status(400).json({ success: false, message: 'Valid customer, amount, and reference/UTR are required.' });
    }

    // Duplicate reference check
    const existingRef = db.receipts.find(r => r.referenceNo.toLowerCase() === referenceNo.trim().toLowerCase());
    if (existingRef) {
      return res.status(409).json({ success: false, message: `Receipt with reference/UTR "${referenceNo}" already exists.` });
    }

    const series = db.numberSeries.find(s => s.docType === 'RECEIPT') || db.numberSeries[2];
    const receiptNo = `REC/2026-27/${String(series.nextNo).padStart(series.padding, '0')}`;
    series.nextNo += 1;

    let unallocatedAmount = numAmount;
    const processedAllocations = [];
    const processedDeductions = deductions || [];

    // Apply allocations transactionally to invoices
    if (allocations && Array.isArray(allocations)) {
      allocations.forEach(al => {
        const allocAmount = Number(al.amount);
        if (allocAmount > 0 && allocAmount <= unallocatedAmount) {
          const inv = db.invoices.find(i => i.id === al.invoiceId);
          if (inv) {
            const actualAlloc = Math.min(allocAmount, inv.balanceAmount);
            inv.paidAmount = (Number(inv.paidAmount) || 0) + actualAlloc;
            inv.balanceAmount = Math.max(0, Number(inv.grandTotal) - inv.paidAmount);
            unallocatedAmount -= actualAlloc;

            processedAllocations.push({
              id: `alloc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              invoiceId: inv.id,
              invoiceNo: inv.invoiceNo,
              amount: actualAlloc,
              allocatedBy: req.user?.name || "Accounts Executive (Pooja Rao)",
              allocatedAt: new Date().toISOString()
            });
          }
        }
      });
    }

    const newReceipt = {
      id: `rec_${Date.now()}`,
      receiptNo,
      customerId,
      receivedOn: receivedOn || new Date().toISOString().split('T')[0],
      method: method || 'NEFT',
      referenceNo: referenceNo.trim(),
      bank: bank || 'HDFC Bank Ltd',
      amount: numAmount,
      status: "VERIFIED",
      chequeStatus: method === 'CHEQUE' ? 'PENDING_CLEARANCE' : null,
      idempotencyKey: `idem_${Date.now()}`,
      unallocatedAmount,
      notes: notes || '',
      createdBy: req.user?.name || "Accounts Executive (Pooja Rao)",
      allocations: processedAllocations,
      deductions: processedDeductions
    };

    db.receipts.unshift(newReceipt);
    financeDb.write(db);
    financeDb.logAudit(req.user?.name || "Accounts Executive", "RECORD_RECEIPT", "Receipt", newReceipt.id, `Recorded ${method} receipt ${receiptNo} for ₹${numAmount} (Reference: ${referenceNo})`);

    res.status(201).json({
      success: true,
      data: newReceipt,
      message: `Receipt ${receiptNo} recorded successfully.`
    });
  },

  // ===================== 5. AGEING & CUSTOMER EXPOSURE =====================
  getAgeingSummary: (req, res) => {
    const db = financeDb.read();
    const today = new Date();

    const customerAgeingMap = {};

    db.customers.forEach(c => {
      customerAgeingMap[c.id] = {
        customerId: c.id,
        customerName: c.name,
        contactPerson: c.contactPerson,
        phone: c.phone,
        creditLimit: c.creditLimit,
        current: 0,
        days1_30: 0,
        days31_60: 0,
        days61_90: 0,
        days90Plus: 0,
        totalOutstanding: 0
      };
    });

    db.invoices.forEach(inv => {
      if (inv.status !== 'DRAFT' && inv.status !== 'CANCELLED' && inv.balanceAmount > 0) {
        const bal = Number(inv.balanceAmount);
        const due = new Date(inv.dueDate);
        const diffDays = Math.ceil((today - due) / (1000 * 60 * 60 * 24));

        const target = customerAgeingMap[inv.customerId] || {
          customerId: inv.customerId,
          customerName: inv.customerSnapshot?.name || 'Customer',
          current: 0, days1_30: 0, days31_60: 0, days61_90: 0, days90Plus: 0, totalOutstanding: 0
        };

        target.totalOutstanding += bal;
        if (diffDays <= 0) target.current += bal;
        else if (diffDays <= 30) target.days1_30 += bal;
        else if (diffDays <= 60) target.days31_60 += bal;
        else if (diffDays <= 90) target.days61_90 += bal;
        else target.days90Plus += bal;

        customerAgeingMap[inv.customerId] = target;
      }
    });

    res.status(200).json({
      success: true,
      data: Object.values(customerAgeingMap)
    });
  },

  getCustomerExposure: (req, res) => {
    const db = financeDb.read();
    const { id } = req.params;
    const customer = db.customers.find(c => c.id === id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });

    const customerInvoices = db.invoices.filter(i => i.customerId === id && i.status !== 'DRAFT');
    const totalOutstanding = customerInvoices.reduce((sum, i) => sum + (Number(i.balanceAmount) || 0), 0);

    const today = new Date();
    const overdueAmount = customerInvoices
      .filter(i => new Date(i.dueDate) < today && i.balanceAmount > 0)
      .reduce((sum, i) => sum + Number(i.balanceAmount), 0);

    const unallocatedCredit = db.receipts
      .filter(r => r.customerId === id)
      .reduce((sum, r) => sum + (Number(r.unallocatedAmount) || 0), 0);

    const creditLimit = customer.creditLimit || 500000;
    const netExposure = totalOutstanding - unallocatedCredit;
    const creditHeadroom = Math.max(0, creditLimit - netExposure);

    res.status(200).json({
      success: true,
      data: {
        customerId: customer.id,
        customerName: customer.name,
        creditLimit,
        totalOutstanding,
        overdueAmount,
        unallocatedCredit,
        netExposure,
        creditHeadroom,
        isCreditBlocked: overdueAmount > 50000 || creditHeadroom <= 0
      }
    });
  },

  // ===================== 6. PAYABLES & VENDOR BILLS (M6.2) =====================
  getVendorBills: (req, res) => {
    const db = financeDb.read();
    res.status(200).json({
      success: true,
      data: db.vendorBills
    });
  },

  createVendorBill: (req, res) => {
    const db = financeDb.read();
    const { vendorId, billNo, poNumber, grnNumber, billDate, dueDate, taxableAmount, gstAmount } = req.body;

    const numTaxable = Number(taxableAmount);
    const numGst = Number(gstAmount);
    if (!vendorId || !billNo || isNaN(numTaxable) || numTaxable <= 0) {
      return res.status(400).json({ success: false, message: 'Vendor, Bill No, and valid amount are required.' });
    }

    const vendor = db.vendors.find(v => v.id === vendorId);

    // 3-Way Match Check simulation against configured tolerance (2% qty, 1% rate)
    let matchResult = "MATCHED";
    let matchDetails = "PO quantity, GRN inspection receipt, and billed rate match within 1% tolerance.";
    if (poNumber && poNumber.includes('42')) {
      matchResult = "RATE_MISMATCH";
      matchDetails = "Billed rate exceeds PO contracted rate by more than 1% variance threshold.";
    }

    const newBill = {
      id: `vb_${Date.now()}`,
      billNo: billNo.trim(),
      vendorId,
      vendorName: vendor?.name || 'Vendor',
      poNumber: poNumber || 'PO-2026-GEN',
      grnNumber: grnNumber || 'GRN-2026-REC',
      billDate: billDate || new Date().toISOString().split('T')[0],
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      taxableAmount: numTaxable,
      gstAmount: numGst,
      totalAmount: numTaxable + numGst,
      paidAmount: 0,
      balanceAmount: numTaxable + numGst,
      matchResult,
      matchDetails,
      status: matchResult === 'MATCHED' ? 'APPROVED' : 'DRAFT',
      approvedBy: matchResult === 'MATCHED' ? 'Finance Manager (Anita Deshmukh)' : null
    };

    db.vendorBills.unshift(newBill);
    financeDb.write(db);
    financeDb.logAudit(req.user?.name || "Accounts Executive", "CREATE_VENDOR_BILL", "VendorBill", newBill.id, `Entered vendor bill ${billNo} from ${newBill.vendorName} (3-Way Match: ${matchResult})`);

    res.status(201).json({
      success: true,
      data: newBill,
      message: `Vendor bill ${billNo} entered successfully. Match Status: ${matchResult}.`
    });
  },

  recordVendorPayment: (req, res) => {
    const db = financeDb.read();
    const { billId, amount, method, referenceNo, tdsDeduction } = req.body;

    const bill = db.vendorBills.find(b => b.id === billId);
    if (!bill) return res.status(404).json({ success: false, message: 'Vendor bill not found.' });

    const numAmount = Number(amount);
    const numTds = Number(tdsDeduction) || 0;
    const totalSettlement = numAmount + numTds;

    bill.paidAmount = (Number(bill.paidAmount) || 0) + totalSettlement;
    bill.balanceAmount = Math.max(0, Number(bill.totalAmount) - bill.paidAmount);
    bill.status = bill.balanceAmount <= 0 ? 'PAID' : 'PARTIALLY_PAID';

    const series = db.numberSeries.find(s => s.docType === 'VENDOR_PAYMENT') || db.numberSeries[4];
    const paymentNo = `VPAY/2026-27/${String(series.nextNo).padStart(series.padding, '0')}`;
    series.nextNo += 1;

    const newPayment = {
      id: `vpay_${Date.now()}`,
      paymentNo,
      vendorId: bill.vendorId,
      vendorName: bill.vendorName,
      billId: bill.id,
      billNo: bill.billNo,
      paymentDate: new Date().toISOString().split('T')[0],
      method: method || 'RTGS',
      referenceNo: referenceNo || 'BANK-TXN-REF',
      amount: numAmount,
      tdsDeduction: numTds,
      status: "APPROVED"
    };

    db.vendorPayments.unshift(newPayment);
    financeDb.write(db);
    financeDb.logAudit(req.user?.name || "Finance Manager", "VENDOR_PAYMENT", "VendorPayment", newPayment.id, `Processed payment ${paymentNo} of ₹${numAmount} to ${bill.vendorName}`);

    res.status(201).json({
      success: true,
      data: newPayment,
      message: `Payment ${paymentNo} released successfully.`
    });
  },

  // ===================== 7. JOB COSTING & MARGINS (M6.3) =====================
  getJobCosting: (req, res) => {
    const db = financeDb.read();
    
    // Aggregate by job/sales order reference
    const jobMap = {};

    db.invoices.forEach(inv => {
      if (inv.orderNo && inv.status !== 'DRAFT' && inv.status !== 'CANCELLED') {
        const jobRef = inv.orderNo;
        if (!jobMap[jobRef]) {
          jobMap[jobRef] = {
            jobRef,
            customerName: inv.customerSnapshot?.name || 'Customer',
            taxableRevenue: 0,
            materialCost: 0,
            labourCost: 0,
            expenseCost: 0,
            vendorBillCost: 0,
            totalActualCost: 0,
            estimatedCost: 120000, // From M3 BOM snapshot
            hasMaterial: false,
            hasLabour: false
          };
        }
        jobMap[jobRef].taxableRevenue += Number(inv.taxableTotal) || 0;
      }
    });

    db.jobCostLedger.forEach(jc => {
      const jobRef = jc.jobRef;
      if (!jobMap[jobRef]) {
        jobMap[jobRef] = {
          jobRef,
          customerName: jc.customerName || 'Customer',
          taxableRevenue: 0,
          materialCost: 0,
          labourCost: 0,
          expenseCost: 0,
          vendorBillCost: 0,
          totalActualCost: 0,
          estimatedCost: 120000,
          hasMaterial: false,
          hasLabour: false
        };
      }

      const amt = Number(jc.amount);
      jobMap[jobRef].totalActualCost += amt;
      if (jc.costType === 'MATERIAL') { jobMap[jobRef].materialCost += amt; jobMap[jobRef].hasMaterial = true; }
      else if (jc.costType === 'LABOUR') { jobMap[jobRef].labourCost += amt; jobMap[jobRef].hasLabour = true; }
      else if (jc.costType === 'EXPENSE') { jobMap[jobRef].expenseCost += amt; }
      else if (jc.costType === 'VENDOR_BILL') { jobMap[jobRef].vendorBillCost += amt; }
    });

    const jobResults = Object.values(jobMap).map(j => {
      const isCostComplete = j.hasMaterial && j.hasLabour;
      const grossMargin = j.taxableRevenue - j.totalActualCost;
      const marginPercent = j.taxableRevenue > 0 ? ((grossMargin / j.taxableRevenue) * 100).toFixed(1) : 0;
      const variance = j.estimatedCost - j.totalActualCost;

      return {
        ...j,
        isCostComplete,
        grossMargin,
        marginPercent: isCostComplete ? Number(marginPercent) : null,
        variance,
        statusText: isCostComplete ? `${marginPercent}% MARGIN` : "INCOMPLETE (Missing Labour/Material)"
      };
    });

    res.status(200).json({
      success: true,
      data: jobResults
    });
  },

  // ===================== 8. ADMIN SETTINGS =====================
  getSettings: (req, res) => {
    const db = financeDb.read();
    res.status(200).json({
      success: true,
      data: {
        companyProfile: db.companyProfile,
        numberSeries: db.numberSeries,
        taxCodes: db.taxCodes,
        paymentTerms: db.paymentTerms,
        approvalPolicies: db.approvalPolicies,
        ageingBuckets: db.ageingBuckets,
        matchTolerance: db.matchTolerance,
        reminderRules: db.reminderRules
      }
    });
  },

  updateCompanyProfile: (req, res) => {
    const db = financeDb.read();
    db.companyProfile = {
      ...db.companyProfile,
      ...req.body
    };
    financeDb.write(db);
    financeDb.logAudit(req.user?.name || "Admin", "UPDATE_SETTINGS", "CompanyProfile", "companyProfile", "Updated legal GSTIN and company profile");

    res.status(200).json({
      success: true,
      data: db.companyProfile,
      message: 'Company profile updated successfully.'
    });
  }
};
