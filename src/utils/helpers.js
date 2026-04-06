/**
 * Wrap an async route handler so we don't need try/catch in every controller.
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Build a standardised success response.
 */
export function successResponse(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Build a standardised paginated response.
 */
export function paginatedResponse(res, { items, total, page, limit }) {
  return res.status(200).json({
    success: true,
    data: items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
