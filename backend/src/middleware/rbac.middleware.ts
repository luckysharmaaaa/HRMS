import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import permissionModel from '../models/permission.model';

/**
 * Dynamic RBAC Middleware
 * Checks if the current user (authenticated) has permission to perform
 * an action on a specific module.
 *
 * Supports:
 * 1. Super Admin bypass (level 100)
 * 2. Role-based permissions
 * 3. User-specific permission overrides
 * 4. Multi-client scoping
 */
export const authorize = (moduleSlug: string, actionSlug: string) => {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) {
                throw ApiError.unauthorized();
            }

            const { userId, roleId, level } = req.user;

            // 1. Super Admin Bypass
            if (level >= 100 || req.user.roleSlug === 'super_admin') {
                return next();
            }

            // 2. Query permissions for this user (direct) or their role
            const sql = `
                SELECT p.*
                FROM permissions p
                JOIN modules m ON p.module_id = m.id
                JOIN actions a ON p.action_id = a.id
                WHERE (p.role_id = ? OR p.user_id = ?)
                  AND m.slug = ?
                  AND a.slug = ?
                  AND m.is_active = 1
            `;

            const perms = await permissionModel.raw<any[]>(sql, [roleId, userId, moduleSlug, actionSlug]);

            if (!perms || perms.length === 0) {
                throw ApiError.forbidden(`You do not have permission to ${actionSlug} on ${moduleSlug}`);
            }

            // 3. Simple ABAC / Scope Check (extensible)
            const permission = perms[0];

            // Attach scope/conditions to the request for the controller to use
            (req as any).permission = {
                scope: permission.scope,
                conditions: permission.conditions,
            };

            next();
        } catch (error) {
            next(error);
        }
    };
};
