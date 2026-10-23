export function errorHandler(err, _req, res, _next) {
  const statusCode =
    err.message === "Origin not allowed by CORS" ? 403 : err.statusCode ?? 500;

  if (statusCode >= 500) {
    console.error(err);
  }

  const message = statusCode >= 500 ? "Internal server error" : err.message;
  const response = {
    success: false,
    message,
    error: { message },
  };

  if (err.errors) {
    response.errors = err.errors;
  }

  res.status(statusCode).json(response);
}
