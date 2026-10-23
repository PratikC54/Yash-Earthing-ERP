import prisma from "../../db/prisma.js";
import { verifyToken } from "./auth.utils.js";

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please sign in to access this feature.",
      });
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        designation: true,
        approvalStatus: true,
        isActive: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Your session has expired. Please sign in again.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is deactivated. Please contact administrator.",
      });
    }

    if (user.approvalStatus === "PENDING") {
      return res.status(403).json({
        success: false,
        approvalStatus: "PENDING",
        message: "Your account is awaiting administrator approval.",
      });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Session expired or invalid. Please sign in again.",
    });
  }
}

export function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Please sign in to perform this action.",
      });
    }

    // ADMIN has universal access
    if (req.user.role === "ADMIN") {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      const roleDisplay = allowedRoles.map((r) => r.replace("_", " ")).join(" or ");
      return res.status(403).json({
        success: false,
        message: `Permission denied. Only ${roleDisplay} can perform this action. Your current role is ${req.user.role.replace("_", " ")}.`,
      });
    }

    next();
  };
}

export function requireAdmin(req, res, next) {
  return requireRoles("ADMIN")(req, res, next);
}
