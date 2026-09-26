import { Router, RequestHandler } from "express";
import * as controller from "../controllers/Attendanceregularization.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/authorize";

const router = Router();

const submit = controller.submitRegularization as unknown as RequestHandler;
const update = controller.updateRegularization as unknown as RequestHandler;
const listMine = controller.getMyRegularizations as unknown as RequestHandler;
const listAll = controller.getRegularizationsForReview as unknown as RequestHandler;
const approve = controller.approveRegularization as unknown as RequestHandler;
const reject = controller.rejectRegularization as unknown as RequestHandler;

router.use(authenticate);

// Employee
router.post("/", submit);
router.get("/my", listMine);

// Edit a pending request — same row, PATCH. Ownership + PENDING-only
// enforcement happens inside updateRegularizationRequest.
router.patch("/:id", update);

// Reviewer — checked against role_permissions (moduleSlug + action).
// NOTE: approve and reject intentionally share the same "approved"
// action here, matching your existing PermissionAction type. If you
// want them permissioned separately, that requires widening
// PermissionAction and seeding a new permission row first — see
// Option B instead of doing it here blind.
router.get("/", authorize("attendance-regularization", "view"), listAll);
router.patch("/:id/approve", authorize("attendance-regularization", "approved"), approve);
router.patch("/:id/reject", authorize("attendance-regularization", "approved"), reject);

export default router;