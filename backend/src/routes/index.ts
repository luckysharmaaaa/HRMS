import { Router } from "express";
import config from "../config";
import { authenticate } from "../middleware/auth.middleware";
import { getMyPermissions } from "../controllers/permission.controller";

import authRoutes from "./rbac/login.route";
import rbacRoutes from "./rbac.routes";
import rolesRoutes from "./rbac/roles.routes";
import userRoutes from "./rbac/user.routes";
import moduleRoutes from "./rbac/module.routes";
import roleModuleMappingRoutes from "./rbac/role_module_mapping.routes";
import rolePermissionsRoutes from "./rbac/role_permissions.routes";
import mediaRoutes from "./rbac/media.routes";
import addressRoutes from "./rbac/address.routes";
import mediaUsesRoutes from "./rbac/mediaUses.routes";

import employeeShiftRoutes from "./rbac/employeeShift.routes";
import shiftRoutes from "./rbac/shift.routes";

import departmentRoutes from "./department.routes";
import designationRoutes from "./designation.routes";
import employeeRoutes from "./employee.routes";

import attendanceRoutes from "./attendance.routes";
// FIX: the old path had a trailing space ("...routes ") which only resolves
// on Windows and breaks on Linux / Docker / CI.
// import attendanceRegularizationRoutes from "./attendanceregularization.routes ";
import attendanceRegularizationRoutes from "./attendanceregularization.routes";

import leaveRoutes from "./leave.routes";

const router = Router();

// Logged-in user's own permissions (merged across all roles). Registered
// BEFORE /auth so it is always reachable for any authenticated user.
router.get("/auth/me/permissions", authenticate, getMyPermissions);

// Authentication & RBAC
router.use("/auth", authRoutes);
router.use("/rbac", rbacRoutes);

// User & Role Management
router.use("/roles", rolesRoutes);
router.use("/users", userRoutes);
router.use("/modules", moduleRoutes);

// Role Mapping & Permissions
router.use("/role-module-mapping", roleModuleMappingRoutes);
router.use("/role-permissions", rolePermissionsRoutes);

// Media
router.use("/media", mediaRoutes);
router.use("/address", addressRoutes);
router.use("/media-uses", mediaUsesRoutes);

// Employee Module
router.use("/employees", employeeRoutes);
router.use("/departments", departmentRoutes);
router.use("/designations", designationRoutes);

router.use("/attendance", attendanceRoutes);
router.use("/shifts", shiftRoutes);
router.use("/employees", employeeShiftRoutes);

router.use("/regularization", attendanceRegularizationRoutes);
router.use("/leave", leaveRoutes);

export default router;