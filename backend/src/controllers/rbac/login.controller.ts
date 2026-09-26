import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

import userModel from "../../models/user.model";
import authService from "../../services/auth.service";
import * as profileService from "../../services/profile.service";
import { deactivateActiveMediaUses } from "../../services/mediaUse.service";
import { pool } from "../../db/connection";
import { ApiError } from "../../utils/apiError";
import { isCompanyEmail, getCompanyEmailDomain } from "../../utils/Companyemail";

/**
 * POST /auth/login
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();

    const password = String(req.body?.password || "");

    if (!email || !password) {
      throw ApiError.badRequest("Email and password are required");
    }

    // Resolves to the right account whether the input is a company
    // email (users.email) or a registered personal email for an
    // employee who doesn't have a company email yet (users.alternateEmail,
    // only while email is still NULL).
    const user = await userModel.findLoginCandidate(email);

    if (!user || !user.password) {
      // Genuinely unrecognised: give the same guidance either way, without
      // revealing whether the address exists.
      throw ApiError.unauthorized(
        `Invalid email or password. Use your official company email (name@${getCompanyEmailDomain()}), or your registered personal email if you don't have one yet.`
      );
    }

    const passwordValid = await authService.comparePassword(
      password,
      user.password
    );

    if (!passwordValid) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    // Adjust according to your existing users.status implementation.
    if (String(user.status) !== "1") {
      throw ApiError.unauthorized("Your account is inactive");
    }

    const roles = await userModel.getUserRoles(user.id);

    if (!roles || roles.length === 0) {
      throw ApiError.unauthorized(
        "No role is assigned to this account"
      );
    }

    const tokens = authService.generateTokens(user, roles);

    await userModel.recordLogin(user.id);

    const safeUser = { ...user } as Record<string, unknown>;
    delete safeUser.password;

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: safeUser,
        roles,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/refresh-token
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      throw ApiError.badRequest("Refresh token is required");
    }

    const payload = authService.verifyRefreshToken(token);

    const user = await userModel.findUserById(payload.userId);

    if (!user) {
      throw ApiError.unauthorized("User not found");
    }

    if (String(user.status) !== "1") {
      throw ApiError.unauthorized("Your account is inactive");
    }

    // A token issued for an account that has lost access (company email
    // removed, and no pending alternate email either) must not renew.
    if (!isCompanyEmail(user.email) && !user.alternateEmail) {
      throw ApiError.unauthorized("Please sign in with your company email.");
    }

    const roles = await userModel.getUserRoles(user.id);

    if (!roles || roles.length === 0) {
      throw ApiError.unauthorized(
        "No role is assigned to this account"
      );
    }

    const tokens = authService.generateTokens(user, roles);

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/logout
 */
export const logout = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /auth/me
 */
