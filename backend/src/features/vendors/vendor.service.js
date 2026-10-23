import { prisma } from "../../db/prisma.js";

export async function listVendors({
  page = 1,
  limit = 20,
  search,
  category,
  isActive,
  sortBy = "createdAt",
  sortOrder = "desc",
}) {
  const skip = (page - 1) * limit;
  const where = {};

  if (typeof isActive === "boolean") {
    where.isActive = isActive;
  }

  if (category) {
    where.category = { equals: category, mode: "insensitive" };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
      { contactName: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
      { gstin: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, vendors] = await Promise.all([
    prisma.vendor.count({ where }),
    prisma.vendor.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: {
          select: {
            vendorItems: true,
            purchaseOrders: true,
            rfqResponses: true,
          },
        },
      },
    }),
  ]);

  return {
    vendors,
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

export async function getVendorById(id) {
  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: {
      vendorItems: {
        include: {
          product: {
            select: { id: true, sku: true, name: true, unitOfMeasure: true },
          },
        },
      },
      _count: {
        select: {
          purchaseOrders: true,
          rfqResponses: true,
          vendorBills: true,
        },
      },
    },
  });

  if (!vendor) {
    const error = new Error(`Vendor with ID ${id} not found`);
    error.statusCode = 404;
    throw error;
  }

  return vendor;
}

export async function createVendor(data) {
  const existing = await prisma.vendor.findUnique({
    where: { code: data.code },
  });

  if (existing) {
    const error = new Error(`Vendor with code '${data.code}' already exists`);
    error.statusCode = 409;
    throw error;
  }

  return await prisma.vendor.create({
    data,
  });
}

export async function updateVendor(id, data) {
  const existing = await prisma.vendor.findUnique({
    where: { id },
  });

  if (!existing) {
    const error = new Error(`Vendor with ID ${id} not found`);
    error.statusCode = 404;
    throw error;
  }

  if (data.code && data.code !== existing.code) {
    const duplicate = await prisma.vendor.findUnique({
      where: { code: data.code },
    });
    if (duplicate) {
      const error = new Error(`Vendor with code '${data.code}' already exists`);
      error.statusCode = 409;
      throw error;
    }
  }

  return await prisma.vendor.update({
    where: { id },
    data,
  });
}

export async function softDeactivateVendor(id) {
  const existing = await prisma.vendor.findUnique({
    where: { id },
  });

  if (!existing) {
    const error = new Error(`Vendor with ID ${id} not found`);
    error.statusCode = 404;
    throw error;
  }

  // Toggle active state so users can reactivate deactivated vendors
  return await prisma.vendor.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });
}

export async function deleteVendorPermanently(id) {
  const existing = await prisma.vendor.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          purchaseOrders: true,
          rfqResponses: true,
        },
      },
    },
  });

  if (!existing) {
    const error = new Error(`Vendor with ID ${id} not found`);
    error.statusCode = 404;
    throw error;
  }

  // Prevent hard deletion if purchase orders exist (to preserve audit records)
  if (existing._count.purchaseOrders > 0 || existing._count.rfqResponses > 0) {
    const error = new Error(
      `Cannot permanently delete vendor with ${existing._count.purchaseOrders} existing purchase order(s). Please deactivate instead.`
    );
    error.statusCode = 400;
    throw error;
  }

  // Clean up dependent vendor items if any, then delete vendor
  return await prisma.$transaction(async (tx) => {
    await tx.vendorItem.deleteMany({ where: { vendorId: id } });
    return await tx.vendor.delete({ where: { id } });
  });
}
