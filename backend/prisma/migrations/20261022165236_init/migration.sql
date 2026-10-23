-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SALES_MANAGER', 'SALES_CONSULTANT', 'BACK_OFFICER', 'DISPATCH_OFFICER', 'FACTORY_INWARD_OFFICER', 'BANK_OFFICE_EXECUTIVE', 'PROCUREMENT_OFFICER', 'ENGINEER', 'PRODUCTION_MANAGER', 'QUALITY_INSPECTOR', 'PROJECT_MANAGER', 'SERVICE_EXECUTIVE', 'HR_MANAGER', 'FINANCE_MANAGER');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('INDIAN_MART', 'EXPORT_INDIA', 'JUSTDIAL', 'TRADE_INDIA', 'SULEKHA', 'GOOGLE_ADS', 'META_ADS', 'WEBSITE', 'EXCEL', 'MANUAL', 'REFERRAL', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadStage" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'REQUIREMENT_CAPTURED', 'QUOTATION_DRAFT', 'QUOTATION_SENT', 'NEGOTIATION', 'PO_RECEIVED', 'CONVERTED', 'LOST');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SENT_TO_CLIENT', 'UNDER_REVISION', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "SalesOrderStatus" AS ENUM ('DRAFT', 'PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'CREDIT', 'OTHER');

-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('RAW_MATERIAL', 'BOUGHT_OUT', 'FINISHED_GOOD', 'CONSUMABLE', 'SERVICE', 'OTHER');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('STOCK_IN', 'STOCK_OUT', 'RESERVATION', 'RELEASE_RESERVATION', 'ISSUE_TO_WORK_ORDER', 'DISPATCH', 'RETURN', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "InventoryReferenceType" AS ENUM ('PURCHASE_ORDER', 'GOODS_RECEIPT', 'SALES_ORDER', 'WORK_ORDER', 'DISPATCH', 'CUSTOMER_RETURN', 'STOCK_AUDIT', 'MANUAL');

-- CreateEnum
CREATE TYPE "PurchaseRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "RFQStatus" AS ENUM ('DRAFT', 'SENT', 'QUOTATIONS_RECEIVED', 'EVALUATED', 'AWARDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('DRAFT', 'RECEIVED', 'UNDER_INSPECTION', 'ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EngineeringStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'RELEASED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('DRAFT', 'PLANNED', 'RELEASED', 'MATERIAL_HOLD', 'IN_PROGRESS', 'QC_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QualityStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'PASS', 'FAIL', 'HOLD', 'RELEASED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'SURVEY_PENDING', 'PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InstallationStatus" AS ENUM ('NOT_REQUIRED', 'SURVEY_DUE', 'PLANNED', 'SCHEDULED', 'IN_PROGRESS', 'TESTING', 'HANDOVER_PENDING', 'COMPLETED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'MATCHED', 'APPROVED', 'PARTIALLY_PAID', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'BLOCKED', 'WAITING_APPROVAL', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('DRAWING', 'PHOTO', 'VIDEO', 'AUDIO', 'DOCUMENT', 'TRAINING', 'OTHER');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_PARTS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('GENERAL', 'SHIFT_A', 'SHIFT_B', 'SITE');

-- CreateEnum
CREATE TYPE "CallOutcome" AS ENUM ('ANSWERED', 'CUT_OFF', 'DID_NOT_CONNECT', 'BUSY', 'WRONG_NUMBER', 'FOLLOW_UP_SCHEDULED', 'QUOTATION_REQUESTED', 'NOT_INTERESTED');

-- CreateEnum
CREATE TYPE "TargetPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "DispatchStatus" AS ENUM ('WAITING_APPROVAL', 'READY_FOR_FACTORY', 'PACKING', 'READY_FOR_DISPATCH', 'DISPATCHED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT,
    "department" TEXT NOT NULL DEFAULT 'Sales',
    "shift" "ShiftType" NOT NULL DEFAULT 'GENERAL',
    "dateOfBirth" TIMESTAMP(3),
    "avatarUrl" TEXT,
    "employeeCode" TEXT,
    "designation" TEXT,
    "emergencyContact" TEXT,
    "address" TEXT,
    "joiningDate" TIMESTAMP(3),
    "canEditPhoto" BOOLEAN NOT NULL DEFAULT true,
    "isLoggedIn" BOOLEAN NOT NULL DEFAULT false,
    "role" "UserRole" NOT NULL DEFAULT 'SALES_CONSULTANT',
    "permissions" JSONB DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "gstin" TEXT,
    "billingAddress" JSONB,
    "shippingAddress" JSONB,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "source" "LeadSource" NOT NULL,
    "sourceReference" TEXT,
    "externalId" TEXT,
    "alternatePhone" TEXT,
    "productSku" TEXT,
    "productName" TEXT,
    "variant" TEXT,
    "intent" TEXT DEFAULT 'Positive',
    "contactType" TEXT DEFAULT 'New Contact',
    "assignedById" INTEGER,
    "assignedByName" TEXT,
    "lastActivityNote" TEXT,
    "rawQueryData" JSONB,
    "customerName" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "state" TEXT,
    "requirement" TEXT,
    "productId" INTEGER,
    "quantity" INTEGER,
    "expectedValue" DECIMAL(14,2),
    "sentiment" TEXT,
    "stage" "LeadStage" NOT NULL DEFAULT 'NEW',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "customerId" INTEGER,
    "assignedToId" INTEGER,
    "nextFollowUpAt" TIMESTAMP(3),
    "lostReason" TEXT,
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CategoryType" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "variant" TEXT,
    "hsnCode" TEXT DEFAULT '8538',
    "standardMake" TEXT DEFAULT 'YASH',
    "gstPercent" DECIMAL(5,2) NOT NULL DEFAULT 18,
    "minReorderLevel" DECIMAL(12,2) NOT NULL DEFAULT 10,
    "diameter" TEXT,
    "length" TEXT,
    "modelName" TEXT,
    "bagType" TEXT,
    "bagPricing" TEXT,
    "bagSize" TEXT,
    "bagQuantity" INTEGER NOT NULL DEFAULT 1,
    "descriptionTemplate" TEXT,
    "drawingId" TEXT,
    "drawingUrl" TEXT,
    "imageUrl" TEXT,
    "description" TEXT,
    "unitOfMeasure" TEXT NOT NULL DEFAULT 'PCS',
    "listPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "isManufactured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadItem" (
    "id" SERIAL NOT NULL,
    "leadId" INTEGER NOT NULL,
    "productId" INTEGER,
    "productName" TEXT NOT NULL,
    "productSku" TEXT,
    "variant" TEXT,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" SERIAL NOT NULL,
    "quotationNo" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "leadId" INTEGER,
    "salesRepresentativeId" INTEGER NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "validUntil" TIMESTAMP(3),
    "revision" INTEGER NOT NULL DEFAULT 0,
    "callerName" TEXT,
    "preparedBy" TEXT,
    "freightAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxableAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "gstPercent" DECIMAL(5,2) NOT NULL DEFAULT 18,
    "gstAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "validityDays" INTEGER NOT NULL DEFAULT 15,
    "paymentTerms" TEXT,
    "deliveryTerms" TEXT,
    "customerPONumber" TEXT,
    "customerPODate" TIMESTAMP(3),
    "proformaInvoiceNumber" TEXT,
    "proformaInvoiceUrl" TEXT,
    "proformaInvoiceSentAt" TIMESTAMP(3),
    "proformaInvoiceSentChannel" TEXT,
    "revisionNotes" TEXT,
    "emailSentAt" TIMESTAMP(3),
    "emailRecipient" TEXT,
    "emailMessageId" TEXT,
    "termsAndConditions" TEXT,
    "notes" TEXT,
    "sentAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationItem" (
    "id" SERIAL NOT NULL,
    "quotationId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "discountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "lineTotal" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrder" (
    "id" SERIAL NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "quotationId" INTEGER,
    "customerId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "customerPONumber" TEXT,
    "proformaInvoiceNumber" TEXT,
    "productSummary" TEXT,
    "quantitySummary" TEXT,
    "approvalStatus" TEXT NOT NULL DEFAULT 'Pending',
    "approvedById" INTEGER,
    "stockReserved" BOOLEAN NOT NULL DEFAULT false,
    "taxInvoiceNumber" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "invoicePdfUrl" TEXT,
    "invoiceStatus" TEXT NOT NULL DEFAULT 'Pending',
    "dispatchStatus" "DispatchStatus" NOT NULL DEFAULT 'WAITING_APPROVAL',
    "dispatchOfficerName" TEXT,
    "transporterName" TEXT,
    "vehicleNumber" TEXT,
    "lrNumber" TEXT,
    "deliveryChallanNumber" TEXT,
    "deliveryLocation" TEXT,
    "irn" TEXT,
    "acknowledgementNumber" TEXT,
    "bankDetails" JSONB,
    "upiQrString" TEXT,
    "receivedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "balanceAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "previousBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currentBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "paymentMode" TEXT DEFAULT 'Credit',
    "whatsappSentAt" TIMESTAMP(3),
    "emailSentAt" TIMESTAMP(3),
    "dispatchDate" TIMESTAMP(3),
    "status" "SalesOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDeliveryDate" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "dispatchedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "gstAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrderItem" (
    "id" SERIAL NOT NULL,
    "salesOrderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "productSkuSnapshot" TEXT NOT NULL,
    "productNameSnapshot" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "discountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "gstPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "baseAmount" DECIMAL(14,2) NOT NULL,
    "discountAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxableAmount" DECIMAL(14,2) NOT NULL,
    "gstAmount" DECIMAL(14,2) NOT NULL,
    "lineTotal" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "SalesOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "gstin" TEXT,
    "address" JSONB,
    "city" TEXT,
    "state" TEXT,
    "category" TEXT,
    "alternatePhone" TEXT,
    "pan" TEXT,
    "categories" JSONB,
    "makesSupplied" JSONB,
    "paymentTerms" TEXT,
    "bankDetails" JSONB,
    "notes" TEXT,
    "rating" DECIMAL(3,2),
    "onTimeDeliveryPercent" DECIMAL(5,2),
    "qualityScore" DECIMAL(5,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorItem" (
    "id" SERIAL NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "vendorSku" TEXT,
    "leadTimeDays" INTEGER,
    "lastQuotedPrice" DECIMAL(14,2),

    CONSTRAINT "VendorItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequest" (
    "id" SERIAL NOT NULL,
    "requestNo" TEXT NOT NULL,
    "salesOrderId" INTEGER,
    "status" "PurchaseRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "requestedById" INTEGER,
    "requiredBy" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequestItem" (
    "id" SERIAL NOT NULL,
    "purchaseRequestId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "PurchaseRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQ" (
    "id" SERIAL NOT NULL,
    "rfqNo" TEXT NOT NULL,
    "purchaseRequestId" INTEGER,
    "status" "RFQStatus" NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RFQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQResponse" (
    "id" SERIAL NOT NULL,
    "rfqId" INTEGER NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "quotedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "notes" TEXT,
    "totalAmount" DECIMAL(14,2),

    CONSTRAINT "RFQResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQResponseItem" (
    "id" SERIAL NOT NULL,
    "responseId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "taxPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,

    CONSTRAINT "RFQResponseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" SERIAL NOT NULL,
    "poNumber" TEXT NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "rfqId" INTEGER,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDate" TIMESTAMP(3),
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" SERIAL NOT NULL,
    "purchaseOrderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "receivedQuantity" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "taxPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceipt" (
    "id" SERIAL NOT NULL,
    "grnNumber" TEXT NOT NULL,
    "purchaseOrderId" INTEGER NOT NULL,
    "status" "ReceiptStatus" NOT NULL DEFAULT 'DRAFT',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedById" INTEGER,
    "notes" TEXT,

    CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceiptItem" (
    "id" SERIAL NOT NULL,
    "goodsReceiptId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "orderedQuantity" DECIMAL(12,3) NOT NULL,
    "receivedQuantity" DECIMAL(12,3) NOT NULL,
    "acceptedQuantity" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "rejectedQuantity" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "batchNumber" TEXT,

    CONSTRAINT "GoodsReceiptItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "warehouseLocation" TEXT NOT NULL DEFAULT 'RM Store',
    "unitCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "physicalQuantity" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "reservedQuantity" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "reorderLevel" DECIMAL(14,3) NOT NULL DEFAULT 10,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "movementType" "InventoryMovementType" NOT NULL,
    "referenceType" "InventoryReferenceType" NOT NULL,
    "referenceId" INTEGER,
    "salesOrderId" INTEGER,
    "goodsReceiptId" INTEGER,
    "quantity" DECIMAL(14,3) NOT NULL,
    "batchNumber" TEXT,
    "locationCode" TEXT,
    "notes" TEXT,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSpecification" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "revision" TEXT NOT NULL,
    "status" "EngineeringStatus" NOT NULL DEFAULT 'DRAFT',
    "specification" JSONB NOT NULL,
    "drawingNumber" TEXT,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductSpecification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BOMRevision" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "revision" TEXT NOT NULL,
    "status" "EngineeringStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "materialCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "laborCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "overheadCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BOMRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BOMItem" (
    "id" SERIAL NOT NULL,
    "bomRevisionId" INTEGER NOT NULL,
    "componentProductId" INTEGER NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "scrapPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,

    CONSTRAINT "BOMItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BOMOperation" (
    "id" SERIAL NOT NULL,
    "bomRevisionId" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "workCenter" TEXT,
    "standardMinutes" DECIMAL(10,2),
    "instructions" TEXT,

    CONSTRAINT "BOMOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" SERIAL NOT NULL,
    "workOrderNo" TEXT NOT NULL,
    "salesOrderId" INTEGER NOT NULL,
    "bomRevisionId" INTEGER,
    "createdById" INTEGER,
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "plannedQuantity" DECIMAL(12,3) NOT NULL,
    "goodQuantity" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "rejectedQuantity" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "plannedStart" TIMESTAMP(3),
    "plannedEnd" TIMESTAMP(3),
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrderItem" (
    "id" SERIAL NOT NULL,
    "workOrderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "plannedQuantity" DECIMAL(12,3) NOT NULL,
    "issuedQuantity" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "consumedQuantity" DECIMAL(12,3) NOT NULL DEFAULT 0,

    CONSTRAINT "WorkOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityInspection" (
    "id" SERIAL NOT NULL,
    "inspectionNo" TEXT NOT NULL,
    "workOrderId" INTEGER NOT NULL,
    "status" "QualityStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "inspectedQuantity" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "acceptedQuantity" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "rejectedQuantity" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "measurements" JSONB,
    "evidenceNotes" TEXT,
    "inspectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QualityInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "projectCode" TEXT NOT NULL,
    "salesOrderId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "ownerId" INTEGER,
    "name" TEXT NOT NULL,
    "siteName" TEXT,
    "siteAddress" JSONB,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "surveyDate" TIMESTAMP(3),
    "plannedStart" TIMESTAMP(3),
    "plannedEnd" TIMESTAMP(3),
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Installation" (
    "id" SERIAL NOT NULL,
    "installationNo" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "status" "InstallationStatus" NOT NULL DEFAULT 'SURVEY_DUE',
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "testResults" JSONB,
    "proofOfWork" JSONB,
    "customerSignoffName" TEXT,
    "customerSignedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Installation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceTicket" (
    "id" SERIAL NOT NULL,
    "ticketNo" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "assignedToId" INTEGER,
    "salesOrderId" INTEGER,
    "productId" INTEGER,
    "serialNumber" TEXT,
    "issue" TEXT NOT NULL,
    "status" "ServiceStatus" NOT NULL DEFAULT 'OPEN',
    "warrantyStart" TIMESTAMP(3),
    "warrantyEnd" TIMESTAMP(3),
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,

    CONSTRAINT "ServiceTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSize" BIGINT,
    "revision" TEXT,
    "description" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "productId" INTEGER,
    "workOrderId" INTEGER,
    "projectId" INTEGER,
    "installationId" INTEGER,
    "uploadedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Communication" (
    "id" SERIAL NOT NULL,
    "leadId" INTEGER,
    "quotationId" INTEGER,
    "userId" INTEGER NOT NULL,
    "channel" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'OUTBOUND',
    "recipient" TEXT,
    "subject" TEXT,
    "body" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "followUpAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Communication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" SERIAL NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "salesOrderId" INTEGER NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" SERIAL NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "paymentNo" TEXT NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "referenceNo" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorBill" (
    "id" SERIAL NOT NULL,
    "billNo" TEXT NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "purchaseOrderId" INTEGER,
    "status" "BillStatus" NOT NULL DEFAULT 'DRAFT',
    "billDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "userId" INTEGER,
    "fullName" TEXT NOT NULL,
    "department" TEXT,
    "designation" TEXT,
    "employmentType" TEXT,
    "dateOfJoining" TIMESTAMP(3),
    "salary" DECIMAL(14,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "workDate" DATE NOT NULL,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "hoursWorked" DECIMAL(6,2),

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "taskNo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT,
    "stakeholderName" TEXT,
    "roleTitle" TEXT,
    "linkedJob" TEXT,
    "targetMetric" TEXT,
    "shift" "ShiftType" NOT NULL DEFAULT 'GENERAL',
    "evidenceUrl" TEXT,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "dueAt" TIMESTAMP(3),
    "createdById" INTEGER NOT NULL,
    "assignedToId" INTEGER,
    "projectId" INTEGER,
    "relatedEntityType" TEXT,
    "relatedEntityId" INTEGER,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" BIGSERIAL NOT NULL,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ipAddress" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentProof" (
    "id" SERIAL NOT NULL,
    "leadId" INTEGER,
    "quotationId" INTEGER,
    "orderId" INTEGER,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "storageFolder" TEXT NOT NULL,
    "storageKey" TEXT,
    "storageUrl" TEXT,
    "recipientEmail" TEXT,
    "recipientPhone" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "messageId" TEXT,
    "sentById" INTEGER,
    "sentByName" TEXT,
    "subject" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentProof_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialRate" (
    "id" SERIAL NOT NULL,
    "materialCode" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Metals',
    "unit" TEXT NOT NULL DEFAULT 'KG',
    "currentRate" DECIMAL(12,2) NOT NULL,
    "previousRate" DECIMAL(12,2),
    "changePercent" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "marketBenchmark" TEXT,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedById" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesTarget" (
    "id" SERIAL NOT NULL,
    "targetCode" TEXT NOT NULL,
    "assignedById" INTEGER NOT NULL,
    "assignedToId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "period" "TargetPeriod" NOT NULL DEFAULT 'DAILY',
    "targetDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "targetCalls" INTEGER NOT NULL DEFAULT 20,
    "targetValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "completedCalls" INTEGER NOT NULL DEFAULT 0,
    "answeredCalls" INTEGER NOT NULL DEFAULT 0,
    "cutOffCalls" INTEGER NOT NULL DEFAULT 0,
    "notConnectedCalls" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallLog" (
    "id" SERIAL NOT NULL,
    "targetId" INTEGER,
    "leadId" INTEGER,
    "callerId" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "outcome" "CallOutcome" NOT NULL DEFAULT 'ANSWERED',
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "discussionHighlights" TEXT,
    "nextFollowUpAt" TIMESTAMP(3),
    "intent" TEXT DEFAULT 'Positive',
    "quoteRequested" BOOLEAN NOT NULL DEFAULT false,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" SERIAL NOT NULL,
    "role" TEXT NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceSetting" (
    "id" SERIAL NOT NULL,
    "workStartTime" TEXT NOT NULL DEFAULT '09:30',
    "graceBufferMinutes" INTEGER NOT NULL DEFAULT 10,
    "workEndTime" TEXT NOT NULL DEFAULT '18:30',
    "requireGeofence" BOOLEAN NOT NULL DEFAULT false,
    "officeLatitude" DECIMAL(10,7),
    "officeLongitude" DECIMAL(10,7),
    "officeRadiusMeters" INTEGER NOT NULL DEFAULT 100,
    "officeAddress" TEXT,
    "autoAssignEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoAssignLoggedInOnly" BOOLEAN NOT NULL DEFAULT true,
    "updatedById" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAttendanceLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "firstLoginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'OnTime',
    "lateMinutes" INTEGER NOT NULL DEFAULT 0,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "distanceMeters" INTEGER NOT NULL DEFAULT 0,
    "locationStatus" TEXT NOT NULL DEFAULT 'InOffice',
    "locationAddress" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAttendanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignedSpecification" (
    "id" SERIAL NOT NULL,
    "specCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "specType" TEXT NOT NULL DEFAULT 'TECHNICAL_DRAWING',
    "documentUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "drawingNumber" TEXT,
    "revision" TEXT NOT NULL DEFAULT 'R1',
    "productId" INTEGER,
    "productSku" TEXT,
    "productName" TEXT,
    "mediaId" INTEGER,
    "specificationId" INTEGER,
    "leadId" INTEGER,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "assignedToUserId" INTEGER NOT NULL,
    "assignedToUserName" TEXT,
    "assignedByUserId" INTEGER NOT NULL,
    "assignedByUserName" TEXT,
    "managerNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "sharedAt" TIMESTAMP(3),
    "sharedMode" TEXT,
    "shareLog" JSONB NOT NULL DEFAULT '[]',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssignedSpecification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecificationRequest" (
    "id" SERIAL NOT NULL,
    "requestCode" TEXT NOT NULL,
    "requestedByUserId" INTEGER NOT NULL,
    "requestedByUserName" TEXT,
    "leadId" INTEGER,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "requestType" TEXT NOT NULL DEFAULT 'TYPED_SPEC',
    "productOrSpecName" TEXT NOT NULL,
    "catalogDocumentId" INTEGER,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "fulfilledByUserId" INTEGER,
    "fulfilledByUserName" TEXT,
    "fulfilledSpecificationAssignmentId" INTEGER,
    "fulfilledAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" SERIAL NOT NULL,
    "itemCode" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "warehouseLocation" TEXT NOT NULL DEFAULT 'RM Store',
    "unitOfMeasure" TEXT NOT NULL DEFAULT 'PCS',
    "onHandStock" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "reservedStock" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "reorderLevel" DECIMAL(14,3) NOT NULL DEFAULT 10,
    "unitCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeCode_key" ON "User"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_code_key" ON "Customer"("code");

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_code_key" ON "Lead"("code");

-- CreateIndex
CREATE INDEX "Lead_stage_assignedToId_idx" ON "Lead"("stage", "assignedToId");

-- CreateIndex
CREATE INDEX "Lead_source_createdAt_idx" ON "Lead"("source", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_categoryId_name_idx" ON "Product"("categoryId", "name");

-- CreateIndex
CREATE INDEX "LeadItem_leadId_idx" ON "LeadItem"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_quotationNo_key" ON "Quotation"("quotationNo");

-- CreateIndex
CREATE INDEX "Quotation_customerId_status_idx" ON "Quotation"("customerId", "status");

-- CreateIndex
CREATE INDEX "Quotation_salesRepresentativeId_createdAt_idx" ON "Quotation"("salesRepresentativeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuotationItem_quotationId_productId_key" ON "QuotationItem"("quotationId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrder_orderNumber_key" ON "SalesOrder"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrder_quotationId_key" ON "SalesOrder"("quotationId");

-- CreateIndex
CREATE INDEX "SalesOrder_customerId_status_idx" ON "SalesOrder"("customerId", "status");

-- CreateIndex
CREATE INDEX "SalesOrder_status_orderDate_idx" ON "SalesOrder"("status", "orderDate");

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrderItem_salesOrderId_productId_key" ON "SalesOrderItem"("salesOrderId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_code_key" ON "Vendor"("code");

-- CreateIndex
CREATE UNIQUE INDEX "VendorItem_vendorId_productId_key" ON "VendorItem"("vendorId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequest_requestNo_key" ON "PurchaseRequest"("requestNo");

-- CreateIndex
CREATE INDEX "PurchaseRequest_status_requiredBy_idx" ON "PurchaseRequest"("status", "requiredBy");

-- CreateIndex
CREATE UNIQUE INDEX "RFQ_rfqNo_key" ON "RFQ"("rfqNo");

-- CreateIndex
CREATE UNIQUE INDEX "RFQResponse_rfqId_vendorId_key" ON "RFQResponse"("rfqId", "vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_poNumber_key" ON "PurchaseOrder"("poNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrder_vendorId_status_idx" ON "PurchaseOrder"("vendorId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceipt_grnNumber_key" ON "GoodsReceipt"("grnNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_productId_key" ON "Inventory"("productId");

-- CreateIndex
CREATE INDEX "InventoryMovement_productId_createdAt_idx" ON "InventoryMovement"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_referenceType_referenceId_idx" ON "InventoryMovement"("referenceType", "referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSpecification_productId_revision_key" ON "ProductSpecification"("productId", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "BOMRevision_productId_revision_key" ON "BOMRevision"("productId", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "BOMItem_bomRevisionId_componentProductId_key" ON "BOMItem"("bomRevisionId", "componentProductId");

-- CreateIndex
CREATE UNIQUE INDEX "BOMOperation_bomRevisionId_sequence_key" ON "BOMOperation"("bomRevisionId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_workOrderNo_key" ON "WorkOrder"("workOrderNo");

-- CreateIndex
CREATE INDEX "WorkOrder_status_plannedStart_idx" ON "WorkOrder"("status", "plannedStart");

-- CreateIndex
CREATE UNIQUE INDEX "QualityInspection_inspectionNo_key" ON "QualityInspection"("inspectionNo");

-- CreateIndex
CREATE UNIQUE INDEX "Project_projectCode_key" ON "Project"("projectCode");

-- CreateIndex
CREATE INDEX "Project_status_plannedStart_idx" ON "Project"("status", "plannedStart");

-- CreateIndex
CREATE UNIQUE INDEX "Installation_installationNo_key" ON "Installation"("installationNo");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceTicket_ticketNo_key" ON "ServiceTicket"("ticketNo");

-- CreateIndex
CREATE INDEX "ServiceTicket_customerId_status_idx" ON "ServiceTicket"("customerId", "status");

-- CreateIndex
CREATE INDEX "MediaAsset_type_createdAt_idx" ON "MediaAsset"("type", "createdAt");

-- CreateIndex
CREATE INDEX "Communication_leadId_followUpAt_idx" ON "Communication"("leadId", "followUpAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNo_key" ON "Invoice"("invoiceNo");

-- CreateIndex
CREATE INDEX "Invoice_customerId_status_dueDate_idx" ON "Invoice"("customerId", "status", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymentNo_key" ON "Payment"("paymentNo");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_receivedAt_idx" ON "Payment"("invoiceId", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "VendorBill_billNo_key" ON "VendorBill"("billNo");

-- CreateIndex
CREATE INDEX "VendorBill_vendorId_status_dueDate_idx" ON "VendorBill"("vendorId", "status", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeCode_key" ON "Employee"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE INDEX "Employee_department_isActive_idx" ON "Employee"("department", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_employeeId_workDate_key" ON "Attendance"("employeeId", "workDate");

-- CreateIndex
CREATE UNIQUE INDEX "Task_taskNo_key" ON "Task"("taskNo");

-- CreateIndex
CREATE INDEX "Task_assignedToId_status_dueAt_idx" ON "Task"("assignedToId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "Task_relatedEntityType_relatedEntityId_idx" ON "Task"("relatedEntityType", "relatedEntityId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "DocumentProof_leadId_idx" ON "DocumentProof"("leadId");

-- CreateIndex
CREATE INDEX "DocumentProof_quotationId_idx" ON "DocumentProof"("quotationId");

-- CreateIndex
CREATE INDEX "DocumentProof_orderId_idx" ON "DocumentProof"("orderId");

-- CreateIndex
CREATE INDEX "DocumentProof_documentType_idx" ON "DocumentProof"("documentType");

-- CreateIndex
CREATE INDEX "DocumentProof_createdAt_idx" ON "DocumentProof"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialRate_materialCode_key" ON "MaterialRate"("materialCode");

-- CreateIndex
CREATE UNIQUE INDEX "SalesTarget_targetCode_key" ON "SalesTarget"("targetCode");

-- CreateIndex
CREATE INDEX "SalesTarget_assignedToId_period_status_idx" ON "SalesTarget"("assignedToId", "period", "status");

-- CreateIndex
CREATE INDEX "CallLog_targetId_idx" ON "CallLog"("targetId");

-- CreateIndex
CREATE INDEX "CallLog_leadId_idx" ON "CallLog"("leadId");

-- CreateIndex
CREATE INDEX "CallLog_callerId_loggedAt_idx" ON "CallLog"("callerId", "loggedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_role_key" ON "RolePermission"("role");

-- CreateIndex
CREATE INDEX "UserAttendanceLog_date_idx" ON "UserAttendanceLog"("date");

-- CreateIndex
CREATE UNIQUE INDEX "UserAttendanceLog_userId_date_key" ON "UserAttendanceLog"("userId", "date");

-- CreateIndex
CREATE INDEX "AssignedSpecification_assignedToUserId_status_expiresAt_idx" ON "AssignedSpecification"("assignedToUserId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "AssignedSpecification_leadId_idx" ON "AssignedSpecification"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "SpecificationRequest_requestCode_key" ON "SpecificationRequest"("requestCode");

-- CreateIndex
CREATE INDEX "SpecificationRequest_requestedByUserId_status_idx" ON "SpecificationRequest"("requestedByUserId", "status");

-- CreateIndex
CREATE INDEX "SpecificationRequest_leadId_idx" ON "SpecificationRequest"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_itemCode_key" ON "InventoryItem"("itemCode");

-- CreateIndex
CREATE INDEX "InventoryItem_category_itemName_idx" ON "InventoryItem"("category", "itemName");

-- CreateIndex
CREATE INDEX "InventoryItem_warehouseLocation_idx" ON "InventoryItem"("warehouseLocation");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadItem" ADD CONSTRAINT "LeadItem_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadItem" ADD CONSTRAINT "LeadItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_salesRepresentativeId_fkey" FOREIGN KEY ("salesRepresentativeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorItem" ADD CONSTRAINT "VendorItem_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorItem" ADD CONSTRAINT "VendorItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequestItem" ADD CONSTRAINT "PurchaseRequestItem_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequestItem" ADD CONSTRAINT "PurchaseRequestItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQ" ADD CONSTRAINT "RFQ_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQResponse" ADD CONSTRAINT "RFQResponse_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQResponse" ADD CONSTRAINT "RFQResponse_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQResponseItem" ADD CONSTRAINT "RFQResponseItem_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "RFQResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQResponseItem" ADD CONSTRAINT "RFQResponseItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "GoodsReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "GoodsReceipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSpecification" ADD CONSTRAINT "ProductSpecification_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BOMRevision" ADD CONSTRAINT "BOMRevision_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BOMItem" ADD CONSTRAINT "BOMItem_bomRevisionId_fkey" FOREIGN KEY ("bomRevisionId") REFERENCES "BOMRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BOMItem" ADD CONSTRAINT "BOMItem_componentProductId_fkey" FOREIGN KEY ("componentProductId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BOMOperation" ADD CONSTRAINT "BOMOperation_bomRevisionId_fkey" FOREIGN KEY ("bomRevisionId") REFERENCES "BOMRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_bomRevisionId_fkey" FOREIGN KEY ("bomRevisionId") REFERENCES "BOMRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderItem" ADD CONSTRAINT "WorkOrderItem_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderItem" ADD CONSTRAINT "WorkOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityInspection" ADD CONSTRAINT "QualityInspection_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Installation" ADD CONSTRAINT "Installation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "Installation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorBill" ADD CONSTRAINT "VendorBill_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorBill" ADD CONSTRAINT "VendorBill_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
