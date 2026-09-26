import { Router } from "express";
import * as roleModuleMappingController from "../../controllers/rbac/role_module_mapping.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize";

const router = Router();

router.use(authenticate);

// GET    /role-module-mapping/:roleId — list active module mappings for a role
router.get(
  "/:roleId",
  authorize("roles", "view"),
  roleModuleMappingController.listMappingsByRole,
);

// POST   /role-module-mapping/sync — replace full set of module mappings for a role
router.post(
  "/sync",
  authorize("roles", "edit"),
  roleModuleMappingController.syncRoleModuleMapping,
);

// DELETE /role-module-mapping/:id — soft-delete a single mapping
router.delete(
  "/:id",
  authorize("roles", "edit"),
  roleModuleMappingController.deleteMapping,
);

export default router;