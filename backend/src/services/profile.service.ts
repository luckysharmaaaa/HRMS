import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import path from "path";

import { pool } from "../db/connection";
import userModel from "../models/user.model";
import { attachMedia, deactivateActiveMediaUses } from "./mediaUse.service";
import { createAddress } from "./address.service";
import config from "../config";
import { DbConnection } from "../types";

/**
 * ==========================================================
 * Profile Service
 * ==========================================================
 * Backs the Account Settings / My Account module.
 *
 * IMPORTANT
 * - This service does NOT begin/commit/rollback transactions on its
 *   own for the multi-step operations (upsertUserAddress,
 *   replaceProfilePhoto) — the caller (controller) owns the
 *   transaction, matching the convention already used by
 *   address.service.ts and mediaUse.service.ts.
 * - getMyProfile() is read-only and does not need a transaction.
 *
 * NOTE ON objectType FOR PROFILE PHOTOS:
 * The existing User Management module writes/reads media_uses rows
 * for profile photos using objectType = 'user' (singular) — confirmed
 * from the live media_uses table data. This service intentionally
 * matches that exact string ('user', not 'users') everywhere it
 * touches profile-photo mappings, so a photo uploaded from either
 * User Management or Account Settings is visible in both places.
 * This is UNRELATED to address_info's ownerType, which separately
 * and correctly uses 'users' (plural) — do not "fix" that to match.
 */

interface ProfileAddressInput {
  addressType?: string | null;
  houseNumber?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  landmark?: string | null;
  locality?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  countryID?: number | null;
  countryCode?: string | null;
  phoneCode?: string | null;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isDefault?: boolean | number | null;
}

/**
 * Fetch the logged-in user's address (default-first, single row).
 * Mirrors the SELECT list used by address.controller.ts's
 * getAddressByOwner, scoped to ownerType = 'users'.
 */
const getUserAddress = async (
  executor: DbConnection,
  userId: number,
): Promise<RowDataPacket | null> => {
  const [rows] = await executor.query<RowDataPacket[]>(
    `
    SELECT
      id, addressType, ownerType, ownerID, fullName, houseNumber,
      addressLine1, addressLine2, landmark, locality, zipCode, state, city,
      countryID, countryCode, phoneCode, phone, latitude, longitude, isDefault,
      createdOn, createdBy, updatedOn, updatedBy
    FROM address_info
    WHERE ownerType = 'users'
      AND ownerID = ?
      AND trashedOn IS NULL
    ORDER BY isDefault DESC, id DESC
    LIMIT 1
    `,
    [userId],
  );

  return rows.length > 0 ? rows[0] : null;
};

/**
 * Fetch the logged-in user's currently active profile image via the
 * existing media_uses JOIN media architecture.
 *
 * objectType = 'user' (singular) — matches the existing User
 * Management module's convention, confirmed from live data.
 */
const getUserProfileImage = async (
  executor: DbConnection,
  userId: number,
): Promise<RowDataPacket | null> => {
  const [rows] = await executor.query<RowDataPacket[]>(
    `
    SELECT
      m.id AS mediaID,
      m.fileURL,
      m.mediaType,
      m.mimeType,
      m.orgFileName
    FROM media_uses mu
    INNER JOIN media m ON m.id = mu.mediaID
    WHERE mu.objectType = 'user'
      AND mu.objectID = ?
      AND mu.status = 1
      AND (m.trashedOn IS NULL OR m.trashedOn = 0)
    ORDER BY mu.id DESC
    LIMIT 1
    `,
    [userId],
  );

  return rows.length > 0 ? rows[0] : null;
};

/**
 * Complete profile (user + roles + address + profileImage) for the
 * currently logged-in user. Used by GET /auth/me.
 */
export const getMyProfile = async (userId: number) => {
  const user = await userModel.findUserById(userId);

  if (!user) return null;

  const roles = await userModel.getUserRoles(userId);
  const address = await getUserAddress(pool, userId);
  const profileImage = await getUserProfileImage(pool, userId);

  return {
    user,
    roles,
    address: address ?? null,
    profileImage: profileImage ?? null,
  };
};

/**
 * Create or update the logged-in user's address (upsert), scoped to
 * ownerType = 'users' / ownerID = userId.
 *
 * - No existing row -> INSERT via the shared AddressService
 *   (createAddress), so the "only one default per owner" logic stays
 *   in one place.
 * - Existing row -> UPDATE that row directly (same shape as
 *   address.controller.ts's updateAddress), so we never create a
 *   second address row for the same user on every Save.
 */
