import { Router } from "express";

import {
  getDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
} from "../controllers/designation.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/authorize";

const router = Router();

// These routes had NO authentication at all (anyone could call them).
router.use(authenticate);

// ==========================================================
// DESIGNATION ROUTES   (module slug: "designations")
// ==========================================================

router.get("/", authorize("designations", "view"), getDesignations);

router.post("/", authorize("designations", "add"), createDesignation);

router.put("/:id", authorize("designations", "edit"), updateDesignation);

router.delete("/:id", authorize("designations", "delete"), deleteDesignation);

export default router;