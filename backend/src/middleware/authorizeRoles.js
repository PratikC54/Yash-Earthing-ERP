import { ApiError } from "../utils/apiResponse.js";

/**
 * Role-Based Access Control (RBAC) middleware.
 * Verifies that the authenticated user possesses one of the allowed roles.
 * Admins are permitted by default unless explicitly restricted.
 *
 * @param  {...string} allowedRoles - Role enum strings from UserRole
 */
export function authorizeRoles(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required"));
    }

    const userRole = req.user.role;

    // ADMIN has universal override privileges
    if (userRole === "ADMIN") {
      return next();
    }

    if (!allowedRoles.includes(userRole)) {
      return next(
        ApiError.forbidden(
          `Access denied. Role '${userRole}' is not authorized for this operation. Required: [${allowedRoles.join(", ")}]`
        )
      );
    }

    next();
  };
}

export default authorizeRoles;
