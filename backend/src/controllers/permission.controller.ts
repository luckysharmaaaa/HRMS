import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { getUserPermissionKeys } from "../services/permission.service";

/**
 * GET /auth/me/permissions
 *
 * Returns the logged-in user's permissions as "slug:action" keys, merged
 * across all their roles. Needs no module/role permission itself, so every
 * authenticated user (including Employee) can load their own menu.
 */
export const getMyPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw ApiError.unauthorized("Access denied. Please log in.");
    }

    const permissions = await getUserPermissionKeys(userId);

    res.status(200).json({
      success: true,
      message: "Permissions fetched",
      data: { permissions },
    });
  } catch (error) {
    next(error);
  }
};