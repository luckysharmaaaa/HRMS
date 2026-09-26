import { RowDataPacket } from "mysql2";
import { pool } from "../db/connection";

export type PermissionAction = "view" | "add" | "edit" | "approved" | "delete";

// A user can hold several roles (user_roles). Access is the UNION of every
// active role's permissions, so adding a role never removes existing access.
const ACTIVE_PERMISSION_JOIN = `
  FROM user_roles ur
  INNER JOIN roles r
          ON r.id = ur.roleId AND r.trashedAt IS NULL
  INNER JOIN role_permissions rp
          ON rp.roleId = ur.roleId AND rp.trashedAt IS NULL
  INNER JOIN modules m
          ON m.id = rp.moduleId AND m.trashedAt IS NULL AND m.status = '1'
`;

/** Every "slug:action" key the user is allowed, across all their roles. */
export const getUserPermissionKeys = async (
  userId: number,
): Promise<string[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
      SELECT DISTINCT m.slug, rp.action
      ${ACTIVE_PERMISSION_JOIN}
      WHERE ur.userId = ? AND ur.trashedAt IS NULL
    `,
    [userId],
  );

  return rows.map((row) => `${row.slug}:${row.action}`);
};

/** Single check used by the authorize() middleware. */
export const userHasPermission = async (
  userId: number,
  moduleSlug: string,
  action: PermissionAction,
): Promise<boolean> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
      SELECT 1
      ${ACTIVE_PERMISSION_JOIN}
      WHERE ur.userId = ?
        AND ur.trashedAt IS NULL
        AND m.slug = ?
        AND rp.action = ?
      LIMIT 1
    `,
    [userId, moduleSlug, action],
  );

  return rows.length > 0;
};