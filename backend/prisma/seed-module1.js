import prisma from "../src/db/prisma.js";

async function seedModule1() {
  console.log("Enriching database with Module 1 sample records...");

  // 1. Ensure Back Officer user exists
  let backOfficer = await prisma.user.findFirst({
    where: { role: "BACK_OFFICER" },
  });

  if (!backOfficer) {
    backOfficer = await prisma.user.create({
      data: {
        employeeCode: "BO-001",
        name: "Rukhsar Shaikh",
        email: "rukhsar.shaikh@yashgroup.com",
        phone: "+91 9370335298",
        department: "Sales Support",
        designation: "Back Office Executive",
        role: "BACK_OFFICER",
        passwordHash: "$2b$10$wK1Ww4p6c4x1x/zK8LwU.O0eQkE8ZqD5xTj1z7y9X9H8qZ1s6W0e", // Demo hash
        approvalStatus: "APPROVED",
        isActive: true,
      },
    });
  }

  // 2. Ensure Sales Consultants exist
  let consultant1 = await prisma.user.findFirst({
    where: { role: "SALES_CONSULTANT" },
  });
  if (!consultant1) {
    consultant1 = await prisma.user.create({
      data: {
        employeeCode: "SC-001",
        name: "Usha Sawant",
        email: "usha.sawant@yashgroup.com",
        phone: "+91 9878987989",
        department: "Sales",
        designation: "Senior Sales Consultant",
        role: "SALES_CONSULTANT",
        passwordHash: "$2b$10$wK1Ww4p6c4x1x/zK8LwU.O0eQkE8ZqD5xTj1z7y9X9H8qZ1s6W0e",
        approvalStatus: "APPROVED",
        isActive: true,
      },
    });
  }

  // 3. Products
  const productsData = [
    {
      sku: "YGI501F",
      name: "GI Earthing Electrode",
      variant: "50MM & 1 FEET Long with Backfill 5KG",
      hsnCode: "8538",
      listPrice: 2150.00,
      standardMake: "YASH",
      unitOfMeasure: "NOS",
    },
    {
      sku: "ESE-LA",
      name: "ESE Lightning Arrester",
      variant: "Protection radius 107 m",
      hsnCode: "8538",
      listPrice: 142000.00,
      standardMake: "YASH",
      unitOfMeasure: "SET",
    },
    {
      sku: "YEC-CBR-172",
      name: "Copper Bonded Rod",
      variant: "17.2 mm × 3000 mm",
      hsnCode: "7407",
      listPrice: 1500.00,
      standardMake: "YASH",
      unitOfMeasure: "NOS",
    },
    {
      sku: "YEC-CP-001",
      name: "Copper Plate",
      variant: "600 × 600 × 3 mm",
      hsnCode: "7409",
      listPrice: 4200.00,
      standardMake: "YASH",
      unitOfMeasure: "PCS",
    },
  ];

  let defaultCat = await prisma.category.findFirst();
  if (!defaultCat) {
    defaultCat = await prisma.category.create({
      data: {
        name: "Standard Electrical Products",
        type: "FINISHED_GOOD",
      },
    });
  }

  for (const p of productsData) {
    const existing = await prisma.product.findUnique({ where: { sku: p.sku } });
    if (!existing) {
      await prisma.product.create({ data: { ...p, categoryId: defaultCat.id } });
    }
  }

  // 4. Sample Leads
  const leadsData = [
    {
      code: "LD-261022-001",
      customerName: "test-Dummy-company",
      contactName: "Vikram Rathore",
      phone: "+91 9878987989",
      email: "procurement@testdummy.com",
      city: "Pune",
      state: "Maharashtra",
      productName: "ESE Lightning Arrester",
      productSku: "ESE-LA",
      variant: "Qty: 1.00",
      quantity: 1,
      expectedValue: 2000.00,
      source: "MANUAL",
      stage: "CONTACTED",
      priority: "HIGH",
      assignedToId: consultant1.id,
      assignedByName: consultant1.name,
      requirement: "ESE Lightning Protection for plant roof",
    },
    {
      code: "LD-261021-004",
      customerName: "New Company-166381455",
      contactName: "Shraddha More",
      phone: "+91 9811878166",
      email: "contact@newcompany.com",
      city: "Mumbai",
      state: "Maharashtra",
      productName: "Copper Plate",
      productSku: "YEC-CP-001",
      variant: "Qty: 1.00",
      quantity: 1,
      expectedValue: 4200.00,
      source: "TRADE_INDIA",
      stage: "CONTACTED",
      priority: "MEDIUM",
      assignedToId: consultant1.id,
      assignedByName: consultant1.name,
      requirement: "Substation earthing copper plates",
    },
    {
      code: "LD-261021-003",
      customerName: "Bailey International",
      contactName: "Ashwini Darveshi",
      phone: "+91 9874795455",
      email: "orders@baileyintl.com",
      city: "Nagpur",
      state: "Maharashtra",
      productName: "Galvanized Iron Wire",
      productSku: "YGI501F",
      variant: "Qty: 28000.00",
      quantity: 28000,
      expectedValue: 280000.00,
      source: "EXPORT_INDIA",
      stage: "CONTACTED",
      priority: "HIGH",
      assignedToId: consultant1.id,
      assignedByName: consultant1.name,
      requirement: "GI wire 28,000 units bulk supply",
    },
    {
      code: "LD-261021-002",
      customerName: "fundsroom",
      contactName: "Ram Sharma",
      phone: "+91 7276214531",
      email: "procurement@fundsroom.com",
      city: "Hyderabad",
      state: "Telangana",
      productName: "Yash Earthing Compound",
      productSku: "YGI501F",
      variant: "Qty: 1.00",
      quantity: 1,
      expectedValue: 2537.00,
      source: "TRADE_INDIA",
      stage: "PO_RECEIVED",
      priority: "CRITICAL",
      assignedToId: consultant1.id,
      assignedByName: consultant1.name,
      requirement: "GI Earthing Electrode with digital backfill bag",
    },
  ];

  for (const ld of leadsData) {
    const existing = await prisma.lead.findUnique({ where: { code: ld.code } });
    if (!existing) {
      await prisma.lead.create({ data: ld });
    }
  }

  // 5. Ensure sample Quotation QT-261022-457 exists (matching Image 2)
  const productYGI = await prisma.product.findFirst({ where: { sku: "YGI501F" } });
  const sampleCustomer = await prisma.customer.findFirst();

  let sampleQuote = await prisma.quotation.findFirst({
    where: { quotationNo: "QT-261022-457" },
  });

  if (!sampleQuote && sampleCustomer && productYGI) {
    const lead4 = await prisma.lead.findUnique({ where: { code: "LD-261021-002" } });
    sampleQuote = await prisma.quotation.create({
      data: {
        quotationNo: "QT-261022-457",
        customerId: sampleCustomer.id,
        leadId: lead4?.id || null,
        salesRepresentativeId: consultant1.id,
        status: "DRAFT",
        preparedBy: "Ms. RUKHSAR SHAIKH",
        currency: "INR",
        subtotal: 2150.00,
        discountAmount: 0,
        taxableAmount: 2150.00,
        gstPercent: 18.00,
        gstAmount: 387.00, // 193.50 CGST + 193.50 SGST
        total: 2537.00,
        validityDays: 15,
        paymentTerms: "100% Advance against PI",
        deliveryTerms: "Ex-Works Pune / Road Transport",
        termsAndConditions:
          "1. Taxation: GST extra as applicable at actuals.\n2. Delivery: Within 1 to 2 days after receipt of confirmed PO / advance payment.\n3. Standards: Material compliant with IS 3043:2018, MSEB, MHADA, and NABL specifications.\n4. Jurisdiction: All disputes subject to Pune Jurisdiction only.",
        revision: 0,
      },
    });

    await prisma.quotationItem.create({
      data: {
        quotationId: sampleQuote.id,
        productId: productYGI.id,
        description:
          'YASH Make "GI Earthing Electrode" Chemical Earthing System Outer Electrode Dia 50MM & 1 FEET Long, Tightly Filled with Crystalline Conductor Mixture, Hot Dip Galvanized Along with Digital Bag of Back Fill Compound 5KG (5KG X 1 BAG)',
        quantity: 1,
        unitPrice: 2150.00,
        subtotal: 2150.00,
        lineTotal: 2537.00,
      },
    }).catch(() => null);
  }

  // 6. Ensure Inventory record exists for stock check
  if (productYGI) {
    const existingInv = await prisma.inventory.findFirst({
      where: { productId: productYGI.id },
    });
    if (!existingInv) {
      await prisma.inventory.create({
        data: {
          productId: productYGI.id,
          warehouseLocation: "Main Pune Warehouse",
          physicalQuantity: 250,
          reservedQuantity: 0,
          reorderLevel: 25,
        },
      });
    }
  }

  console.log("Module 1 seed enrichment complete!");
  await prisma.$disconnect();
}

seedModule1().catch((err) => {
  console.error("Seed Module 1 error:", err);
  process.exit(1);
});
