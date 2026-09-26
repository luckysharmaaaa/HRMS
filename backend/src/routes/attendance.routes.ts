import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/authorize";
import { attendanceIpCheck } from "../middleware/attendanceIp.middleware";
import * as attendanceController from "../controllers/attendance.controller";

const router = Router();

router.use(authenticate); // all attendance routes require login

router.get("/today", attendanceController.getToday);
router.get("/history", attendanceController.getHistory);

// Admin: attendance across all employees, filtered + paginated.
// Defaults to TODAY when no date filter is supplied (see service).
// Gated separately from /today and /history since not every logged-in
// user should see everyone else's attendance.
router.get(
  "/admin/summary",
  authorize("attendance-admin", "view"),
  attendanceController.getAdminAttendanceSummary,
);

router.get(
  "/admin",
  authorize("attendance-admin", "view"),
  attendanceController.getAdminAttendance,
);

// Admin: edit an attendance record (the Edit pencil action in the UI).
// Separate "edit" permission from "view" so read-only roles can't modify data.
router.patch(
  "/admin/:id",
  authorize("attendance-admin", "edit"),
  attendanceController.updateAdminAttendance,
);

// IP check only on the actual punch actions, not on reads.
router.post("/punch-in", attendanceIpCheck, attendanceController.punchIn);
router.post("/punch-out", attendanceIpCheck, attendanceController.punchOut);

export default router;