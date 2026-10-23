export function getPaginationParams(query, defaultLimit = 20, maxLimit = 100) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const rawLimit = parseInt(query.limit, 10) || defaultLimit;
  const limit = Math.min(Math.max(1, rawLimit), maxLimit);
  const skip = (page - 1) * limit;

  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder && query.sortOrder.toLowerCase() === "asc" ? "asc" : "desc";

  return {
    page,
    limit,
    skip,
    take: limit,
    sortBy,
    sortOrder,
  };
}

export function formatPaginatedResult({ data, total, page, limit }) {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    data,
    pagination: {
      page,
      limit,
      totalItems: total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}
