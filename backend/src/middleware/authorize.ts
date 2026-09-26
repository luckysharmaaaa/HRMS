import { Request, Response, NextFunction, RequestHandler } from "express";
import { ApiError } from "../utils/apiError";
import { PermissionAction, userHasPermission } from "../services/permission.service";

/**
 * authorize("employee-list", "edit")
 *
 * Allows the request when ANY of the user's roles has that permission in
 * role_permissions. No role names are checked anywhere — the DB decides.
 */
export const authorize = (
  moduleSlug: string,
  action: PermissionAction,
): RequestHandler => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return next(ApiError.unauthorized("Access denied. Please log in."));
      }

      const allowed = await userHasPermission(userId, moduleSlug, action);

      if (!allowed) {
        return next(
          ApiError.forbidden("You do not have permission to perform this action"),
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};