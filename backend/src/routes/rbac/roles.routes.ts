// src/routes/rbac/roles.routes.ts
import { Router } from "express";

import {
  listRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} from "../../controllers/rbac/roles.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize";

const router = Router();

router.use(authenticate);

// GET    /roles              — list roles (supports ?status=&search=&page=&limit=)
router.get("/", authorize("roles", "view"), listRoles);

// GET    /roles/:id          — get single role
router.get("/:id", authorize("roles", "view"), getRoleById);

// POST   /roles/add          — create role
router.post("/add", authorize("roles", "add"), createRole);

// PUT    /roles/update/:id   — update role
router.put("/update/:id", authorize("roles", "edit"), updateRole);

// DELETE /roles/delete/:id   — soft-delete role
router.delete("/delete/:id", authorize("roles", "delete"), deleteRole);

export default router;