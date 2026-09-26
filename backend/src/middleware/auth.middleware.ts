import { Request, Response, NextFunction, RequestHandler } from "express";
import { RowDataPacket } from "mysql2";
import { pool } from "../db/connection";
import { verifyAccessToken } from "../utils/jwt";
import { ApiError } from "../utils/apiError";
import { isCompanyEmail } from "../utils/Companyemail";
import { AuthenticatedUser } from "../types";

export const authenticate: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // =====================================
    // Authorization Header
    // =====================================

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next(ApiError.unauthorized("Access denied. Please log in."));
    }

    if (!authHeader.startsWith("Bearer ")) {
      return next(ApiError.unauthorized("Access denied. Please log in."));
    }

    // =====================================
    // Extract Token
    // =====================================

    const token = authHeader.split(" ")[1];

    if (!token) {
      return next(
        ApiError.unauthorized("Authentication required. Please sign in."),
      );
    }

    // =====================================
    // Verify Token
    // =====================================

    const payload = verifyAccessToken(token);

    if (!payload || !payload.userId) {
      return next(ApiError.unauthorized("Invalid token payload."));
    }

    // =====================================
    // Get User
    // =====================================

    const [users] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        id,
        email,
        alternateEmail,
        status
      FROM users
      WHERE id = ?
        AND trashedAt IS NULL
      LIMIT 1
      `,
      [payload.userId],
    );

    if (users.length === 0) {
      return next(ApiError.unauthorized("User not found. Please login again."));
    }

    const user = users[0];

    // =====================================
    // Check User Status
    // =====================================

    if (Number(user.status) === 0) {
      return next(
        ApiError.unauthorized(
          "Your account is inactive. Please contact administrator.",
        ),
      );
    }

    // =====================================
    // Company email OR a still-pending alternate email
    // =====================================
    // An account keeps access if it either has the company email, or is a
    // new employee whose company email hasn't been assigned yet (email is
    // NULL and they have a registered alternate email). Once email is
    // assigned it must be the company domain — anything else is rejected.
    const hasValidAccess =
      isCompanyEmail(user.email) || (!user.email && user.alternateEmail);

    if (!hasValidAccess) {
      return next(
        ApiError.unauthorized("Please sign in with your company email."),
      );
    }

    // =====================================
    // Attach User
    // =====================================

    const authenticatedUser: AuthenticatedUser = {
      userId: user.id,
      email: user.email,
      clientId: payload.clientId,
      roleId: payload.roleId,
      roleSlug: payload.roleSlug,
      level: payload.level,
    };

    req.user = authenticatedUser;

    next();
  } catch (error) {
    console.error("Authentication Error:", error);

    return next(
      ApiError.unauthorized("Invalid or expired authentication token."),
    );
  }
};