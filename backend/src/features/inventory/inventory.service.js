import { prisma } from "../../db/prisma.js";

export async function listInventory({
  page = 1,
  limit = 20,
  lowStockOnly = false,
  search,
  sortBy = "updatedAt",
  sortOrder = "desc",
}) {
  const where = {};

  if (search) {
    where.product = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  // Fetch all matching candidates to accurately compute derived available stock
  const allInventories = await prisma.inventory.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    include: {
      product: {
        select: {
          id: true,
          sku: true,
          name: true,
          unitOfMeasure: true,
          listPrice: true,
        },
      },
    },
  });

  // Calculate derived values: availableQuantity = physicalQuantity - reservedQuantity
  let mapped = allInventories.map((inv) => {
    const physical = Number(inv.physicalQuantity);
    const reserved = Number(inv.reservedQuantity);
    const available = physical - reserved;
    const reorder = Number(inv.reorderLevel);
    const isLowStock = available <= reorder;

    return {
      id: inv.id,
      productId: inv.productId,
      warehouseLocation: inv.warehouseLocation,
      unitCost: Number(inv.unitCost),
      physicalQuantity: physical,
      reservedQuantity: reserved,
      availableQuantity: available,
      reorderLevel: reorder,
      isLowStock,
      updatedAt: inv.updatedAt,
      product: inv.product,
    };
  });

  if (lowStockOnly) {
    mapped = mapped.filter((item) => item.isLowStock);
  }

  const total = mapped.length;
  const skip = (page - 1) * limit;
  const paginated = mapped.slice(skip, skip + limit);

  return {
    inventory: paginated,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

export async function getInventoryByProductId(productId) {
  const inv = await prisma.inventory.findUnique({
    where: { productId },
    include: {
      product: true,
    },
  });

  if (!inv) {
    const error = new Error(`Inventory record for Product ID ${productId} not found`);
    error.statusCode = 404;
    throw error;
  }

  const physical = Number(inv.physicalQuantity);
  const reserved = Number(inv.reservedQuantity);
  const available = physical - reserved;
  const reorder = Number(inv.reorderLevel);

  const recentMovements = await prisma.inventoryMovement.findMany({
    where: { productId },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  return {
    id: inv.id,
    productId: inv.productId,
    warehouseLocation: inv.warehouseLocation,
    unitCost: Number(inv.unitCost),
    physicalQuantity: physical,
    reservedQuantity: reserved,
    availableQuantity: available,
    reorderLevel: reorder,
    isLowStock: available <= reorder,
    updatedAt: inv.updatedAt,
    product: inv.product,
    recentMovements,
  };
}

export async function listMovements({
  page = 1,
  limit = 20,
  productId,
  movementType,
  search,
  sortBy = "createdAt",
  sortOrder = "desc",
}) {
  const skip = (page - 1) * limit;
  const where = {};

  if (productId) {
    where.productId = productId;
  }

  if (movementType) {
    where.movementType = movementType;
  }

  if (search) {
    where.OR = [
      { batchNumber: { contains: search, mode: "insensitive" } },
      { notes: { contains: search, mode: "insensitive" } },
      { product: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [total, movements] = await Promise.all([
    prisma.inventoryMovement.count({ where }),
    prisma.inventoryMovement.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        product: {
          select: { id: true, sku: true, name: true, unitOfMeasure: true },
        },
      },
    }),
  ]);

  return {
    movements,
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

export async function recordInventoryAdjustment({ productId, movementType, quantity, notes, batchNumber, userId }) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    const error = new Error(`Product with ID ${productId} not found`);
    error.statusCode = 404;
    throw error;
  }

  return await prisma.$transaction(async (tx) => {
    let inv = await tx.inventory.findUnique({
      where: { productId },
    });

    if (!inv) {
      inv = await tx.inventory.create({
        data: {
          productId,
          physicalQuantity: 0,
          reservedQuantity: 0,
          reorderLevel: 10,
          warehouseLocation: "RM Store",
        },
      });
    }

    const physical = Number(inv.physicalQuantity);
    const reserved = Number(inv.reservedQuantity);
    const available = physical - reserved;

    let updateData = {};

    if (movementType === "RESERVATION") {
      if (quantity > available) {
        const error = new Error(
          `Cannot reserve ${quantity} units. Only ${available} available (Physical: ${physical}, Reserved: ${reserved})`
        );
        error.statusCode = 400;
        throw error;
      }
      updateData = {
        reservedQuantity: {
          increment: quantity,
        },
      };
    } else if (movementType === "RELEASE_RESERVATION") {
      if (quantity > reserved) {
        const error = new Error(
          `Cannot release ${quantity} reserved units. Only ${reserved} units currently reserved`
        );
        error.statusCode = 400;
        throw error;
      }
      updateData = {
        reservedQuantity: {
          decrement: quantity,
        },
      };
    } else if (movementType === "ADJUSTMENT") {
      // Direct physical adjustment
      updateData = {
        physicalQuantity: {
          increment: quantity,
        },
      };
    }

    const updatedInv = await tx.inventory.update({
      where: { productId },
      data: updateData,
    });

    const movement = await tx.inventoryMovement.create({
      data: {
        productId,
        movementType,
        referenceType: "MANUAL",
        quantity,
        batchNumber: batchNumber || null,
        locationCode: updatedInv.warehouseLocation,
        notes: notes || `Manual ${movementType}`,
        createdById: userId || null,
      },
    });

    return {
      message: `Inventory updated successfully with movement ${movementType}`,
      inventory: {
        ...updatedInv,
        availableQuantity: Number(updatedInv.physicalQuantity) - Number(updatedInv.reservedQuantity),
      },
      movement,
    };
  });
}

export async function checkStockAvailability(productId) {
  const pId = Number(productId);
  const inv = await prisma.inventory.findFirst({
    where: { productId: pId },
    include: { product: true },
  });

  const onHand = inv ? Number(inv.physicalQuantity) : 0;
  const reserved = inv ? Number(inv.reservedQuantity) : 0;
  const available = Math.max(0, onHand - reserved);

  return {
    productId: pId,
    productName: inv?.product?.name || null,
    sku: inv?.product?.sku || null,
    onHand,
    reserved,
    available,
  };
}
