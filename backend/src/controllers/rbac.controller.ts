import { Request, Response, NextFunction } from 'express';
import roleModel from '../models/role.model';
import moduleModel from '../models/module.model';
import actionModel from '../models/action.model';
import permissionModel from '../models/permission.model';
import userClientRoleModel from '../models/userClientRole.model';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

/**
 * Roles Management
 */
export const listRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as unknown as AuthRequest;
        if (!authReq.user) throw ApiError.unauthorized();
        
        const { clientId } = authReq.user;
        // List roles for the current client or system roles
        const roles = await roleModel.findAll({ 
            where: { client_id: clientId || null } 
        });
        sendSuccess(res, 'Roles retrieved', roles);
    } catch (error) {
        next(error);
    }
};

export const createRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as unknown as AuthRequest;
        if (!authReq.user) throw ApiError.unauthorized();

        const { name, slug, description, level, parentRoleId } = req.body;
        const { clientId } = authReq.user;

        // Prevent creating roles with higher level than requester
        if ((level as number) >= authReq.user.level && authReq.user.roleSlug !== 'super_admin') {
            throw ApiError.forbidden('Cannot create a role with a level higher or equal to your own');
        }

        const role = await roleModel.create({
            name: name as string,
            slug: slug as string,
            description: description as string,
            level: (level as number) || 10,
            parent_role_id: parentRoleId as number,
            client_id: clientId as number,
        });

        sendSuccess(res, 'Role created', role, 201);
    } catch (error) {
        next(error);
    }
};

/**
 * Permissions Management
 */
export const getRolePermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { roleId } = req.params;
        const permissions = await permissionModel.getEffectivePermissions(parseInt(roleId, 10));
        sendSuccess(res, 'Permissions retrieved', permissions);
    } catch (error) {
        next(error);
    }
};

export const assignPermission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { roleId, moduleId, actionId, scope, conditions } = req.body;

        const permission = await permissionModel.create({
            role_id: roleId as number,
            module_id: moduleId as number,
            action_id: actionId as number,
            scope: (scope as string) || 'client',
            conditions: (conditions as any) || {},
        });

        sendSuccess(res, 'Permission assigned', permission, 201);
    } catch (error) {
        next(error);
    }
};

/**
 * User Role Assignment
 */
export const assignUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as unknown as AuthRequest;
        if (!authReq.user) throw ApiError.unauthorized();

        const { userId, roleId, clientId, isDefault } = req.body;

        // Verify role exists and requester has level authority
        const role = await roleModel.findById(parseInt(roleId, 10));
        if (!role) throw ApiError.notFound('Role not found');
        
        if ((role.level as number) >= authReq.user.level && authReq.user.roleSlug !== 'super_admin') {
            throw ApiError.forbidden('Cannot assign a role with higher or equal level than your own');
        }

        const assignment = await userClientRoleModel.create({
            user_id: userId as number,
            client_id: (clientId as number) || authReq.user.clientId,
            role_id: roleId as number,
            is_default: (isDefault as boolean) || false,
        });

        sendSuccess(res, 'User-Role assignment created', assignment, 201);
    } catch (error) {
        next(error);
    }
};

/**
 * Metadata Helpers
 */
export const listModulesAndActions = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [modules, actions] = await Promise.all([
            moduleModel.findAll({ where: { is_active: true }, orderBy: 'sort_order' }),
            actionModel.findAll()
        ]);
        sendSuccess(res, 'Modules and actions retrieved', { modules, actions });
    } catch (error) {
        next(error);
    }
};
