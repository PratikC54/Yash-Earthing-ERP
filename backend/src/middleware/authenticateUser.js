import prisma from "../db/prisma.js";
import { ApiError } from "../utils/apiResponse.js";
import { verifyToken } from "../utils/jwt.js";

/**
 * Authentication middleware for Yash ERP.
 * Supports:
 * 1. Bearer JWT tokens in Authorization header
 * 2. Session IDs or JWT tokens via Cookie (sessionId / token)
 * 3. x-user-id / x-mock-role headers for test environments
 */
export async function authenticateUser(req, _res, next) {
  try {
    let user = null;

    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
    const jwtCookie = req.cookies?.token;
    const sessionId = req.cookies?.sessionId;
    const jwt = bearerToken || jwtCookie;

    if (authHeader && !bearerToken) {
      return next(ApiError.unauthorized("Authorization header must use the Bearer scheme."));
    }

    if (jwt) {
      const verified = verifyToken(jwt);
      if (!verified) {
        return next(ApiError.unauthorized("Invalid authentication token."));
      }
      if (verified.expired) {
        return next(
          ApiError.unauthorized("Authentication token has expired. Please log in again.")
        );
      }

      const userId = Number(verified.id);
      if (!Number.isInteger(userId) || userId <= 0) {
        return next(ApiError.unauthorized("Authentication token has invalid user claims."));
      }

      user = await prisma.user.findUnique({
        where: { id: userId },
      });
    } else if (sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (session && !session.revokedAt && session.expiresAt > new Date()) {
        user = await prisma.user.findUnique({
          where: { id: session.userId },
        });
      }
    }

    // Test-only fallback for internal calls that identify a database user.
    if (!user && process.env.NODE_ENV === "test" && req.headers["x-user-id"]) {
      const devUserId = parseInt(req.headers["x-user-id"], 10);
      if (!isNaN(devUserId)) {
        user = await prisma.user.findUnique({
          where: { id: devUserId },
        });
      }
    }

    // Test-only mock identity; production requests must resolve a database user.
    if (!user && process.env.NODE_ENV === "test" && req.headers["x-mock-role"]) {
      user = {
        id: parseInt(req.headers["x-mock-user-id"] || "1", 10),
        name: req.headers["x-mock-user-name"] || "Test User",
        email: "test@yashgroup.com",
        role: req.headers["x-mock-role"],
        permissions: ["*"],
        isActive: true,
      };
    }

    if (!user) {
      return next(
        ApiError.unauthorized("Authentication required. Please provide a valid Bearer token or session.")
      );
    }

    if (!user.isActive) {
      return next(
        ApiError.forbidden("User account is inactive. Please contact your system administrator.")
      );
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export default authenticateUser;
