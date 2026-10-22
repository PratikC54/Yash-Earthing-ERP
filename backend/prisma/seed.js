import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning existing database entries...');

  // Reset database state using TRUNCATE CASCADE
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE 
      "User", "Customer", "Lead", "Category", "Product", "LeadItem", "Quotation", 
      "QuotationItem", "SalesOrder", "SalesOrderItem", "Vendor", "VendorItem", 
      "PurchaseRequest", "PurchaseRequestItem", "RFQ", "RFQResponse", "RFQResponseItem", 
      "PurchaseOrder", "PurchaseOrderItem", "GoodsReceipt", "GoodsReceiptItem", 
      "Inventory", "InventoryMovement", "ProductSpecification", "BOMRevision", 
      "BOMItem", "BOMOperation", "WorkOrder", "WorkOrderItem", "QualityInspection", 
      "Project", "Installation", "ServiceTicket", "MediaAsset", "Communication", 
      "Invoice", "InvoiceItem", "Payment", "VendorBill", "Employee", "Attendance", 
      "Task", "AuditLog", "Session", "DocumentProof", "MaterialRate", "SalesTarget", 
      "CallLog", "RolePermission", "AttendanceSetting", "UserAttendanceLog", 
      "AssignedSpecification", "SpecificationRequest", "InventoryItem" 
    RESTART IDENTITY CASCADE;
  `);

  console.log('Seeding all table columns with complete ERP data...');

  const passwordHash = await bcrypt.hash('YashERP@2026', 10);
  const now = new Date();

  // ===================== 1. USERS & EMPLOYEES (SYNCED WITH ADMIN) =====================
  const staffData = [
    {
      employeeCode: 'ADM-001',
      name: 'System Administrator',
      email: 'admin@yashgroup.com',
      phone: '+91 9800000000',
      department: 'Management',
      designation: 'Chief Technology Officer',
      role: 'ADMIN',
      shift: 'GENERAL',
      dateOfBirth: new Date('1988-03-15'),
      avatarUrl: 'https://cdn.yashgroup.com/avatars/admin.jpg',
      emergencyContact: '+91 9800000001',
      address: 'Suite 101, Yash Corporate Tower, Senapati Bapat Road, Pune - 411016',
      joiningDate: new Date('2020-01-01'),
      salary: 150000.00,
      employmentType: 'Full-Time',
      canEditPhoto: true,
      isLoggedIn: true,
      permissions: ['*']
    },
    {
      employeeCode: 'EMP-001',
      name: 'Pratik Senapati',
      email: 'pratik.senapati@yashgroup.com',
      phone: '+91 9876543210',
      department: 'Sales',
      designation: 'Sales Manager',
      role: 'SALES_MANAGER',
      shift: 'GENERAL',
      dateOfBirth: new Date('1998-05-15'),
      avatarUrl: 'https://cdn.yashgroup.com/avatars/emp001.jpg',
      emergencyContact: '+91 9876500001',
      address: 'Flat 402, Royal Palms, Baner, Pune - 411045',
      joiningDate: new Date('2022-01-10'),
      salary: 85000.00,
      employmentType: 'Full-Time',
      canEditPhoto: true,
      isLoggedIn: true,
      permissions: ['READ_ALL', 'WRITE_SALES', 'APPROVE_QUOTATION']
    },
    {
      employeeCode: 'EMP-002',
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@yashgroup.com',
      phone: '+91 9876543211',
      department: 'Production',
      designation: 'Production Manager',
      role: 'PRODUCTION_MANAGER',
      shift: 'SHIFT_A',
      dateOfBirth: new Date('1992-08-22'),
      avatarUrl: 'https://cdn.yashgroup.com/avatars/emp002.jpg',
      emergencyContact: '+91 9876500002',
      address: 'Plot 18, MIDC Bhosari, Pune - 411026',
      joiningDate: new Date('2021-06-15'),
      salary: 92000.00,
      employmentType: 'Full-Time',
      canEditPhoto: false,
      isLoggedIn: false,
      permissions: ['READ_ALL', 'WRITE_WORK_ORDER', 'APPROVE_BOM']
    },
    {
      employeeCode: 'EMP-003',
      name: 'Ananya Sharma',
      email: 'ananya.sharma@yashgroup.com',
      phone: '+91 9876543212',
      department: 'Quality & Metrology',
      designation: 'Quality Inspector',
      role: 'QUALITY_INSPECTOR',
      shift: 'GENERAL',
      dateOfBirth: new Date('1995-12-03'),
      avatarUrl: 'https://cdn.yashgroup.com/avatars/emp003.jpg',
      emergencyContact: '+91 9876500003',
      address: 'Sector 24, Pradhikaran, Nigdi, Pune - 411044',
      joiningDate: new Date('2023-03-01'),
      salary: 65000.00,
      employmentType: 'Full-Time',
      canEditPhoto: true,
      isLoggedIn: true,
      permissions: ['READ_ALL', 'WRITE_QC']
    }
  ];

  const createdUsers = [];
  const createdEmployees = [];

  for (const staff of staffData) {
    const user = await prisma.user.create({
      data: {
        name: staff.name,
        email: staff.email,
        passwordHash,
        phone: staff.phone,
        department: staff.department,
        shift: staff.shift,
        dateOfBirth: staff.dateOfBirth,
        avatarUrl: staff.avatarUrl,
        employeeCode: staff.employeeCode,
        designation: staff.designation,
        emergencyContact: staff.emergencyContact,
        address: staff.address,
        joiningDate: staff.joiningDate,
        canEditPhoto: staff.canEditPhoto,
        isLoggedIn: staff.isLoggedIn,
        role: staff.role,
        permissions: staff.permissions,
        isActive: true
      }
    });

    const employee = await prisma.employee.create({
      data: {
        employeeCode: staff.employeeCode,
        userId: user.id,
        fullName: staff.name,
        department: staff.department,
        designation: staff.designation,
        employmentType: staff.employmentType,
        dateOfJoining: staff.joiningDate,
        salary: staff.salary,
        isActive: true
      }
    });

    createdUsers.push(user);
    createdEmployees.push(employee);
  }

  const [adminUser, salesUser, prodUser, qcUser] = createdUsers;
  const [empAdmin, empSales] = createdEmployees;

  // ===================== 2. ATTENDANCE & SETTINGS =====================
  const attendanceSetting = await prisma.attendanceSetting.create({
    data: {
      workStartTime: '09:30',
      graceBufferMinutes: 10,
      workEndTime: '18:30',
      requireGeofence: true,
      officeLatitude: 18.4682000,
      officeLongitude: 73.8617000,
      officeRadiusMeters: 100,
      officeAddress: 'Shop No. 2, Rajdhani Complex, Balaji Nagar, Pune - 411009',
      autoAssignEnabled: true,
      autoAssignLoggedInOnly: true,
      updatedById: adminUser.id
    }
  });

  const attendance = await prisma.attendance.create({
    data: {
      employeeId: empSales.id,
      workDate: new Date('2026-10-22'),
      checkIn: new Date('2026-10-22T09:28:00Z'),
      checkOut: new Date('2026-10-22T18:32:00Z'),
      status: 'OnTime',
      hoursWorked: 9.00
    }
  });

  const userAttendanceLog = await prisma.userAttendanceLog.create({
    data: {
      userId: salesUser.id,
      date: new Date('2026-10-22'),
      firstLoginAt: new Date('2026-10-22T09:28:00Z'),
      lastActiveAt: new Date('2026-10-22T17:45:00Z'),
      status: 'OnTime',
      lateMinutes: 0,
      latitude: 18.4682100,
      longitude: 73.8617050,
      distanceMeters: 5,
      locationStatus: 'InOffice',
      locationAddress: 'Rajdhani Complex, Pune',
      ipAddress: '192.168.1.45',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      notes: 'Logged in via biometrics'
    }
  });

  // ===================== 3. CUSTOMER & LEADS =====================
  const customer = await prisma.customer.create({
    data: {
      code: 'CUST-1001',
      name: 'Apex Infrastructure Pvt Ltd',
      legalName: 'Apex Infrastructure Private Limited',
      email: 'procurement@apexinfra.com',
      phone: '+91 9822012345',
      gstin: '27AAACA12341ZV',
      billingAddress: { line1: 'Apex Tower, Senapati Bapat Road', city: 'Pune', pincode: '411016' },
      shippingAddress: { line1: 'Gate 3, Chakan Industrial Area Phase 2', city: 'Pune', pincode: '410501' },
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India',
      isActive: true
    }
  });

  const categoryFinished = await prisma.category.create({
    data: {
      name: 'Earthing Accessories',
      type: 'FINISHED_GOOD',
      description: 'Copper bonding and earthing equipment'
    }
  });

  const categoryRaw = await prisma.category.create({
    data: {
      name: 'Raw Metals',
      type: 'RAW_MATERIAL',
      description: 'Pure copper and alloy materials'
    }
  });

  const productFinished = await prisma.product.create({
    data: {
      sku: 'YEC-CBR-172',
      name: 'Copper Bonding Receptacle 172mm',
      variant: 'Standard Heavy Duty',
      hsnCode: '8538',
      standardMake: 'YASH',
      gstPercent: 18.00,
      minReorderLevel: 25.00,
      diameter: '172mm',
      length: '300mm',
      modelName: 'CBR-2026',
      bagType: 'Digital Bags',
      bagPricing: 'FREE',
      bagSize: '5 KG',
      bagQuantity: 1,
      descriptionTemplate: 'High electrical conductivity copper receptacle',
      drawingId: 'DRG-CBR-172-R5',
      drawingUrl: 'https://s3.amazonaws.com/yash-drawings/DRG-CBR-172.pdf',
      imageUrl: 'https://s3.amazonaws.com/yash-images/YEC-CBR-172.jpg',
      description: 'Heavy duty earthing terminal block',
      unitOfMeasure: 'PCS',
      listPrice: 1500.00,
      isManufactured: true,
      isActive: true,
      categoryId: categoryFinished.id
    }
  });

  const productRaw = await prisma.product.create({
    data: {
      sku: 'RM-COPPER-ROD-99',
      name: 'Electrolytic Copper Rod 99.9%',
      variant: '12mm Diameter',
      hsnCode: '7407',
      standardMake: 'YASH',
      gstPercent: 18.00,
      minReorderLevel: 100.00,
      diameter: '12mm',
      length: '1000mm',
      modelName: 'ECR-999',
      unitOfMeasure: 'KG',
      listPrice: 850.00,
      isManufactured: false,
      isActive: true,
      categoryId: categoryRaw.id
    }
  });

  const lead = await prisma.lead.create({
    data: {
      code: 'LD-260928-001',
      source: 'INDIAN_MART',
      sourceReference: 'INMART-QRY-88493',
      externalId: 'EXT-INM-00192',
      customerName: 'Apex Infrastructure Pvt Ltd',
      contactName: 'Suresh Patil',
      email: 'suresh.patil@apexinfra.com',
      phone: '+91 9822012345',
      alternatePhone: '+91 9822012346',
      city: 'Pune',
      state: 'Maharashtra',
      requirement: 'Requirement for 500 units of copper bonding receptacles',
      productId: productFinished.id,
      productSku: productFinished.sku,
      productName: productFinished.name,
      variant: productFinished.variant,
      quantity: 500,
      expectedValue: 750000.00,
      intent: 'Positive',
      sentiment: 'High Priority',
      stage: 'QUALIFIED',
      priority: 'HIGH',
      contactType: 'New Contact',
      assignedToId: salesUser.id,
      assignedById: salesUser.id,
      assignedByName: salesUser.name,
      lastActivityNote: 'Customer confirmed technical drawing compatibility',
      rawQueryData: { source_payload: 'IndiaMART API query payload' },
      customerId: customer.id,
      nextFollowUpAt: new Date('2026-10-25T11:00:00Z')
    }
  });

  const leadItem = await prisma.leadItem.create({
    data: {
      leadId: lead.id,
      productId: productFinished.id,
      productName: productFinished.name,
      productSku: productFinished.sku,
      variant: productFinished.variant,
      quantity: 500
    }
  });

  // ===================== 4. QUOTATION & SALES ORDER =====================
  const quotation = await prisma.quotation.create({
    data: {
      quotationNo: 'QT-260928-041',
      customerId: customer.id,
      leadId: lead.id,
      salesRepresentativeId: salesUser.id,
      status: 'APPROVED',
      currency: 'INR',
      subtotal: 750000.00,
      discountAmount: 25000.00,
      taxableAmount: 725000.00,
      gstPercent: 18.00,
      gstAmount: 130500.00,
      freightAmount: 5000.00,
      total: 860500.00,
      validityDays: 15,
      validUntil: new Date('2026-11-10'),
      revision: 0,
      callerName: 'Pratik Senapati',
      preparedBy: 'Pratik Senapati',
      paymentTerms: '30% advance, 70% against delivery',
      deliveryTerms: 'FOR Destination Chakan',
      customerPONumber: 'PO-APEX-2026-098',
      customerPODate: new Date('2026-10-20'),
      proformaInvoiceNumber: 'PI-260928-01',
      proformaInvoiceUrl: 'https://s3.amazonaws.com/yash-pdf/PI-260928-01.pdf',
      proformaInvoiceSentAt: now,
      proformaInvoiceSentChannel: 'Email',
      revisionNotes: 'Initial revised quote with freight discount',
      emailSentAt: now,
      emailRecipient: customer.email,
      emailMessageId: 'MSG-SES-9921823',
      termsAndConditions: 'Standard 12 month warranty applies.',
      notes: 'Priority order for Chakan site installation',
      sentAt: now,
      approvedAt: now
    }
  });

  const quotationItem = await prisma.quotationItem.create({
    data: {
      quotationId: quotation.id,
      productId: productFinished.id,
      description: 'Copper Bonding Receptacle 172mm',
      quantity: 500,
      unitPrice: 1500.00,
      discountPercent: 3.33,
      taxPercent: 18.00,
      subtotal: 725000.00,
      lineTotal: 855500.00
    }
  });

  const salesOrder = await prisma.salesOrder.create({
    data: {
      orderNumber: 'SO-150926-AD-01',
      quotationId: quotation.id,
      customerId: customer.id,
      createdById: salesUser.id,
      customerPONumber: 'PO-APEX-2026-098',
      proformaInvoiceNumber: 'PI-260928-01',
      productSummary: '500x Copper Bonding Receptacle 172mm',
      quantitySummary: '500 Nos',
      approvalStatus: 'Approved',
      approvedById: salesUser.id,
      stockReserved: true,
      taxInvoiceNumber: 'INV-261022-01',
      invoiceDate: now,
      invoicePdfUrl: 'https://s3.amazonaws.com/yash-pdf/INV-261022-01.pdf',
      invoiceStatus: 'Issued',
      dispatchStatus: 'READY_FOR_DISPATCH',
      dispatchOfficerName: 'Ramesh Patil',
      transporterName: 'VRL Logistics',
      vehicleNumber: 'MH-12-PQ-4567',
      lrNumber: 'LR-998822',
      deliveryChallanNumber: 'DC-2026-0041',
      deliveryLocation: 'Chakan Plant, Pune',
      irn: 'IRN-8829103910293019230129301',
      acknowledgementNumber: 'ACK-992019203',
      bankDetails: { bank: 'HDFC Bank', accountNo: '50200012345678', ifsc: 'HDFC0001234' },
      upiQrString: 'upi://pay?pa=yashgroup@hdfcbank&pn=YashGroup',
      receivedAmount: 250000.00,
      balanceAmount: 610500.00,
      previousBalance: 0.00,
      currentBalance: 610500.00,
      paymentMode: 'Bank Transfer',
      whatsappSentAt: now,
      emailSentAt: now,
      dispatchDate: now,
      status: 'CONFIRMED',
      orderDate: now,
      expectedDeliveryDate: new Date('2026-11-05'),
      confirmedAt: now,
      currency: 'INR',
      subtotal: 750000.00,
      discountAmount: 25000.00,
      gstAmount: 130500.00,
      grandTotal: 860500.00,
      notes: 'Dispatched in 2 lots'
    }
  });

  const salesOrderItem = await prisma.salesOrderItem.create({
    data: {
      salesOrderId: salesOrder.id,
      productId: productFinished.id,
      productSkuSnapshot: productFinished.sku,
      productNameSnapshot: productFinished.name,
      quantity: 500,
      unitPrice: 1500.00,
      discountPercent: 3.33,
      gstPercent: 18.00,
      baseAmount: 750000.00,
      discountAmount: 25000.00,
      taxableAmount: 725000.00,
      gstAmount: 130500.00,
      lineTotal: 855500.00
    }
  });

  // ===================== 5. VENDORS & PROCUREMENT =====================
  const vendor = await prisma.vendor.create({
    data: {
      code: 'VND-2001',
      name: 'Oswal Copper Mines & Smelters Ltd',
      contactName: 'Mahesh Oswal',
      email: 'sales@oswalcopper.com',
      phone: '+91 9988776655',
      alternatePhone: '+91 9988776656',
      gstin: '27AAABO9981K1ZS',
      pan: 'AAABO9981K',
      address: { line1: 'Industrial Zone, Plot 5', city: 'Mundra', state: 'Gujarat' },
      city: 'Mundra',
      state: 'Gujarat',
      category: 'Metals',
      categories: ['Metals', 'Copper Rods'],
      makesSupplied: ['OSWAL', 'HINDALCO'],
      paymentTerms: 'Within 30 days',
      bankDetails: { bank: 'ICICI Bank', accountNo: '001105001234', ifsc: 'ICIC0000011' },
      notes: 'Primary pure copper vendor',
      rating: 4.80,
      onTimeDeliveryPercent: 96.50,
      qualityScore: 98.20,
      isActive: true
    }
  });

  const vendorItem = await prisma.vendorItem.create({
    data: {
      vendorId: vendor.id,
      productId: productRaw.id,
      vendorSku: 'OSW-CU-12MM',
      leadTimeDays: 7,
      lastQuotedPrice: 820.00
    }
  });

  const purchaseRequest = await prisma.purchaseRequest.create({
    data: {
      requestNo: 'REQ-2610-001',
      salesOrderId: salesOrder.id,
      status: 'APPROVED',
      requestedById: prodUser.id,
      requiredBy: new Date('2026-10-30'),
      notes: 'Raw material procurement for SO-150926-AD-01'
    }
  });

  const purchaseRequestItem = await prisma.purchaseRequestItem.create({
    data: {
      purchaseRequestId: purchaseRequest.id,
      productId: productRaw.id,
      quantity: 600,
      notes: 'High grade 12mm rods'
    }
  });

  const rfq = await prisma.rFQ.create({
    data: {
      rfqNo: 'RFQ-2610-009',
      purchaseRequestId: purchaseRequest.id,
      status: 'AWARDED',
      sentAt: now,
      dueAt: new Date('2026-10-25')
    }
  });

  const rfqResponse = await prisma.rFQResponse.create({
    data: {
      rfqId: rfq.id,
      vendorId: vendor.id,
      quotedAt: now,
      validUntil: new Date('2026-11-15'),
      notes: 'Best spot rate provided',
      totalAmount: 492000.00
    }
  });

  const rfqResponseItem = await prisma.rFQResponseItem.create({
    data: {
      responseId: rfqResponse.id,
      productId: productRaw.id,
      quantity: 600,
      unitPrice: 820.00,
      taxPercent: 18.00
    }
  });

  const purchaseOrder = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-VND-2026-081',
      vendorId: vendor.id,
      rfqId: rfq.id,
      status: 'APPROVED',
      orderDate: now,
      expectedDate: new Date('2026-10-28'),
      subtotal: 492000.00,
      taxAmount: 88560.00,
      total: 580560.00,
      notes: 'Deliver directly to Raw Material Store'
    }
  });

  const purchaseOrderItem = await prisma.purchaseOrderItem.create({
    data: {
      purchaseOrderId: purchaseOrder.id,
      productId: productRaw.id,
      quantity: 600,
      receivedQuantity: 600,
      unitPrice: 820.00,
      taxPercent: 18.00
    }
  });

  const goodsReceipt = await prisma.goodsReceipt.create({
    data: {
      grnNumber: 'GRN-2610-001',
      purchaseOrderId: purchaseOrder.id,
      status: 'ACCEPTED',
      receivedAt: now,
      receivedById: prodUser.id,
      notes: 'All items accepted without damage'
    }
  });

  const goodsReceiptItem = await prisma.goodsReceiptItem.create({
    data: {
      goodsReceiptId: goodsReceipt.id,
      productId: productRaw.id,
      orderedQuantity: 600,
      receivedQuantity: 600,
      acceptedQuantity: 600,
      rejectedQuantity: 0,
      batchNumber: 'BATCH-CU-2026-10'
    }
  });

  // ===================== 6. INVENTORY & ENGINEERING =====================
  const inventory = await prisma.inventory.create({
    data: {
      productId: productRaw.id,
      warehouseLocation: 'RM Store - Bay 4',
      unitCost: 820.00,
      physicalQuantity: 600.00,
      reservedQuantity: 400.00,
      reorderLevel: 100.00
    }
  });

  const inventoryMovement = await prisma.inventoryMovement.create({
    data: {
      productId: productRaw.id,
      movementType: 'STOCK_IN',
      referenceType: 'GOODS_RECEIPT',
      referenceId: goodsReceipt.id,
      goodsReceiptId: goodsReceipt.id,
      quantity: 600.00,
      batchNumber: 'BATCH-CU-2026-10',
      locationCode: 'BAY-4',
      notes: 'Inwarded against GRN-2610-001',
      createdById: prodUser.id
    }
  });

  const productSpecification = await prisma.productSpecification.create({
    data: {
      productId: productFinished.id,
      revision: 'R5',
      status: 'RELEASED',
      specification: { material: '99.9% Electrolytic Copper', testStandard: 'IS-3043' },
      drawingNumber: 'DRG-CBR-172-R5',
      releasedAt: now
    }
  });

  const bomRevision = await prisma.bOMRevision.create({
    data: {
      productId: productFinished.id,
      revision: 'Rev 5',
      status: 'RELEASED',
      notes: 'Approved standard production BOM',
      materialCost: 650.00,
      laborCost: 150.00,
      overheadCost: 50.00,
      releasedAt: now
    }
  });

  const bomItem = await prisma.bOMItem.create({
    data: {
      bomRevisionId: bomRevision.id,
      componentProductId: productRaw.id,
      quantity: 1.100,
      scrapPercent: 2.50
    }
  });

  const bomOperation = await prisma.bOMOperation.create({
    data: {
      bomRevisionId: bomRevision.id,
      sequence: 10,
      name: 'CNC Turning & Threading',
      workCenter: 'CNC Machine - Shop 1',
      standardMinutes: 12.50,
      instructions: 'Ensure tolerance within +/- 0.05mm'
    }
  });

  // ===================== 7. PRODUCTION & QUALITY =====================
  const workOrder = await prisma.workOrder.create({
    data: {
      workOrderNo: 'WO-2026-0089',
      salesOrderId: salesOrder.id,
      bomRevisionId: bomRevision.id,
      createdById: prodUser.id,
      status: 'IN_PROGRESS',
      plannedQuantity: 500,
      goodQuantity: 340,
      rejectedQuantity: 5,
      plannedStart: now,
      plannedEnd: new Date('2026-10-28'),
      actualStart: now,
      priority: 'HIGH',
      notes: 'Priority production for Apex order'
    }
  });

  const workOrderItem = await prisma.workOrderItem.create({
    data: {
      workOrderId: workOrder.id,
      productId: productRaw.id,
      plannedQuantity: 550,
      issuedQuantity: 550,
      consumedQuantity: 374
    }
  });

  const qualityInspection = await prisma.qualityInspection.create({
    data: {
      inspectionNo: 'QC-2026-0341',
      workOrderId: workOrder.id,
      status: 'PASS',
      inspectedQuantity: 340,
      acceptedQuantity: 335,
      rejectedQuantity: 5,
      measurements: { thread_pitch: '2.0mm PASS', surface_finish: 'Ra 0.8 PASS' },
      evidenceNotes: 'Visual and dimension checks verified',
      inspectedAt: now
    }
  });

  // ===================== 8. PROJECTS & SERVICES =====================
  const project = await prisma.project.create({
    data: {
      projectCode: 'PRJ-2026-CHAKAN',
      salesOrderId: salesOrder.id,
      customerId: customer.id,
      ownerId: salesUser.id,
      name: 'Chakan Substation Earthing Installation',
      siteName: 'Chakan Plant Phase 2',
      siteAddress: { line1: 'Gate 3, MIDC Chakan', city: 'Pune' },
      status: 'IN_PROGRESS',
      surveyDate: new Date('2026-10-15'),
      plannedStart: new Date('2026-11-01'),
      plannedEnd: new Date('2026-11-15'),
      actualStart: new Date('2026-11-01'),
      notes: 'On-site installation team required'
    }
  });

  const installation = await prisma.installation.create({
    data: {
      installationNo: 'INS-2026-011',
      projectId: project.id,
      status: 'SCHEDULED',
      scheduledAt: new Date('2026-11-02'),
      testResults: { resistance: '0.45 Ohms (Target < 1.0 Ohm)' },
      proofOfWork: { photo1: 'https://s3.amazonaws.com/yash-photos/site1.jpg' },
      notes: 'Final testing pending'
    }
  });

  const serviceTicket = await prisma.serviceTicket.create({
    data: {
      ticketNo: 'SRV-2026-0021',
      customerId: customer.id,
      assignedToId: salesUser.id,
      salesOrderId: salesOrder.id,
      productId: productFinished.id,
      serialNumber: 'SN-CBR-99821',
      issue: 'Routine ground resistance audit request',
      status: 'IN_PROGRESS',
      warrantyStart: new Date('2026-10-22'),
      warrantyEnd: new Date('2027-10-21'),
      reportedAt: now
    }
  });

  // ===================== 9. FINANCE, AUDIT & OTHER TABLES =====================
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNo: 'INV-261022-01',
      customerId: customer.id,
      salesOrderId: salesOrder.id,
      status: 'PARTIALLY_PAID',
      issueDate: now,
      dueDate: new Date('2026-11-21'),
      subtotal: 725000.00,
      taxAmount: 130500.00,
      total: 855500.00,
      paidAmount: 250000.00,
      notes: '30% advance received'
    }
  });

  const invoiceItem = await prisma.invoiceItem.create({
    data: {
      invoiceId: invoice.id,
      description: 'Copper Bonding Receptacle 172mm (Qty: 500)',
      quantity: 500,
      unitPrice: 1450.00,
      taxAmount: 130500.00,
      lineTotal: 855500.00
    }
  });

  const payment = await prisma.payment.create({
    data: {
      paymentNo: 'PAY-2026-091',
      invoiceId: invoice.id,
      amount: 250000.00,
      method: 'BANK_TRANSFER',
      referenceNo: 'UTR-HDFC-991823901',
      receivedAt: now,
      notes: 'Advance booking payment'
    }
  });

  const vendorBill = await prisma.vendorBill.create({
    data: {
      billNo: 'BILL-OSWAL-8812',
      vendorId: vendor.id,
      purchaseOrderId: purchaseOrder.id,
      status: 'APPROVED',
      billDate: now,
      dueDate: new Date('2026-11-20'),
      subtotal: 492000.00,
      taxAmount: 88560.00,
      total: 580560.00,
      paidAmount: 0.00
    }
  });

  const task = await prisma.task.create({
    data: {
      taskNo: 'TSK-2026-041',
      title: 'Prepare dispatch docs for Apex order',
      department: 'Sales',
      stakeholderName: 'Pratik Senapati',
      roleTitle: 'Sales Manager',
      linkedJob: 'SO-150926-AD-01',
      targetMetric: '100% On-time',
      shift: 'GENERAL',
      evidenceUrl: 'https://s3.amazonaws.com/yash-docs/dc01.pdf',
      description: 'Generate Delivery Challan and E-way bill',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueAt: new Date('2026-10-23'),
      createdById: salesUser.id,
      assignedToId: salesUser.id,
      projectId: project.id,
      relatedEntityType: 'SalesOrder',
      relatedEntityId: salesOrder.id
    }
  });

  const mediaAsset = await prisma.mediaAsset.create({
    data: {
      title: 'Technical Drawing CBR-172',
      type: 'DRAWING',
      storageKey: 'drawings/DRG-CBR-172-R5.pdf',
      mimeType: 'application/pdf',
      fileSize: 2048000n,
      revision: 'R5',
      description: 'Approved shopfloor mechanical drawing',
      isApproved: true,
      productId: productFinished.id,
      workOrderId: workOrder.id,
      projectId: project.id,
      installationId: installation.id,
      uploadedById: adminUser.id
    }
  });

  const communication = await prisma.communication.create({
    data: {
      leadId: lead.id,
      quotationId: quotation.id,
      userId: salesUser.id,
      channel: 'Email',
      direction: 'OUTBOUND',
      recipient: customer.email,
      subject: 'Quotation QT-260928-041 from Yash Group',
      body: 'Dear Suresh, Please find attached our revised quotation for your project.',
      status: 'SENT',
      sentAt: now,
      followUpAt: new Date('2026-10-25')
    }
  });

  const auditLog = await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'APPROVE_QUOTATION',
      entityType: 'Quotation',
      entityId: String(quotation.id),
      before: { status: 'DRAFT' },
      after: { status: 'APPROVED' },
      ipAddress: '192.168.1.45'
    }
  });

  const session = await prisma.session.create({
    data: {
      id: 'sess_992810239102931',
      userId: adminUser.id,
      expiresAt: new Date('2026-10-23T18:00:00Z'),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      ipAddress: '192.168.1.45'
    }
  });

  const documentProof = await prisma.documentProof.create({
    data: {
      leadId: lead.id,
      quotationId: quotation.id,
      orderId: salesOrder.id,
      documentType: 'TaxInvoice',
      documentNumber: 'INV-261022-01',
      storageFolder: 'tax-invoices',
      storageKey: 'invoices/INV-261022-01.pdf',
      storageUrl: 'https://s3.amazonaws.com/yash-pdf/INV-261022-01.pdf',
      recipientEmail: customer.email,
      recipientPhone: customer.phone,
      channel: 'EMAIL',
      status: 'SENT',
      messageId: 'MSG-SES-882102',
      sentById: salesUser.id,
      sentByName: salesUser.name,
      subject: 'Tax Invoice INV-261022-01',
      metadata: { total: 855500.00 }
    }
  });

  const materialRate = await prisma.materialRate.create({
    data: {
      materialCode: 'COPPER-99.9',
      materialName: 'Electrolytic Copper',
      category: 'Metals',
      unit: 'KG',
      currentRate: 820.00,
      previousRate: 805.00,
      changePercent: 1.86,
      marketBenchmark: 'MCX Mumbai Spot',
      effectiveDate: now,
      updatedById: adminUser.id,
      notes: 'Weekly market rate adjustment'
    }
  });

  const salesTarget = await prisma.salesTarget.create({
    data: {
      targetCode: 'TGT-2026-10',
      assignedById: adminUser.id,
      assignedToId: salesUser.id,
      title: 'October Monthly Sales Target',
      period: 'MONTHLY',
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-10-31'),
      targetCalls: 200,
      targetValue: 2500000.00,
      completedCalls: 145,
      answeredCalls: 120,
      cutOffCalls: 15,
      notConnectedCalls: 10,
      status: 'Active',
      notes: 'Focus on Chakan industrial cluster'
    }
  });

  const callLog = await prisma.callLog.create({
    data: {
      targetId: salesTarget.id,
      leadId: lead.id,
      callerId: salesUser.id,
      customerName: customer.name,
      phone: customer.phone,
      outcome: 'ANSWERED',
      durationSeconds: 240,
      discussionHighlights: 'Discussed delivery schedule and PI details',
      nextFollowUpAt: new Date('2026-10-25'),
      intent: 'Positive',
      quoteRequested: false
    }
  });

  const rolePermission = await prisma.rolePermission.create({
    data: {
      role: 'ADMIN',
      permissions: ['*']
    }
  });

  const assignedSpecification = await prisma.assignedSpecification.create({
    data: {
      specCode: 'TS-261007-001',
      title: 'Earthing Technical Specification',
      specType: 'TECHNICAL_DRAWING',
      documentUrl: 'https://s3.amazonaws.com/yash-docs/TS-261007.pdf',
      drawingNumber: 'DRG-CBR-172-R5',
      revision: 'R5',
      productId: productFinished.id,
      productSku: productFinished.sku,
      productName: productFinished.name,
      mediaId: mediaAsset.id,
      leadId: lead.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      assignedToUserId: salesUser.id,
      assignedToUserName: salesUser.name,
      assignedByUserId: adminUser.id,
      assignedByUserName: adminUser.name,
      managerNotes: 'Shared with client for technical signoff',
      status: 'ACTIVE',
      sharedAt: now,
      sharedMode: 'EMAIL',
      expiresAt: new Date('2026-10-23T18:00:00Z')
    }
  });

  const specificationRequest = await prisma.specificationRequest.create({
    data: {
      requestCode: 'REQ-261007-001',
      requestedByUserId: salesUser.id,
      requestedByUserName: salesUser.name,
      leadId: lead.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      requestType: 'CATALOG_PICK',
      productOrSpecName: productFinished.name,
      priority: 'HIGH',
      notes: 'Customer requested approved drawing for site survey',
      status: 'FULFILLED',
      fulfilledByUserId: adminUser.id,
      fulfilledByUserName: adminUser.name,
      fulfilledSpecificationAssignmentId: assignedSpecification.id,
      fulfilledAt: now
    }
  });

  const inventoryItem = await prisma.inventoryItem.create({
    data: {
      itemCode: 'STORE-RM-001',
      itemName: 'Raw Electrolytic Copper Ingot',
      category: 'Metals',
      warehouseLocation: 'RM Store - Bin 12',
      unitOfMeasure: 'KG',
      onHandStock: 1200.00,
      reservedStock: 400.00,
      reorderLevel: 250.00,
      unitCost: 820.00
    }
  });

  console.log('Seeding finished successfully. Admin user and all table records created!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });