import { Router } from "express";
import * as moduleController from "../../controllers/rbac/module.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize";

const router = Router();

router.use(authenticate);

router.get("/", authorize("modules", "view"), moduleController.listModules);
router.get("/:id", authorize("modules", "view"), moduleController.getModule);
router.post("/", authorize("modules", "add"), moduleController.createModule);
router.put("/:id", authorize("modules", "edit"), moduleController.updateModule);
router.delete("/:id", authorize("modules", "delete"), moduleController.deleteModule);

export default router;