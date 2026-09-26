import { Router } from "express";
import * as rolePermissionsController from "../../controllers/rbac/role_permissions.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize";

const router = Router();

router.use(authenticate);

// Managing role permissions is part of the "roles" module:
//   view -> read a role's permissions, edit -> change them.

// GET    /role-permissions/:roleId — list active permissions for a role
router.get(
  "/:roleId",
  authorize("roles", "view"),
  rolePermissionsController.listPermissionsByRole,
);

// POST   /role-permissions/sync — replace full set of permissions for a role
router.post(
  "/sync",
  authorize("roles", "edit"),
  rolePermissionsController.syncRolePermissions,
);

// DELETE /role-permissions/:id — soft-delete a single permission
router.delete(
  "/:id",
  authorize("roles", "edit"),
  rolePermissionsController.deletePermission,
);

export default router;