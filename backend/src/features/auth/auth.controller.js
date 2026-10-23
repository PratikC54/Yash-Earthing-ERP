import bcrypt from "bcrypt";
import crypto from "node:crypto";
import prisma from "../../db/prisma.js";
import { AuditService } from "../../services/audit.service.js";
import { ApiError, sendSuccess } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { signToken } from "../../utils/jwt.js";

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: email.trim(),
        mode: "insensitive",
      },
    },
  });

  if (!user) {
    throw ApiError.unauthorized("Invalid email or password.");
  }

  if (!user.isActive) {
    throw ApiError.forbidden("User account is inactive. Please contact your system administrator.");
  }

  // Check password with bcrypt or fallback for dev seeds
  let isPasswordValid = false;
  if (user.passwordHash?.startsWith("$2")) {
    isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  } else {
    isPasswordValid =
      user.passwordHash === password ||
      (user.passwordHash === "dummyhash" &&
        ["admin123", "password", "admin", "dummyhash"].includes(password));

    // Upgrade to strong bcrypt hash on successful match
    if (isPasswordValid) {
      const newHash = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });
    }
  }

  if (!isPasswordValid) {
    throw ApiError.unauthorized("Invalid email or password.");
  }

  // 1. Generate standard JWT
  const token = signToken({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  // 2. Establish server-side session
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      expiresAt,
      userAgent: req.headers["user-agent"] || null,
      ipAddress: req.ip || null,
    },
  });

  // 3. Set secure cookies
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };

  res.cookie("token", token, cookieOptions);
  res.cookie("sessionId", sessionId, cookieOptions);

  // 4. Update user active status & audit
  await prisma.user.update({
    where: { id: user.id },
    data: { isLoggedIn: true },
  });

  await AuditService.record({
    userId: user.id,
    action: "USER_LOGIN",
    entityType: "User",
    entityId: user.id,
    ipAddress: req.ip,
  });

  return sendSuccess(res, {
    message: "Login successful",
    data: {
      token,
      sessionId,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        avatarUrl: user.avatarUrl,
      },
    },
  });
});

export const logout = asyncHandler(async (req, res) => {
  const sessionId = req.cookies?.sessionId;

  // Clear cookies
  res.clearCookie("token", { path: "/" });
  res.clearCookie("sessionId", { path: "/" });

  // Revoke session if session ID is known
  if (sessionId) {
    await prisma.session.updateMany({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  if (req.user?.id) {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { isLoggedIn: false },
    });

    await AuditService.record({
      userId: req.user.id,
      action: "USER_LOGGED_OUT",
      entityType: "User",
      entityId: req.user.id,
      ipAddress: req.ip,
    });
  }

  return sendSuccess(res, {
    message: "Logged out successfully",
  });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return sendSuccess(res, {
    message: "Authenticated user retrieved successfully",
    data: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      department: req.user.department,
      designation: req.user.designation,
      avatarUrl: req.user.avatarUrl,
    },
  });
});
