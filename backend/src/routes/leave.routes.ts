import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/authorize";
import * as leaveController from "../controllers/leave.controller";

const router = Router();

router.use(authenticate);

// Module slugs (must match `modules.slug` in the DB):
//   leave-employee  -> employee self-service pages
//   leave-admin     -> admin / HR review pages
//   leave-settings  -> leave type configuration

// Leave types (dropdown source) — used by both employee and admin pages
router.get(
  "/types",
  authorize("leave-employee", "view"),
  leaveController.getLeaveTypes,
);

// Employee: own balance
router.get(
  "/balance",
  authorize("leave-employee", "view"),
  leaveController.getMyBalance,
);

// Employee: own leave summary (stat cards)
router.get(
  "/summary",
  authorize("leave-employee", "view"),
  leaveController.getMySummary,
);

// Employee: own applications
router.get(
  "/applications",
  authorize("leave-employee", "view"),
  leaveController.getMyApplications,
);

router.post(
  "/applications",
  authorize("leave-employee", "add"),
  leaveController.applyLeave,
);

router.get(
  "/applications/:id",
  authorize("leave-employee", "view"),
  leaveController.getApplicationDetail,
);

router.patch(
  "/applications/:id",
  authorize("leave-employee", "edit"),
  leaveController.editApplication,
);

router.patch(
  "/applications/:id/cancel",
  authorize("leave-employee", "edit"),
  leaveController.cancelApplication,
);

// Admin/HR: org-wide leave summary (stat cards)
router.get(
  "/admin/summary",
  authorize("leave-admin", "view"),
  leaveController.getAdminSummary,
);

// Admin/HR: all applications
router.get(
  "/admin/applications",
  authorize("leave-admin", "view"),
  leaveController.getAdminApplications,
);

router.patch(
  "/admin/applications/:id/approve",
  authorize("leave-admin", "approved"),
  leaveController.approveApplication,
);

router.patch(
  "/admin/applications/:id/reject",
  authorize("leave-admin", "approved"),
  leaveController.rejectApplication,
);

// Leave settings (policy configuration)
router.get(
  "/settings",
  authorize("leave-settings", "view"),
  leaveController.getLeaveSettings,
);

router.post(
  "/settings",
  authorize("leave-settings", "add"),
  leaveController.createLeaveSetting,
);

router.patch(
  "/settings/:id",
  authorize("leave-settings", "edit"),
  leaveController.updateLeaveSetting,
);

export default router;