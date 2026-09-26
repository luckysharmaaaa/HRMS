import { Request, Response, NextFunction } from "express";
import { ResultSetHeader, RowDataPacket, PoolConnection } from "mysql2/promise";
import { pool } from "../../db/connection";
import { ApiError } from "../../utils/apiError";
import {
  PermissionAction,
  getUserPermissionKeys,
} from "../../services/permission.service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface RolePermissionRow extends RowDataPacket {
  id: number;
  roleId: number;
  moduleId: number;
  action: PermissionAction;
  createdAt: number | null;
  createdBy: number | null;
  updatedAt: number | null;
  updatedBy: number | null;
  trashedAt: number | null;
  trashedBy: number | null;
}

interface PermissionInput {
  moduleId: number;
  actions: PermissionAction[];
}

const VALID_ACTIONS: PermissionAction[] = [
  "view",
  "add",
  "edit",
  "approved",
  "delete",
];

// Slug of the module that controls this very screen. A user must never be
// able to remove their own access to it (lock-out protection).
const ROLES_MODULE_SLUG = "roles";

const nowEpoch = (): number => Math.floor(Date.now() / 1000);

const toPositiveInt = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
};

/** Role ids the given user currently holds (from user_roles). */
const getUserRoleIds = async (
  db: Pick<PoolConnection, "query">,
  userId: number,
): Promise<number[]> => {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT roleId FROM user_roles WHERE userId = ? AND trashedAt IS NULL`,
    [userId],
  );
  return rows.map((r) => Number(r.roleId));
};

/**
 * Validates and normalises the incoming matrix:
 *  - de-duplicates modules and actions
 *  - rejects unknown actions / malformed entries
 *  - enforces "any action implies view" (otherwise the module would be
 *    invisible in the sidebar even though the user can edit it)
 */
export const normalizePermissionInput = (
  permissions: PermissionInput[],
): Map<number, Set<PermissionAction>> => {
  const byModule = new Map<number, Set<PermissionAction>>();

  for (const entry of permissions) {
    const moduleId = toPositiveInt(entry?.moduleId);

    if (!moduleId || !Array.isArray(entry?.actions)) {
      throw ApiError.badRequest(
        "Each permission needs a valid moduleId and an actions array",
      );
    }

    const set = byModule.get(moduleId) ?? new Set<PermissionAction>();

    for (const action of entry.actions) {
      if (!VALID_ACTIONS.includes(action)) {
        throw ApiError.badRequest(
          `Invalid action "${action}" for moduleId ${moduleId}`,
        );
      }
      set.add(action);
    }

    byModule.set(moduleId, set);
  }

  for (const set of byModule.values()) {
    if (set.size > 0) set.add("view");
  }

  return byModule;
};

// ---------------------------------------------------------------------------
// GET /role-permissions/:roleId
// List all active permissions for a role
// ---------------------------------------------------------------------------
export const listPermissionsByRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const roleId = toPositiveInt(req.params.roleId);
    if (!roleId) throw ApiError.badRequest("A valid roleId is required");

    const [rows] = await pool.query<RolePermissionRow[]>(
      `SELECT id, roleId, moduleId, action, createdAt, createdBy, updatedAt, updatedBy
         FROM role_permissions
        WHERE roleId = ? AND trashedAt IS NULL`,
      [roleId],
    );

    res.status(200).json({
      success: true,
      message: "Role permissions retrieved successfully",
      data: rows,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /role-permissions/sync
// Replace the full set of (moduleId, action) permissions for a role in one
// transaction. Body: { roleId, permissions: [{ moduleId, actions[] }] }
//
// Safety rules enforced here (not just in the UI):
//  1. Any action implies "view".
//  2. Duplicates are collapsed, unknown roles/modules are rejected.
//  3. You cannot GRANT a permission you do not hold yourself
//     (no privilege escalation).
//  4. You cannot remove your own View/Edit on Roles (no lock-out).
//  5. Syncs for the same role are serialised (row lock on the role).
// ---------------------------------------------------------------------------
export const syncRolePermissions = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  let connection: PoolConnection | null = null;

  try {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized("Access denied. Please log in.");

    const roleId = toPositiveInt(req.body?.roleId);
    if (!roleId) throw ApiError.badRequest("roleId is required");

    if (!Array.isArray(req.body?.permissions)) {
      throw ApiError.badRequest("permissions must be an array");
    }

    const byModule = normalizePermissionInput(req.body.permissions);

    // Resolve module slugs (also proves every moduleId exists)
    const moduleIds = [...byModule.keys()];
    const slugById = new Map<number, string>();

    if (moduleIds.length > 0) {
      const [moduleRows] = await pool.query<RowDataPacket[]>(
        `SELECT id, slug FROM modules WHERE id IN (?) AND trashedAt IS NULL`,
        [moduleIds],
      );
      moduleRows.forEach((m) => slugById.set(Number(m.id), String(m.slug)));

      const unknown = moduleIds.filter((id) => !slugById.has(id));
      if (unknown.length > 0) {
        throw ApiError.badRequest(`Unknown moduleId(s): ${unknown.join(", ")}`);
      }
    }

    // Flatten to pairs
    const incomingPairs: { moduleId: number; action: PermissionAction }[] = [];
    for (const [moduleId, actions] of byModule) {
      for (const action of actions) incomingPairs.push({ moduleId, action });
    }
    const pairKey = (moduleId: number, action: string) => `${moduleId}::${action}`;
    const incomingKeys = new Set(
      incomingPairs.map((p) => pairKey(p.moduleId, p.action)),
    );

    // Rule 4: lock-out protection
    const myRoleIds = await getUserRoleIds(pool, userId);
    if (myRoleIds.includes(roleId)) {
      const finalSlugKeys = new Set(
        incomingPairs.map((p) => `${slugById.get(p.moduleId)}:${p.action}`),
      );
      const keepsAccess =
        finalSlugKeys.has(`${ROLES_MODULE_SLUG}:view`) &&
        finalSlugKeys.has(`${ROLES_MODULE_SLUG}:edit`);

      if (!keepsAccess) {
        throw ApiError.badRequest(
          "You cannot remove your own access to Roles. Keep View and Edit on the Roles module.",
        );
      }
    }

    // What the requester may hand out (Rule 3)
    const myKeys = new Set(await getUserPermissionKeys(userId));

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Rule 5: serialise concurrent syncs for this role
    const [roleRows] = await connection.query<RowDataPacket[]>(
      `SELECT id FROM roles WHERE id = ? AND trashedAt IS NULL FOR UPDATE`,
      [roleId],
    );
    if (roleRows.length === 0) throw ApiError.notFound("Role not found");

    const [existingRows] = await connection.query<RolePermissionRow[]>(
      `SELECT id, moduleId, action FROM role_permissions
        WHERE roleId = ? AND trashedAt IS NULL`,
      [roleId],
    );
    const existingKeys = new Set(
      existingRows.map((r) => pairKey(r.moduleId, r.action)),
    );

    const toAdd = incomingPairs.filter(
      (p) => !existingKeys.has(pairKey(p.moduleId, p.action)),
    );
    const toRemove = existingRows.filter(
      (r) => !incomingKeys.has(pairKey(r.moduleId, r.action)),
    );

    // Rule 3: no privilege escalation
    const notAllowed = toAdd.filter(
      (p) => !myKeys.has(`${slugById.get(p.moduleId)}:${p.action}`),
    );
    if (notAllowed.length > 0) {
      throw ApiError.forbidden(
        "You can only grant permissions that you hold yourself.",
      );
    }

    if (toAdd.length > 0) {
      const now = nowEpoch();
      // role_permissions has UNIQUE (roleId, moduleId, action) and removals
      // are soft-deletes. A plain INSERT would fail with ER_DUP_ENTRY when a
      // permission that was unticked earlier is ticked again, so a trashed
      // row is revived instead of inserting a duplicate.
      await connection.query<ResultSetHeader>(
        `INSERT INTO role_permissions (roleId, moduleId, action, createdAt, createdBy)
         VALUES ?
         ON DUPLICATE KEY UPDATE
           trashedAt = NULL, trashedBy = NULL, updatedAt = ?, updatedBy = ?`,
        [
          toAdd.map((p) => [roleId, p.moduleId, p.action, now, userId]),
          now,
          userId,
        ],
      );
    }

    if (toRemove.length > 0) {
      await connection.query<ResultSetHeader>(
        `UPDATE role_permissions
            SET trashedAt = ?, trashedBy = ?
          WHERE id IN (?)`,
        [nowEpoch(), userId, toRemove.map((r) => r.id)],
      );
    }

    await connection.commit();

    const [finalRows] = await pool.query<RolePermissionRow[]>(
      `SELECT id, roleId, moduleId, action, createdAt, createdBy, updatedAt, updatedBy
         FROM role_permissions
        WHERE roleId = ? AND trashedAt IS NULL`,
      [roleId],
    );

    res.status(200).json({
      success: true,
      message: "Role permissions synced successfully",
      data: finalRows,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

// ---------------------------------------------------------------------------
// DELETE /role-permissions/:id
// Soft-delete a single permission row (cannot be used to bypass the
// lock-out rule above).
// ---------------------------------------------------------------------------
export const deletePermission = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized("Access denied. Please log in.");

    const id = toPositiveInt(req.params.id);
    if (!id) throw ApiError.badRequest("A valid permission id is required");

    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT rp.id, rp.roleId, rp.action, m.slug
         FROM role_permissions rp
         INNER JOIN modules m ON m.id = rp.moduleId
        WHERE rp.id = ? AND rp.trashedAt IS NULL
        LIMIT 1`,
      [id],
    );
    if (!existing.length) throw ApiError.notFound("Permission not found");

    const row = existing[0];
    const myRoleIds = await getUserRoleIds(pool, userId);

    if (
      row.slug === ROLES_MODULE_SLUG &&
      ["view", "edit"].includes(row.action) &&
      myRoleIds.includes(Number(row.roleId))
    ) {
      throw ApiError.badRequest(
        "You cannot remove your own access to Roles.",
      );
    }

    await pool.query<ResultSetHeader>(
      "UPDATE role_permissions SET trashedAt = ?, trashedBy = ? WHERE id = ?",
      [nowEpoch(), userId, id],
    );

    res.status(200).json({
      success: true,
      message: "Permission deleted successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};