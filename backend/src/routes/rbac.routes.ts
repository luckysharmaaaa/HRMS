import { Router } from "express";
import * as rbacController from "../controllers/rbac.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";

const router = Router();

// All RBAC management routes are protected
router.use(authenticate);

// Role Management
router.get("/roles", authorize("roles", "read"), rbacController.listRoles);
router.post("/roles", authorize("roles", "create"), rbacController.createRole);

// Permission Management
router.get(
  "/roles/:roleId/permissions",
  authorize("roles", "read"),
  rbacController.getRolePermissions,
);
router.post(
  "/permissions",
  authorize("roles", "update"),
  rbacController.assignPermission,
);

// User Assignment
router.post(
  "/users/assign-role",
  authorize("users", "update"),
  rbacController.assignUserRole,
);

// Metadata
router.get("/meta", authenticate, rbacController.listModulesAndActions);

export default router;
