import {
  checkApprovalStatus,
  getPendingUsers,
  getUserById,
  loginUser,
  logoutUser,
  registerUser,
  updateApprovalStatus,
} from "./auth.service.js";
import { loginSchema, registerSchema } from "./auth.schema.js";

export async function handleRegister(req, res, next) {
  try {
    const validatedData = registerSchema.parse(req.body);
    const user = await registerUser(validatedData);

    return res.status(201).json({
      success: true,
      message: "Registration successful. Your account is waiting for admin approval.",
      data: {
        user,
        approvalStatus: "PENDING",
        isPending: true,
      },
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || "Validation failed",
        errors: error.errors,
      });
    }
    next(error);
  }
}

export async function handleLogin(req, res, next) {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await loginUser(validatedData);

    if (result.token) {
      res.cookie("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.isPending
        ? "Account awaiting administrator approval"
        : "Login successful",
      data: result,
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || "Validation failed",
        errors: error.errors,
      });
    }
    next(error);
  }
}

export async function handleGetMe(req, res, next) {
  try {
    const user = await getUserById(req.user.id);
    return res.status(200).json({
      success: true,
      data: { ...user, user },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetStatus(req, res, next) {
  try {
    const email = req.query.email;
    const status = await checkApprovalStatus(email);
    return res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleLogout(req, res, next) {
  try {
    res.clearCookie("token");
    if (req.user?.id) {
      await logoutUser(req.user.id);
    }
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetPendingUsers(_req, res, next) {
  try {
    const pendingList = await getPendingUsers();
    return res.status(200).json({
      success: true,
      data: pendingList,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleApproveUser(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await updateApprovalStatus(id, "APPROVED");
    return res.status(200).json({
      success: true,
      message: "User successfully approved",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleRejectUser(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await updateApprovalStatus(id, "REJECTED");
    return res.status(200).json({
      success: true,
      message: "User registration rejected",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

// Development quick-approval helper (useful for demos and testing the approval loader transition)
export async function handleDevQuickApprove(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    const userRecord = await (await import("../../db/prisma.js")).default.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!userRecord) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const updatedUser = await updateApprovalStatus(userRecord.id, "APPROVED");

    return res.status(200).json({
      success: true,
      message: `User ${email} approved immediately for demo/testing!`,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}
