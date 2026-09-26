import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import * as employeeShiftController from "../../controllers/rbac/employeeShift.controller";

const router = Router();

router.use(authenticate);

router.get("/:employeeId/shift", employeeShiftController.getEmployeeShift);
router.post("/:employeeId/shift", employeeShiftController.assignEmployeeShift);
router.put("/:employeeId/shift", employeeShiftController.assignEmployeeShift); // change = same op
router.get("/:employeeId/shift/history", employeeShiftController.getEmployeeShiftHistory);

export default router;