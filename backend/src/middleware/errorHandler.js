export function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode ?? 500;
  let userMessage = err.message || "An unexpected error occurred. Please try again.";

  // Prisma Unique Constraint violation (P2002)
  if (err.code === "P2002") {
    statusCode = 400;
    const target = Array.isArray(err.meta?.target) ? err.meta.target.join(", ") : (err.meta?.target || "record");
    userMessage = `A duplicate entry already exists for ${target}. Please use an existing record or a revised sequence.`;
  } else if (err.code === "P2003") {
    statusCode = 400;
    userMessage = "Operation failed because a related linked record is missing or required.";
  } else if (err.code === "P2025") {
    statusCode = 404;
    userMessage = "The requested item was not found or has already been updated.";
  } else if (statusCode >= 500) {
    console.error("Internal Error:", err);
    userMessage = err.message && !err.message.includes("\n")
      ? err.message
      : "The application encountered a processing issue. Please check the inputs and try again.";
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

  res.status(statusCode).json({
    success: false,
    message: userMessage,
    error: {
      message: userMessage,
    },
    ...(err.errors ? { errors: err.errors } : {}),
  });
}
