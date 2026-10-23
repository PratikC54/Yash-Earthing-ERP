import { prisma } from "../../db/prisma.js";

export async function listGoodsReceipts({
  page = 1,
  limit = 20,
  status,
  purchaseOrderId,
  search,
  sortBy = "receivedAt",
  sortOrder = "desc",
}) {
  const skip = (page - 1) * limit;
  const where = {};

  if (status) {
    where.status = status;
  }

  if (purchaseOrderId) {
    where.purchaseOrderId = purchaseOrderId;
  }

  if (search) {
    where.OR = [
      { grnNumber: { contains: search, mode: "insensitive" } },
      { notes: { contains: search, mode: "insensitive" } },
      { purchaseOrder: { poNumber: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [total, receipts] = await Promise.all([
    prisma.goodsReceipt.count({ where }),
    prisma.goodsReceipt.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        purchaseOrder: {
          select: {
            id: true,
            poNumber: true,
            status: true,
            vendor: {
              select: { id: true, code: true, name: true },
            },
          },
        },
        items: {
          include: {
            product: {
              select: { id: true, sku: true, name: true, unitOfMeasure: true },
            },
          },
        },
      },
    }),
  ]);

  return {
    receipts,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

export async function getGoodsReceiptById(id) {
  const receipt = await prisma.goodsReceipt.findUnique({
    where: { id },
    include: {
      purchaseOrder: {
        include: {
          vendor: {
            select: { id: true, code: true, name: true, phone: true },
          },
          items: true,
        },
      },
      items: {
        include: {
          product: {
            select: { id: true, sku: true, name: true, unitOfMeasure: true },
          },
        },
      },
      inventoryMovements: true,
    },
  });

  if (!receipt) {
    const error = new Error(`Goods Receipt with ID ${id} not found`);
    error.statusCode = 404;
    throw error;
  }

  return receipt;
}

export async function createGoodsReceipt({ purchaseOrderId, notes, items }) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: { items: true },
  });

  if (!po) {
    const error = new Error(`Purchase Order with ID ${purchaseOrderId} not found`);
    error.statusCode = 404;
    throw error;
  }

  if (po.status !== "SENT" && po.status !== "PARTIALLY_RECEIVED" && po.status !== "APPROVED") {
    const error = new Error(`Cannot receive goods for Purchase Order in ${po.status} status`);
    error.statusCode = 400;
    throw error;
  }

  // Validate items against PO items and quantities
  const itemsToCreate = [];
  for (const item of items) {
    const poItem = po.items.find((p) => p.productId === item.productId);
    if (!poItem) {
      const error = new Error(`Product ID ${item.productId} is not on Purchase Order ${po.poNumber}`);
      error.statusCode = 400;
      throw error;
    }

    const outstanding = Number(poItem.quantity) - Number(poItem.receivedQuantity);
    if (item.receivedQuantity > outstanding + 0.0001) {
      const error = new Error(
        `Received quantity (${item.receivedQuantity}) exceeds remaining ordered quantity (${outstanding}) for Product ID ${item.productId}`
      );
      error.statusCode = 400;
      throw error;
    }

    itemsToCreate.push({
      productId: item.productId,
      orderedQuantity: poItem.quantity,
      receivedQuantity: item.receivedQuantity,
      acceptedQuantity: 0,
      rejectedQuantity: 0,
      batchNumber: item.batchNumber || null,
    });
  }

  const grnNumber = `GRN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

  const createdGrn = await prisma.goodsReceipt.create({
    data: {
      grnNumber,
      purchaseOrderId,
      status: "UNDER_INSPECTION",
      notes: notes || null,
      items: {
        create: itemsToCreate,
      },
    },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, sku: true, name: true, unitOfMeasure: true },
          },
        },
      },
      purchaseOrder: {
        select: { id: true, poNumber: true, status: true },
      },
    },
  });

  return createdGrn;
}

export async function inspectAndPostGoodsReceipt(id, { status, notes, items, userId }) {
  const grn = await getGoodsReceiptById(id);

  if (grn.status === "ACCEPTED" || grn.status === "REJECTED" || grn.status === "PARTIALLY_ACCEPTED") {
    const error = new Error(`Goods Receipt ${grn.grnNumber} has already been inspected and posted (Status: ${grn.status})`);
    error.statusCode = 400;
    throw error;
  }

  return await prisma.$transaction(async (tx) => {
    let totalAccepted = 0;
    let totalRejected = 0;

    for (const inspection of items) {
      const existingItem = grn.items.find((i) => i.id === inspection.itemId);
      if (!existingItem) {
        const error = new Error(`Item ID ${inspection.itemId} not found on Goods Receipt ${grn.grnNumber}`);
        error.statusCode = 404;
        throw error;
      }

      const received = Number(existingItem.receivedQuantity);
      const accepted = Number(inspection.acceptedQuantity);
      const rejected = Number(inspection.rejectedQuantity);

      if (accepted + rejected > received + 0.0001) {
        const error = new Error(
          `Sum of accepted (${accepted}) and rejected (${rejected}) cannot exceed received quantity (${received}) for item ID ${inspection.itemId}`
        );
        error.statusCode = 400;
        throw error;
      }

      totalAccepted += accepted;
      totalRejected += rejected;

      // Update GoodsReceiptItem
      await tx.goodsReceiptItem.update({
        where: { id: inspection.itemId },
        data: {
          acceptedQuantity: accepted,
          rejectedQuantity: rejected,
          batchNumber: inspection.batchNumber || existingItem.batchNumber,
        },
      });

      // Post to Inventory & InventoryMovement if accepted > 0
      if (accepted > 0) {
        // Upsert Inventory
        const inventory = await tx.inventory.upsert({
          where: { productId: existingItem.productId },
          create: {
            productId: existingItem.productId,
            physicalQuantity: accepted,
            reservedQuantity: 0,
            reorderLevel: 10,
            warehouseLocation: "RM Store",
          },
          update: {
            physicalQuantity: {
              increment: accepted,
            },
          },
        });

        // Create InventoryMovement ledger record
        await tx.inventoryMovement.create({
          data: {
            productId: existingItem.productId,
            movementType: "STOCK_IN",
            referenceType: "GOODS_RECEIPT",
            referenceId: grn.id,
            goodsReceiptId: grn.id,
            quantity: accepted,
            batchNumber: inspection.batchNumber || existingItem.batchNumber || null,
            locationCode: inventory.warehouseLocation,
            notes: `Received and accepted via GRN ${grn.grnNumber}`,
            createdById: userId || null,
          },
        });

        // Update PurchaseOrderItem.receivedQuantity
        const poItem = grn.purchaseOrder.items.find((p) => p.productId === existingItem.productId);
        if (poItem) {
          await tx.purchaseOrderItem.update({
            where: { id: poItem.id },
            data: {
              receivedQuantity: {
                increment: accepted,
              },
            },
          });
        }
      }
    }

    // Determine final GRN status
    let finalGrnStatus = status;
    if (totalAccepted > 0 && totalRejected > 0) {
      finalGrnStatus = "PARTIALLY_ACCEPTED";
    } else if (totalAccepted > 0 && totalRejected === 0) {
      finalGrnStatus = "ACCEPTED";
    } else if (totalAccepted === 0 && totalRejected > 0) {
      finalGrnStatus = "REJECTED";
    }

    // Update GRN
    const updatedGrn = await tx.goodsReceipt.update({
      where: { id },
      data: {
        status: finalGrnStatus,
        notes: notes !== undefined ? notes : grn.notes,
        receivedById: userId || grn.receivedById,
      },
      include: {
        items: true,
      },
    });

    // Check PO completion status
    const allPoItems = await tx.purchaseOrderItem.findMany({
      where: { purchaseOrderId: grn.purchaseOrderId },
    });

    let allComplete = true;
    let anyReceived = false;

    for (const poItem of allPoItems) {
      if (Number(poItem.receivedQuantity) > 0) {
        anyReceived = true;
      }
      if (Number(poItem.receivedQuantity) < Number(poItem.quantity)) {
        allComplete = false;
      }
    }

    let poStatus = grn.purchaseOrder.status;
    if (allComplete) {
      poStatus = "RECEIVED";
    } else if (anyReceived) {
      poStatus = "PARTIALLY_RECEIVED";
    }

    if (poStatus !== grn.purchaseOrder.status) {
      await tx.purchaseOrder.update({
        where: { id: grn.purchaseOrderId },
        data: { status: poStatus },
      });
    }

    return {
      message: `Goods receipt ${grn.grnNumber} successfully inspected and stock posted`,
      goodsReceipt: updatedGrn,
      postedStockItemsCount: grn.items.length,
      updatedPurchaseOrderStatus: poStatus,
    };
  });
}
