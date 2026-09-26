import { Router } from "express";

import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../controllers/department.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/authorize";

const router = Router();

// These routes had NO authentication at all (anyone could call them).
router.use(authenticate);

// module slug: "department"
router.get("/", authorize("department", "view"), getDepartments);
router.post("/", authorize("department", "add"), createDepartment);
router.put("/:id", authorize("department", "edit"), updateDepartment);
router.delete("/:id", authorize("department", "delete"), deleteDepartment);

export default router;