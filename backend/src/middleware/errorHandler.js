export function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode ?? 500;

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    error: {
      message: statusCode >= 500 ? "Internal server error" : err.message,
    },
  });
}
