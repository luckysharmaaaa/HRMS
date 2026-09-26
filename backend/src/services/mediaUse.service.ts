import { ResultSetHeader } from "mysql2";
import { Pool, PoolConnection } from "mysql2/promise";

/**b ,  
 * ==========================================================
 * Media Use Service
 * ==========================================================
 * This service is responsible ONLY for inserting media_uses
 * records. It is designed to be reusable across modules such as:
 *
 *   - User
 *   - Employee
 *   - Company
 *   - Branch
 *   - Vendor
 *   - Client
 *
 * IMPORTANT
 * - This service does NOT begin, commit, or rollback transactions.
 * - The caller (controller) owns the transaction and must pass in
 *   the active connection.
 * - This service only throws errors; it never swallows them.
 *
 * NOTE ON SCHEMA:
 * The media_uses table does NOT have createdAt / createdBy columns.
 * Its actual columns are:
 *   ID, objectID, objectType, mediaID, title, altText,
 *   priority, target, data, status
 * The previous version of this service tried to insert a
 * non-existent `createdAt` column, which caused a MySQL
 * "Unknown column 'createdAt' in 'field list'" error on every call.
 */

interface AttachMediaInput {
  objectType: string;
  objectID: number;
  mediaID: number;
  title?: string | null;
  altText?: string | null;
  priority?: number | null;
  status?: number | null;
}

/**
 * ==========================================================
 * attachMedia
 * ==========================================================
 * Inserts a single row into media_uses linking a media record
 * to an owning object (user, employee, company, etc).
 *
 * @param connection - Active MySQL transaction connection (from pool)
 * @param data - Media use payload
 */
export const attachMedia = async (
  connection: PoolConnection,
  data: AttachMediaInput,
): Promise<number> => {
  const { objectType, objectID, mediaID, title, altText, priority, status } =
    data;

  if (!objectType || !objectID || !mediaID) {
    throw new Error(
      "objectType, objectID and mediaID are required to attach media",
    );
  }

  const [result] = await connection.query<ResultSetHeader>(
    `
      INSERT INTO media_uses
      (
        objectType,
        objectID,
        mediaID,
        title,
        altText,
        priority,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
    [
      objectType,
      objectID,
      mediaID,
      title ?? null,
      altText ?? null,
      priority ?? null,
      status ?? 1,
    ],
  );

  if (result.affectedRows === 0) {
    throw new Error("Failed to attach media");
  }

  return result.insertId;
};

/**
 * ==========================================================
 * deactivateActiveMediaUses
 * ==========================================================
 * Soft-deactivates (status = 0) all currently active media_uses
 * mappings for a given owning object. Used when a single "active
 * image" per owner is required (e.g. a user's profile photo) —
 * called BEFORE attachMedia() so exactly one mapping stays active.
 *
 * Does NOT physically delete the media row or the mapping row, per
 * the existing soft-delete conventions used elsewhere in this app.
 *
 * @param connection - Pool or active transaction connection
 * @param data - objectType + objectID to deactivate mappings for
 */
export const deactivateActiveMediaUses = async (
  connection: Pool | PoolConnection,
  data: { objectType: string; objectID: number },
): Promise<void> => {
  const { objectType, objectID } = data;

  if (!objectType || !objectID) {
    throw new Error(
      "objectType and objectID are required to deactivate media uses",
    );
  }

  await connection.query(
    `
    UPDATE media_uses
    SET status = 0
    WHERE objectType = ?
      AND objectID = ?
      AND status = 1
    `,
    [objectType, objectID],
  );
};