export class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errors = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = "Unauthorized access") {
    return new ApiError(401, message);
  }

  static forbidden(message = "Forbidden: Insufficient permissions") {
    return new ApiError(403, message);
  }

  static notFound(message = "Resource not found") {
    return new ApiError(404, message);
  }

  static conflict(message = "Resource conflict") {
    return new ApiError(409, message);
  }

  static unprocessable(message = "Unprocessable entity", errors = []) {
    return new ApiError(422, message, errors);
  }

  static internal(message = "Internal server error") {
    return new ApiError(500, message);
  }
}

export function sendSuccess(res, { statusCode = 200, message = "Success", data = null, pagination = undefined } = {}) {
  const response = {
    success: true,
    message,
    data,
  };

  if (pagination !== undefined) {
    response.pagination = pagination;
  }

  return res.status(statusCode).json(response);
}

export function sendCreated(res, { message = "Resource created successfully", data = null } = {}) {
  return sendSuccess(res, { statusCode: 201, message, data });
}
