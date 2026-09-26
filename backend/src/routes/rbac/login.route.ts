import { Router } from "express";

import * as authController from "../../controllers/rbac/login.controller";
import { authenticate } from "../../middleware/auth.middleware";
import {
    uploadProfilePhoto,
    forceModule,
    wrapUpload,
} from "../../middleware/upload.middleware";

const router = Router();

/* =========================================================
   PUBLIC AUTH ROUTES
   ========================================================= */

/**
 * POST /api/v1/auth/login
 *
 * Login with email + password
 */
router.post(
    "/login",
    authController.login
);

/**
 * POST /api/v1/auth/refresh-token
 *
 * Generate a new access token using refresh token
 */
router.post(
    "/refresh-token",
    authController.refreshToken
);

/**
 * POST /api/v1/auth/forgot-password
 *
 * Request password reset
 */
router.post(
    "/forgot-password",
    authController.forgotPassword
);

/**
 * POST /api/v1/auth/reset-password
 *
 * Reset password using reset token
 */
router.post(
    "/reset-password",
    authController.resetPassword
);


/* =========================================================
   PROTECTED AUTH ROUTES
   ========================================================= */

/**
 * POST /api/v1/auth/logout
 */
router.post(
    "/logout",
    authenticate,
    authController.logout
);

/**
 * GET /api/v1/auth/me
 *
 * Get currently authenticated user
 */
router.get(
    "/me",
    authenticate,
    authController.me
);

/**
 * PUT /api/v1/auth/profile
 *
 * Update logged-in user's profile
 */
router.put(
    "/profile",
    authenticate,
    authController.updateProfile
);

/**
 * POST /api/v1/auth/change-password
 *
 * Change logged-in user's password
 */
router.post(
    "/change-password",
    authenticate,
    authController.changePassword
);


/* =========================================================
   PROFILE PHOTO
   ========================================================= */

/**
 * POST /api/v1/auth/profile/photo
 *
 * Upload profile photo.
 *
 * Important:
 * - Authentication required
 * - Module is forced to "users"
 * - Client cannot control ?module=
 * - Only jpg/jpeg/png/webp
 * - Maximum 2MB
 * - Multipart field name: file
 */
router.post(
    "/profile/photo",
    authenticate,
    forceModule("users"),
    wrapUpload(uploadProfilePhoto.single("file")),
    authController.uploadProfilePhoto
);

/**
 * DELETE /api/v1/auth/profile/photo
 */
router.delete(
    "/profile/photo",
    authenticate,
    authController.removeProfilePhoto
);

export default router;