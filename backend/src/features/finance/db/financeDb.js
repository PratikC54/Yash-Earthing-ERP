import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../../../data/finance_db.json');

const INITIAL_FINANCE_DATA = {
  companyProfile: {
    legalName: "Yash Earthing & Lightning Protection Pvt. Ltd.",
    tradeName: "Yash Group — Earthing & Lightning Protection",
    gstin: "27AABCY1234F1Z5",
    pan: "AABCY1234F",
    cin: "U29299MH2018PTC304891",
    stateCode: "27",
    stateName: "Maharashtra",
    address: "Plot No. 42, MIDC Industrial Area, Chakan Phase II, Pune, Maharashtra - 410501",
    contactEmail: "accounts@yashearthing.com",
    contactPhone: "+91 20 6792 1100",
    bankDetails: {
      bankName: "HDFC Bank Ltd",
      accountNumber: "50200084920194",
      ifsc: "HDFC0001234",
      branch: "Chakan Industrial Branch, Pune",
      upiId: "yashearthing@hdfcbank"
    },
    footerTerms: "1. All payments strictly per invoice terms. Interest @ 18% p.a. charged after due date.\n2. In case of cheque bounce, ₹1,000 handling charges plus bank penalty will apply.\n3. Goods once sold cannot be taken back without QC authorization.\n4. Disputes subject to Pune jurisdiction only."
  },

  numberSeries: [
    {
      id: "ser_tax_inv",
      docType: "TAX_INVOICE",
      prefix: "INV",
      format: "INV/2026-27/{SEQ:4}",
      fyStart: "2026-04-01",
      nextNo: 104,
      padding: 4,
      isActive: true
    },
    {
      id: "ser_proforma",
      docType: "PROFORMA",
      prefix: "PI",
      format: "PI/2026-27/{SEQ:4}",
      fyStart: "2026-04-01",
      nextNo: 51,
      padding: 4,
      isActive: true
    },
    {
      id: "ser_receipt",
      docType: "RECEIPT",
      prefix: "REC",
      format: "REC/2026-27/{SEQ:4}",
      fyStart: "2026-04-01",
      nextNo: 205,
      padding: 4,
      isActive: true
    },
    {
      id: "ser_credit_note",
      docType: "CREDIT_NOTE",
      prefix: "CN",
      format: "CN/2026-27/{SEQ:4}",
      fyStart: "2026-04-01",
      nextNo: 14,
      padding: 4,
      isActive: true
    },
    {
      id: "ser_vendor_pay",
      docType: "VENDOR_PAYMENT",
      prefix: "VPAY",
      format: "VPAY/2026-27/{SEQ:4}",
      fyStart: "2026-04-01",
      nextNo: 301,
      padding: 4,
      isActive: true
    }
  ],

  taxCodes: [
    { id: "tax_18", code: "GST-18", name: "Standard 18% (Electrodes, Rods, Arresters)", cgst: 9, sgst: 9, igst: 18, isDefault: true },
    { id: "tax_12", code: "GST-12", name: "Concessional 12% (Agricultural Earthing)", cgst: 6, sgst: 6, igst: 12, isDefault: false },
    { id: "tax_28", code: "GST-28", name: "Special 28% (Surge Suppressor Assemblies)", cgst: 14, sgst: 14, igst: 28, isDefault: false },
    { id: "tax_5", code: "GST-5", name: "Basic 5% (Natural Bentonite Clay)", cgst: 2.5, sgst: 2.5, igst: 5, isDefault: false },
    { id: "tax_0", code: "GST-0", name: "Exempted / Zero Rated Export", cgst: 0, sgst: 0, igst: 0, isDefault: false }
  ],

  paymentTerms: [
    { id: "term_net30", name: "Net 30 Days", days: 30, type: "NET_DAYS", isDefault: true },
    { id: "term_net15", name: "Net 15 Days", days: 15, type: "NET_DAYS", isDefault: false },
    { id: "term_advance", name: "100% Advance Payment", days: 0, type: "ADVANCE", isDefault: false },
    { id: "term_milestone", name: "Milestone: 40% Adv / 50% Dispatch / 10% Testing", days: 45, type: "MILESTONE", isDefault: false }
  ],

  approvalPolicies: [
    { id: "pol_inv_high", docType: "TAX_INVOICE", minAmount: 150000, approverRole: "Finance Manager", requireSeparateApprover: true },
    { id: "pol_credit_note", docType: "CREDIT_NOTE", minAmount: 0, approverRole: "Finance Manager", requireSeparateApprover: true },
    { id: "pol_vendor_bill", docType: "VENDOR_BILL", minAmount: 100000, approverRole: "Finance Manager", requireSeparateApprover: false },
    { id: "pol_vpay_high", docType: "VENDOR_PAYMENT", minAmount: 50000, approverRole: "Finance Manager", requireSeparateApprover: true }
  ],

  ageingBuckets: [
    { id: "b1", label: "Current (Not Due)", minDays: -999, maxDays: 0, order: 1, color: "emerald" },
    { id: "b2", label: "1–30 Days Overdue", minDays: 1, maxDays: 30, order: 2, color: "amber" },
    { id: "b3", label: "31–60 Days Overdue", minDays: 31, maxDays: 60, order: 3, color: "orange" },
    { id: "b4", label: "61–90 Days Overdue", minDays: 61, maxDays: 90, order: 4, color: "rose" },
    { id: "b5", label: "90+ Days (Critical)", minDays: 91, maxDays: 9999, order: 5, color: "red" }
  ],

  matchTolerance: {
    qtyPercent: 2.0,
    ratePercent: 1.0
  },

  reminderRules: [
    { id: "rem_1", daysAfterDue: 3, action: "Send automated WhatsApp / Email payment alert", assigneeRole: "Accounts Executive" },
    { id: "rem_2", daysAfterDue: 15, action: "Formal Accounts Notice & Sales Owner Escalation", assigneeRole: "Finance Manager" },
    { id: "rem_3", daysAfterDue: 30, action: "Credit Stop on new orders & Legal Notice warning", assigneeRole: "Admin" }
  ],

  // Upstream Pipeline Data: Customers (M1 Handshake)
  customers: [
    {
      id: "cust_tata_power",
      name: "Tata Power Renewable Energy Ltd",
      shortCode: "TPREL",
      gstin: "27AAACT2727Q1ZT",
      pan: "AAACT2727Q",
      stateCode: "27",
      stateName: "Maharashtra",
      address: "Carnac Bunder, 34 Sant Tukaram Road, Mumbai, Maharashtra - 400009",
      contactPerson: "Rajesh Kulkarni (Procurement)",
      phone: "+91 98200 44192",
      email: "r.kulkarni@tatapower.com",
      owner: "Vikram Malhotra (M1 Sales)",
      creditLimit: 1000000,
      paymentTermsId: "term_net30"
    },
    {
      id: "cust_adani_solar",
      name: "Adani Solar Energy Kutchh One Ltd",
      shortCode: "ADANI",
      gstin: "24AAACA1234P1Z3",
      pan: "AAACA1234P",
      stateCode: "24",
      stateName: "Gujarat",
      address: "Adani Corporate House, Shantigram, SG Highway, Ahmedabad, Gujarat - 382421",
      contactPerson: "Dhaval Patel (Site Commercial)",
      phone: "+91 97230 11984",
      email: "dhaval.patel@adani.com",
      owner: "Vikram Malhotra (M1 Sales)",
      creditLimit: 1500000,
      paymentTermsId: "term_net30"
    },
    {
      id: "cust_lt_infra",
      name: "L&T Construction & Infrastructure IC",
      shortCode: "LTINFRA",
      gstin: "27AABCL1928K1ZG",
      pan: "AABCL1928K",
      stateCode: "27",
      stateName: "Maharashtra",
      address: "L&T House, Ballard Estate, Mumbai, Maharashtra - 400001",
      contactPerson: "Sanjay Mehta (Project Head)",
      phone: "+91 98210 99231",
      email: "sanjay.mehta@lntecc.com",
      owner: "Priya Sharma (M1 Sales)",
      creditLimit: 2500000,
      paymentTermsId: "term_milestone"
    },
    {
      id: "cust_sterling_wilson",
      name: "Sterling & Wilson Renewable Energy Ltd",
      shortCode: "STERLING",
      gstin: "29AABCS9876M1ZX",
      pan: "AABCS9876M",
      stateCode: "29",
      stateName: "Karnataka",
      address: "Embassy GolfLinks Business Park, Bengaluru, Karnataka - 560071",
      contactPerson: "Karthik Nair (Solar EPC)",
      phone: "+91 99000 88219",
      email: "karthik.nair@sterlingwilson.com",
      owner: "Priya Sharma (M1 Sales)",
      creditLimit: 1200000,
      paymentTermsId: "term_net15"
    }
  ],

  // Upstream Pipeline Data: Sales Orders & Dispatches (M1/M2/M4 Handshake)
  salesOrders: [
    {
      id: "so_tata_081",
      orderNo: "SO-2026-081",
      customerId: "cust_tata_power",
      orderDate: "2026-10-01",
      billingPlan: "DISPATCH",
      currency: "INR",
      poNumber: "PO-TP-2026-8819",
      hasOpenQcHold: false,
      items: [
        {
          id: "so_item_1",
          productId: "prod_cbe_50_3m",
          sku: "SKU-CBE-50-3M",
          description: "Yash 50mm x 3.0m Chemical Earthing Electrode Pipe-in-Pipe",
          hsn: "85359090",
          uom: "NOS",
          orderedQty: 50,
          dispatchedQty: 50,
          invoicedQty: 50,
          rate: 3450,
          gstPercent: 18
        },
        {
          id: "so_item_2",
          productId: "prod_ese_60m",
          sku: "SKU-ESE-60M",
          description: "Yash ESE Early Streamer Emission Lightning Arrester (Radius 60m)",
          hsn: "85354030",
          uom: "NOS",
          orderedQty: 5,
          dispatchedQty: 5,
          invoicedQty: 0, // 5 units billable now!
          rate: 28500,
          gstPercent: 18
        }
      ]
    },
    {
      id: "so_adani_092",
      orderNo: "SO-2026-092",
      customerId: "cust_adani_solar",
      orderDate: "2026-10-08",
      billingPlan: "DISPATCH",
      currency: "INR",
      poNumber: "ADANI-KUTCH-771",
      hasOpenQcHold: false,
      items: [
        {
          id: "so_item_3",
          productId: "prod_cbr_17_3m",
          sku: "SKU-CBR-17-3M",
          description: "Yash Solid Copper Bonded Rod 17.2mm x 3.0m (UL Listed 254um)",
          hsn: "85359090",
          uom: "NOS",
          orderedQty: 100,
          dispatchedQty: 100,
          invoicedQty: 0, // 100 units billable now!
          rate: 1850,
          gstPercent: 18
        },
        {
          id: "so_item_4",
          productId: "prod_1792692358557_bi91",
          sku: "SKU-YASH-ESE-108M",
          description: "Yash Advanced ESE Lightning Terminal 108m (NFC 17-102)",
          hsn: "85354030",
          uom: "METER",
          orderedQty: 2,
          dispatchedQty: 2,
          invoicedQty: 0, // 2 units billable now!
          rate: 22500,
          gstPercent: 18
        }
      ]
    },
    {
      id: "so_lt_105",
      orderNo: "SO-2026-105",
      customerId: "cust_lt_infra",
      orderDate: "2026-10-15",
      billingPlan: "DISPATCH",
      currency: "INR",
      poNumber: "LT-INFRA-90021",
      hasOpenQcHold: true, // OPEN QC HOLD FROM M4 - Invoicing MUST be blocked!
      items: [
        {
          id: "so_item_5",
          productId: "prod_cbe_50_3m",
          sku: "SKU-CBE-50-3M",
          description: "Yash 50mm x 3.0m Chemical Earthing Electrode",
          hsn: "85359090",
          uom: "NOS",
          orderedQty: 200,
          dispatchedQty: 150,
          invoicedQty: 0,
          rate: 3450,
          gstPercent: 18
        }
      ]
    }
  ],

  // Issued Invoices
  invoices: [
    {
      id: "inv_101",
      invoiceNo: "INV/2026-27/0101",
      docType: "TAX_INVOICE",
      seriesId: "ser_tax_inv",
      fy: "2026-27",
      customerId: "cust_tata_power",
      salesOrderId: "so_tata_081",
      orderNo: "SO-2026-081",
      poNumber: "PO-TP-2026-8819",
      invoiceDate: "2026-10-05",
      dueDate: "2026-10-20", // Overdue!
      paymentTermsId: "term_net15",
      placeOfSupply: "27",
      taxType: "INTRA_STATE", // CGST + SGST
      customerSnapshot: {
        name: "Tata Power Renewable Energy Ltd",
        gstin: "27AAACT2727Q1ZT",
        address: "Carnac Bunder, 34 Sant Tukaram Road, Mumbai - 400009",
        stateName: "Maharashtra"
      },
      items: [
        {
          id: "inv_item_1",
          productId: "prod_cbe_50_3m",
          sku: "SKU-CBE-50-3M",
          description: "Yash 50mm x 3.0m Chemical Earthing Electrode Pipe-in-Pipe",
          hsn: "85359090",
          qty: 50,
          uom: "NOS",
          rate: 3450,
          taxableValue: 172500,
          taxRate: 18,
          cgstAmount: 15525,
          sgstAmount: 15525,
          igstAmount: 0,
          lineTotal: 203550
        }
      ],
      taxableTotal: 172500,
      cgstTotal: 15525,
      sgstTotal: 15525,
      igstTotal: 0,
      roundOff: 0,
      grandTotal: 203550,
      paidAmount: 150000,
      balanceAmount: 53550,
      status: "ISSUED", // Derived: PART_PAID & OVERDUE
      isDisputed: false,
      disputeReason: null,
      createdBy: "Accounts Executive (Pooja Rao)",
      approvedBy: "Finance Manager (Anita Deshmukh)",
      approvedAt: "2026-10-05T10:00:00Z",
      issuedBy: "Finance Manager (Anita Deshmukh)",
      issuedAt: "2026-10-05T10:30:00Z"
    },
    {
      id: "inv_102",
      invoiceNo: "INV/2026-27/0102",
      docType: "TAX_INVOICE",
      seriesId: "ser_tax_inv",
      fy: "2026-27",
      customerId: "cust_adani_solar",
      salesOrderId: "so_adani_092",
      orderNo: "SO-2026-092",
      poNumber: "ADANI-KUTCH-771",
      invoiceDate: "2026-10-18",
      dueDate: "2026-11-17", // Current (Not Due)
      paymentTermsId: "term_net30",
      placeOfSupply: "24", // Gujarat -> Inter-State IGST!
      taxType: "INTER_STATE",
      customerSnapshot: {
        name: "Adani Solar Energy Kutchh One Ltd",
        gstin: "24AAACA1234P1Z3",
        address: "Adani Corporate House, Shantigram, SG Highway, Ahmedabad, Gujarat - 382421",
        stateName: "Gujarat"
      },
      items: [
        {
          id: "inv_item_2",
          productId: "prod_cbr_17_3m",
          sku: "SKU-CBR-17-3M",
          description: "Yash Solid Copper Bonded Rod 17.2mm x 3.0m",
          hsn: "85359090",
          qty: 60,
          uom: "NOS",
          rate: 1850,
          taxableValue: 111000,
          taxRate: 18,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 19980,
          lineTotal: 130980
        }
      ],
      taxableTotal: 111000,
      cgstTotal: 0,
      sgstTotal: 0,
      igstTotal: 19980,
      roundOff: 0,
      grandTotal: 130980,
      paidAmount: 0,
      balanceAmount: 130980,
      status: "ISSUED", // Derived: UNPAID & CURRENT
      isDisputed: false,
      disputeReason: null,
      createdBy: "Accounts Executive (Pooja Rao)",
      approvedBy: "Finance Manager (Anita Deshmukh)",
      approvedAt: "2026-10-18T14:00:00Z",
      issuedBy: "Finance Manager (Anita Deshmukh)",
      issuedAt: "2026-10-18T14:15:00Z"
    },
    {
      id: "inv_103",
      invoiceNo: "INV/2026-27/0103",
      docType: "TAX_INVOICE",
      seriesId: "ser_tax_inv",
      fy: "2026-27",
      customerId: "cust_sterling_wilson",
      salesOrderId: "so_sterling_074",
      orderNo: "SO-2026-074",
      poNumber: "SW-RENEW-4421",
      invoiceDate: "2026-10-02",
      dueDate: "2026-10-17",
      paymentTermsId: "term_net15",
      placeOfSupply: "29", // Karnataka -> IGST
      taxType: "INTER_STATE",
      customerSnapshot: {
        name: "Sterling & Wilson Renewable Energy Ltd",
        gstin: "29AABCS9876M1ZX",
        address: "Embassy GolfLinks Business Park, Bengaluru - 560071",
        stateName: "Karnataka"
      },
      items: [
        {
          id: "inv_item_3",
          productId: "prod_ese_60m",
          sku: "SKU-ESE-60M",
          description: "Yash ESE Lightning Arrester (Radius 60m)",
          hsn: "85354030",
          qty: 4,
          uom: "NOS",
          rate: 25000,
          taxableValue: 100000,
          taxRate: 18,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 18000,
          lineTotal: 118000
        }
      ],
      taxableTotal: 100000,
      cgstTotal: 0,
      sgstTotal: 0,
      igstTotal: 18000,
      roundOff: 0,
      grandTotal: 118000,
      paidAmount: 118000,
      balanceAmount: 0,
      status: "ISSUED", // Derived: PAID IN FULL
      isDisputed: false,
      disputeReason: null,
      createdBy: "Accounts Executive (Pooja Rao)",
      approvedBy: "Finance Manager (Anita Deshmukh)",
      approvedAt: "2026-10-02T11:00:00Z",
      issuedBy: "Finance Manager (Anita Deshmukh)",
      issuedAt: "2026-10-02T11:30:00Z"
    }
  ],

  // Recorded Receipts
  receipts: [
    {
      id: "rec_201",
      receiptNo: "REC/2026-27/0201",
      customerId: "cust_tata_power",
      receivedOn: "2026-10-12",
      method: "NEFT",
      referenceNo: "HDFCN2628591024",
      bank: "HDFC Bank Ltd",
      amount: 150000,
      status: "VERIFIED",
      chequeStatus: null,
      idempotencyKey: "idem_rec_201",
      unallocatedAmount: 0,
      notes: "Part payment received for INV/2026-27/0101",
      createdBy: "Accounts Executive (Pooja Rao)",
      allocations: [
        {
          id: "alloc_1",
          invoiceId: "inv_101",
          invoiceNo: "INV/2026-27/0101",
          amount: 150000,
          allocatedBy: "Accounts Executive (Pooja Rao)",
          allocatedAt: "2026-10-12T15:20:00Z"
        }
      ],
      deductions: []
    },
    {
      id: "rec_202",
      receiptNo: "REC/2026-27/0202",
      customerId: "cust_sterling_wilson",
      receivedOn: "2026-10-14",
      method: "RTGS",
      referenceNo: "ICICR52026101400",
      bank: "HDFC Bank Ltd",
      amount: 115000,
      status: "VERIFIED",
      chequeStatus: null,
      idempotencyKey: "idem_rec_202",
      unallocatedAmount: 0,
      notes: "Full settlement with TDS deduction Sec 194C",
      createdBy: "Accounts Executive (Pooja Rao)",
      allocations: [
        {
          id: "alloc_2",
          invoiceId: "inv_103",
          invoiceNo: "INV/2026-27/0103",
          amount: 115000,
          allocatedBy: "Accounts Executive (Pooja Rao)",
          allocatedAt: "2026-10-14T11:45:00Z"
        }
      ],
      deductions: [
        {
          id: "ded_1",
          invoiceId: "inv_103",
          type: "TDS_194C",
          description: "TDS @ 2% deducted under Section 194C",
          amount: 3000
        }
      ]
    },
    {
      id: "rec_203",
      receiptNo: "REC/2026-27/0203",
      customerId: "cust_adani_solar",
      receivedOn: "2026-10-21",
      method: "NEFT",
      referenceNo: "SBIN920261021489",
      bank: "HDFC Bank Ltd",
      amount: 50000,
      status: "VERIFIED",
      chequeStatus: null,
      idempotencyKey: "idem_rec_203",
      unallocatedAmount: 50000, // Available Customer Credit!
      notes: "Advance deposit for next batch supply",
      createdBy: "Accounts Executive (Pooja Rao)",
      allocations: [],
      deductions: []
    }
  ],

  // Credit Notes
  creditNotes: [
    {
      id: "cn_1",
      cnNo: "CN/2026-27/0011",
      invoiceId: "inv_101",
      invoiceNo: "INV/2026-27/0101",
      customerId: "cust_tata_power",
      issueDate: "2026-10-16",
      reason: "Discount allowed for prompt site unloading clearance",
      taxableAmount: 5000,
      cgstAmount: 450,
      sgstAmount: 450,
      igstAmount: 0,
      totalAmount: 5900,
      status: "APPROVED",
      approvedBy: "Finance Manager (Anita Deshmukh)"
    }
  ],

  // Follow-up Actions
  followups: [
    {
      id: "fol_1",
      customerId: "cust_tata_power",
      customerName: "Tata Power Renewable Energy Ltd",
      invoiceId: "inv_101",
      invoiceNo: "INV/2026-27/0101",
      owner: "Vikram Malhotra (M1 Sales)",
      mode: "PHONE_CALL",
      nextActionDate: "2026-10-25",
      promiseAmount: 53550,
      promiseDate: "2026-10-28",
      outcome: "Mr. Kulkarni confirmed balance payment passed in Friday treasury run.",
      status: "OPEN"
    }
  ],

  // Vendors (M2 Procurement Handshake)
  vendors: [
    {
      id: "ven_hindalco",
      name: "Hindalco Industries Ltd (Copper Division)",
      gstin: "27AAACH0123M1Z2",
      stateCode: "27",
      paymentTerms: "Net 30 Days",
      contact: "Alok Gupta (Sales Head)"
    },
    {
      id: "ven_jindal",
      name: "Jindal Stainless Steel Hisar Ltd",
      gstin: "06AAACJ1928L1Z1",
      stateCode: "06",
      paymentTerms: "Net 15 Days",
      contact: "Manoj Verma"
    }
  ],

  // Vendor Bills (Payables M6.2)
  vendorBills: [
    {
      id: "vb_1",
      billNo: "HINDALCO/INV/8812",
      vendorId: "ven_hindalco",
      vendorName: "Hindalco Industries Ltd",
      poNumber: "PO-2026-031",
      grnNumber: "GRN-2026-089",
      billDate: "2026-10-10",
      dueDate: "2026-11-09",
      taxableAmount: 125000,
      gstAmount: 22500,
      totalAmount: 147500,
      paidAmount: 0,
      balanceAmount: 147500,
      matchResult: "MATCHED", // 3-Way Match Passed!
      matchDetails: "PO qty 250kg matches GRN 250kg @ ₹500/kg. Within 1% rate variance.",
      status: "APPROVED",
      approvedBy: "Finance Manager (Anita Deshmukh)"
    },
    {
      id: "vb_2",
      billNo: "JINDAL/SS/9104",
      vendorId: "ven_jindal",
      vendorName: "Jindal Stainless Steel Hisar Ltd",
      poNumber: "PO-2026-042",
      grnNumber: "GRN-2026-095",
      billDate: "2026-10-14",
      dueDate: "2026-10-29",
      taxableAmount: 70000,
      gstAmount: 12600,
      totalAmount: 82600,
      paidAmount: 0,
      balanceAmount: 82600,
      matchResult: "RATE_MISMATCH", // 3-Way Match Mismatch!
      matchDetails: "PO contracted rate ₹320/m, Vendor billed ₹350/m (+9.3% variance exceeds 1% tolerance).",
      status: "DRAFT",
      approvedBy: null
    }
  ],

  // Vendor Payments
  vendorPayments: [
    {
      id: "vpay_1",
      paymentNo: "VPAY/2026-27/0300",
      vendorId: "ven_hindalco",
      vendorName: "Hindalco Industries Ltd",
      billId: "vb_1",
      billNo: "HINDALCO/INV/8812",
      paymentDate: "2026-10-20",
      method: "RTGS",
      referenceNo: "HDFCR52026102011",
      amount: 100000,
      tdsDeduction: 1250, // Section 194Q TDS @ 0.1% on goods purchase
      status: "APPROVED"
    }
  ],

  // Job Costing & Margins (M6.3 Handshake with M3)
  jobCostLedger: [
    {
      id: "jc_1",
      jobRef: "SO-2026-081",
      orderNo: "SO-2026-081",
      customerName: "Tata Power Renewable Energy Ltd",
      costType: "MATERIAL",
      sourceModule: "M2_STORES",
      sourceId: "ISSUE-2026-041",
      description: "Mild steel pipes 50mm & copper cladding coils",
      amount: 88500,
      costDate: "2026-10-03"
    },
    {
      id: "jc_2",
      jobRef: "SO-2026-081",
      orderNo: "SO-2026-081",
      customerName: "Tata Power Renewable Energy Ltd",
      costType: "LABOUR",
      sourceModule: "M4_PRODUCTION",
      sourceId: "WO-2026-019-LAB",
      description: "Welding, crystalline paste filling & inspection hours",
      amount: 18200,
      costDate: "2026-10-04"
    },
    {
      id: "jc_3",
      jobRef: "SO-2026-081",
      orderNo: "SO-2026-081",
      customerName: "Tata Power Renewable Energy Ltd",
      costType: "EXPENSE",
      sourceModule: "M5_PROJECTS",
      sourceId: "EXP-LOGISTICS-081",
      description: "Dedicated transport & insurance to solar site",
      amount: 8500,
      costDate: "2026-10-05"
    }
  ],

  // Audit Logs (M7 Foundation Handshake)
  auditLogs: [
    {
      id: "aud_fin_1",
      actor: "Finance Manager (Anita Deshmukh)",
      action: "ISSUE_INVOICE",
      entity: "Invoice",
      entityId: "inv_101",
      details: "Issued GST Tax Invoice INV/2026-27/0101 to Tata Power for ₹2,03,550",
      timestamp: "2026-10-05T10:30:00Z"
    },
    {
      id: "aud_fin_2",
      actor: "Accounts Executive (Pooja Rao)",
      action: "RECORD_RECEIPT",
      entity: "Receipt",
      entityId: "rec_201",
      details: "Recorded NEFT receipt ₹1,50,000 and allocated to INV/2026-27/0101",
      timestamp: "2026-10-12T15:20:00Z"
    }
  ]
};

class FinanceDbService {
  read() {
    try {
      if (!fs.existsSync(DB_PATH)) {
        this.write(INITIAL_FINANCE_DATA);
        return INITIAL_FINANCE_DATA;
      }
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Error reading finance database:', err);
      return INITIAL_FINANCE_DATA;
    }
  }

  write(data) {
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('Error writing finance database:', err);
      return false;
    }
  }

  logAudit(actor, action, entity, entityId, details) {
    const db = this.read();
    const entry = {
      id: `aud_fin_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      actor: actor || "Finance User",
      action,
      entity,
      entityId,
      details,
      timestamp: new Date().toISOString()
    };
    db.auditLogs.unshift(entry);
    this.write(db);
    return entry;
  }
}

export const financeDb = new FinanceDbService();