export const me = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw ApiError.unauthorized("Access denied. Please log in.");
    }

    const profile = await profileService.getMyProfile(userId);

    if (!profile) {
      throw ApiError.notFound("User profile not found");
    }

    res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /auth/profile
 */
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const connection = await pool.getConnection();

  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw ApiError.unauthorized("Access denied. Please log in.");
    }

    await connection.beginTransaction();

    const {
      firstName,
      lastName,
      email,
      phone,
      address,
    } = req.body;

    // Check duplicate email only when email is being changed.
    if (email) {
      const normalizedEmail = String(email)
        .trim()
        .toLowerCase();

      // The sign-in identity must stay on the company domain.
      if (!isCompanyEmail(normalizedEmail)) {
        throw ApiError.badRequest(
          `Email must be a company address (name@${getCompanyEmailDomain()}).`
        );
      }

      const existingUser = await userModel.findByEmail(
        normalizedEmail,
        {
          includePassword: false,
          transaction: connection,
        }
      );

      if (existingUser && existingUser.id !== userId) {
        throw ApiError.conflict(
          "Email address is already in use"
        );
      }
    }

    await userModel.updateProfile(
      userId,
      {
        firstName,
        lastName,
        email: email
          ? String(email).trim().toLowerCase()
          : undefined,
        phone: phone ?? undefined,
      },
      userId,
      connection
    );

    if (address) {
      await profileService.upsertUserAddress(
        connection,
        userId,
        address,
        userId
      );
    }

    await connection.commit();

    const profile = await profileService.getMyProfile(userId);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: profile,
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * POST /auth/change-password
 */
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw ApiError.unauthorized("Access denied. Please log in.");
    }

    const {
      currentPassword,
      newPassword,
    } = req.body;

    if (!currentPassword || !newPassword) {
      throw ApiError.badRequest(
        "Current password and new password are required"
      );
    }

    const currentHash =
      await userModel.getUserPasswordById(userId);

    if (!currentHash) {
      throw ApiError.unauthorized(
        "Unable to verify current password"
      );
    }

    const valid = await authService.comparePassword(
      currentPassword,
      currentHash
    );

    if (!valid) {
      throw ApiError.unauthorized(
        "Current password is incorrect"
      );
    }

    if (currentPassword === newPassword) {
      throw ApiError.badRequest(
        "New password must be different from the current password"
      );
    }

    const newHash =
      await authService.hashPassword(newPassword);

    await userModel.updatePassword(
      userId,
      newHash,
      userId
    );

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/forgot-password
 *
 * Development implementation:
 * Generates a secure reset token and returns the reset URL.
 *
 * Production:
 * Send the reset URL through email instead of returning it.
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      throw ApiError.badRequest("Email is required");
    }

    // Same generic response either way, so nothing about which accounts
    // exist (or which email type they used) is revealed.
    const user = isCompanyEmail(email)
      ? await userModel.findByEmail(email)
      : await userModel.findByAlternateEmail(email);

    /*
     * Do not reveal whether an email exists.
     */
    if (!user) {
      res.status(200).json({
        success: true,
        message:
          "If an account exists for this email, a password reset link has been generated.",
      });
      return;
    }

    const rawToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // 30 minutes
    const expiresAt = new Date(
      Date.now() + 30 * 60 * 1000
    );

    await pool.query(
      `
        INSERT INTO password_reset_tokens
        (
          userId,
          tokenHash,
          expiresAt
        )
        VALUES (?, ?, ?)
      `,
      [user.id, tokenHash, expiresAt]
    );

    const frontendUrl =
      process.env.FRONTEND_URL ||
      "http://localhost:5173";

    const resetUrl =
      `${frontendUrl}/reset-password?token=${rawToken}`;

    /*
     * Development only.
     * Replace this with email delivery in production.
     */
    res.status(200).json({
      success: true,
      message:
        "If an account exists for this email, a password reset link has been generated.",
      data:
        process.env.NODE_ENV !== "production"
          ? {
              resetToken: rawToken,
              resetUrl,
            }
          : undefined,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/reset-password
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const connection = await pool.getConnection();

  try {
    const {
      token,
      password,
    } = req.body;

    if (!token || !password) {
      throw ApiError.badRequest(
        "Reset token and password are required"
      );
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(String(token))
      .digest("hex");

    const [rows] = await connection.query(
      `
        SELECT
          id,
          userId,
          expiresAt,
          usedAt
        FROM password_reset_tokens
        WHERE tokenHash = ?
        LIMIT 1
      `,
      [tokenHash]
    );

    const tokenRows = rows as Array<{
      id: number;
      userId: number;
      expiresAt: Date;
      usedAt: Date | null;
    }>;

    const resetRecord = tokenRows[0];

    if (!resetRecord) {
      throw ApiError.badRequest(
        "Invalid or expired reset token"
      );
    }

    if (resetRecord.usedAt) {
      throw ApiError.badRequest(
        "This reset token has already been used"
      );
    }

    if (
      new Date(resetRecord.expiresAt).getTime() <
      Date.now()
    ) {
      throw ApiError.badRequest(
        "Invalid or expired reset token"
      );
    }

    const hashedPassword =
      await authService.hashPassword(password);

    await connection.beginTransaction();

    await userModel.updatePassword(
      resetRecord.userId,
      hashedPassword,
      resetRecord.userId,
      connection
    );

    await connection.query(
      `
        UPDATE password_reset_tokens
        SET usedAt = ?
        WHERE id = ?
      `,
      [new Date(), resetRecord.id]
    );

    /*
     * Invalidate any other active reset tokens
     * for this user.
     */
    await connection.query(
      `
        UPDATE password_reset_tokens
        SET usedAt = ?
        WHERE userId = ?
          AND usedAt IS NULL
          AND id <> ?
      `,
      [
        new Date(),
        resetRecord.userId,
        resetRecord.id,
      ]
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * POST /auth/profile/photo
 */
export const uploadProfilePhoto = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const connection = await pool.getConnection();

  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw ApiError.unauthorized(
        "Access denied. Please log in."
      );
    }

    if (!req.file) {
      throw ApiError.badRequest(
        "Profile photo is required"
      );
    }

    await connection.beginTransaction();

    const result =
      await profileService.replaceProfilePhoto(
        connection,
        userId,
        req.file
      );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: "Profile photo updated successfully",
      data: result,
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * DELETE /auth/profile/photo
 */
export const removeProfilePhoto = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const connection = await pool.getConnection();

  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw ApiError.unauthorized(
        "Access denied. Please log in."
      );
    }

    await connection.beginTransaction();

    await deactivateActiveMediaUses(connection, {
      objectType: "user",
      objectID: userId,
    });

    await connection.commit();

    res.status(200).json({
      success: true,
      message: "Profile photo removed successfully",
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};