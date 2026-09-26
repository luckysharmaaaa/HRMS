import { Router } from "express";

import {
  createMediaUses,
  getMediaUsesByObject,
  deleteMediaUses,
} from "../../controllers/rbac/mediaUses.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

// These routes were completely public. They now require a logged-in user.
router.use(authenticate);

/**
 * Create Mapping
 */
router.post("/", createMediaUses);

/**
 * Get By Object
 */
router.get("/:objectType/:objectID", getMediaUsesByObject);

/**
 * Delete Mapping
 */
router.delete("/:id", deleteMediaUses);

export default router;