import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import * as shiftController from "../../controllers/rbac/shift.controller";

const router = Router();

router.use(authenticate);

router.get("/", shiftController.getShifts);
router.get("/:id", shiftController.getShift);
router.post("/", shiftController.createShift);
router.put("/:id", shiftController.updateShift);    
router.delete("/:id", shiftController.deleteShift);

export default router;