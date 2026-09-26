import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { upload } from "../../middleware/upload.middleware";

import {
  uploadMedia,
  getAllMedia,
  getMediaById,
  deleteMedia,
} from "../../controllers/rbac/media.controller";

const router = Router();

/**
 * Upload Media
 */
router.post(
  "/upload",
  authenticate,
  upload.single("file"),
  uploadMedia,
);

/**
 * Get All Media
 */
router.get(
  "/",
  authenticate,
  getAllMedia,
);

/**
 * Get Media By Id
 */
router.get(
  "/:id",
  authenticate,
  getMediaById,
);

/**
 * Delete Media
 */
router.delete(
  "/:id",
  authenticate,
  deleteMedia,
);

export default router;