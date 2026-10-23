import prisma from "../../db/prisma.js";
import { comparePassword, generateToken, hashPassword } from "./auth.utils.js";

function sanitizeUser(user) {
  if (!user) return null;
  const safe = { ...user };
  delete safe.passwordHash;
  return safe;
}

export async function registerUser(input) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (existing) {
    const error = new Error("An account with this email already exists");
    error.statusCode = 409;
    throw error;
  }

  // Generate employeeCode if not provided
  let code = input.employeeCode;
  if (!code) {
    const count = await prisma.user.count();
    code = `EMP-${String(count + 1).padStart(3, "0")}`;
  }

  const passwordHash = await hashPassword(input.password);

  // New self-registered user defaults to PENDING approval
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      phone: input.phone || null,
      department: input.department || "Sales",
      designation: input.designation || "Sales Consultant",
      employeeCode: code,
      role: "SALES_CONSULTANT",
      approvalStatus: "PENDING",
      isActive: true,
      canEditPhoto: true,
      isLoggedIn: false,
    },
  });

  return sanitizeUser(user);
}

export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const isValidPassword = await comparePassword(password, user.passwordHash);
  if (!isValidPassword) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  // Check approval status
  if (user.approvalStatus === "PENDING") {
    return {
      isPending: true,
      approvalStatus: "PENDING",
      message: "Your registration is waiting for administrator approval.",
      user: sanitizeUser(user),
    };
  }

  if (user.approvalStatus === "REJECTED") {
    const error = new Error("Your account registration was rejected by the administrator.");
    error.statusCode = 403;
    error.approvalStatus = "REJECTED";
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("Your account has been deactivated. Please contact support.");
    error.statusCode = 403;
    throw error;
  }

  // Update isLoggedIn status
  await prisma.user.update({
    where: { id: user.id },
    data: { isLoggedIn: true },
  });

  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const token = generateToken(tokenPayload);

  return {
    isPending: false,
    approvalStatus: "APPROVED",
    token,
    user: sanitizeUser(user),
  };
}

export async function checkApprovalStatus(email) {
  if (!email) {
    const error = new Error("Email parameter is required");
    error.statusCode = 400;
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  let token = null;
  if (user.approvalStatus === "APPROVED") {
    token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });
  }

  return {
    email: user.email,
    name: user.name,
    approvalStatus: user.approvalStatus,
    isActive: user.isActive,
    role: user.role,
    token,
  };
}

export async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return sanitizeUser(user);
}

export async function getPendingUsers() {
  const pendingUsers = await prisma.user.findMany({
    where: { approvalStatus: "PENDING" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      department: true,
      designation: true,
      employeeCode: true,
      role: true,
      approvalStatus: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return pendingUsers;
}

export async function updateApprovalStatus(userId, status) {
  const updatedUser = await prisma.user.update({
    where: { id: Number(userId) },
    data: {
      approvalStatus: status,
      isActive: status !== "REJECTED",
    },
  });

  return sanitizeUser(updatedUser);
}

export async function logoutUser(userId) {
  if (userId) {
    await prisma.user.update({
      where: { id: Number(userId) },
      data: { isLoggedIn: false },
    }).catch(() => null);
  }
  return { success: true };
}