export const upsertUserAddress = async (
  connection: PoolConnection,
  userId: number,
  address: ProfileAddressInput,
  updatedBy?: number | null,
): Promise<void> => {
  const [rows] = await connection.query<RowDataPacket[]>(
    `
    SELECT id
    FROM address_info
    WHERE ownerType = 'users'
      AND ownerID = ?
      AND trashedOn IS NULL
    LIMIT 1
    `,
    [userId],
  );

  const isDefaultFlag = address.isDefault ? 1 : 0;

  if (rows.length === 0) {
    await createAddress(connection, {
      ownerType: "users",
      ownerID: userId,
      createdBy: updatedBy ?? userId,
      address: {
        addressType: address.addressType ?? "home",
        houseNumber: address.houseNumber ?? null,
        addressLine1: address.addressLine1 ?? null,
        addressLine2: address.addressLine2 ?? null,
        landmark: address.landmark ?? null,
        locality: address.locality ?? null,
        city: address.city ?? null,
        state: address.state ?? null,
        zipCode: address.zipCode ?? null,
        countryID: address.countryID ?? null,
        countryCode: address.countryCode ?? null,
        phoneCode: address.phoneCode ?? null,
        phone: address.phone ?? null,
        latitude: address.latitude ?? null,
        longitude: address.longitude ?? null,
        isDefault: isDefaultFlag,
      },
    });

    return;
  }

  const existingId = rows[0].id;

  if (isDefaultFlag === 1) {
    await connection.query(
      `UPDATE address_info SET isDefault = 0 WHERE ownerType = 'users' AND ownerID = ?`,
      [userId],
    );
  }

  const updatedOn = Math.floor(Date.now() / 1000);

  const [result] = await connection.query<ResultSetHeader>(
    `
    UPDATE address_info
    SET
      addressType = ?, houseNumber = ?, addressLine1 = ?, addressLine2 = ?,
      landmark = ?, locality = ?, city = ?, state = ?, zipCode = ?,
      countryID = ?, countryCode = ?, phoneCode = ?, phone = ?,
      latitude = ?, longitude = ?, isDefault = ?, updatedOn = ?, updatedBy = ?
    WHERE id = ?
    `,
    [
      address.addressType ?? "home",
      address.houseNumber ?? null,
      address.addressLine1 ?? null,
      address.addressLine2 ?? null,
      address.landmark ?? null,
      address.locality ?? null,
      address.city ?? null,
      address.state ?? null,
      address.zipCode ?? null,
      address.countryID ?? null,
      address.countryCode ?? null,
      address.phoneCode ?? null,
      address.phone ?? null,
      address.latitude ?? null,
      address.longitude ?? null,
      isDefaultFlag,
      updatedOn,
      updatedBy ?? null,
      existingId,
    ],
  );

  if (result.affectedRows === 0) {
    throw new Error("Failed to update address");
  }
};

/**
 * Insert the uploaded file into `media`, deactivate any previous
 * active profile-photo mapping, then attach the new one via the
 * shared media_uses attachMedia() service.
 *
 * objectType = 'user' (singular) — MUST match the existing User
 * Management module's convention (see note at top of file), so a
 * photo uploaded here is visible in User Management and vice versa.
 *
 * NOTE: The `media` INSERT here intentionally mirrors
 * media.controller.ts's uploadMedia() insert logic. That insert is
 * not currently exposed as a standalone reusable function (only as
 * part of the HTTP controller), so it is kept in sync here rather
 * than invoking the controller function directly from another
 * controller (which would mix HTTP concerns into a service).
 */
export const replaceProfilePhoto = async (
  connection: PoolConnection,
  userId: number,
  file: Express.Multer.File,
): Promise<{ mediaID: number; fileURL: string }> => {
  const extension = path.extname(file.originalname).toLowerCase();

  const mediaType = [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(extension)
    ? "image"
    : "other";

  const moduleFolder = path
    .relative(config.upload.path, file.destination)
    .split(path.sep)
    .join("/");

  const fileURL = moduleFolder
    ? `uploads/${moduleFolder}/${file.filename}`
    : `uploads/${file.filename}`;

  const createdOn = Math.floor(Date.now() / 1000);

  const [result] = await connection.query<ResultSetHeader>(
    `
    INSERT INTO media
      (title, orgFileName, altText, mediaType, mimeType, fileURL, fileExtension, createdOn, createdBy)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      "Profile Photo",
      file.originalname,
      "Profile photo",
      mediaType,
      file.mimetype,
      fileURL,
      extension.replace(".", ""),
      createdOn,
      userId,
    ],
  );

  if (result.affectedRows === 0) {
    throw new Error("Failed to save uploaded profile photo");
  }

  const mediaID = result.insertId;

  // Deactivate any previous active profile photo BEFORE attaching the
  // new one, so GET /auth/me always resolves to a single active image
  // (no unlimited accumulating mappings, per spec item 13).
  // objectType = 'user' to match the User Management module.
  await deactivateActiveMediaUses(connection, {
    objectType: "user",
    objectID: userId,
  });

  await attachMedia(connection, {
    objectType: "user",
    objectID: userId,
    mediaID,
    title: "Profile Photo",
    altText: "Profile photo",
    status: 1,
  });

  return { mediaID, fileURL };
};