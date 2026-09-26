import { Request, Response, NextFunction } from "express";
import { ResultSetHeader, RowDataPacket, PoolConnection } from "mysql2/promise";
import { pool } from "../../db/connection";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface RoleModuleMappingRow extends RowDataPacket {
  id: number;
  roleId: number;
  moduleId: number;
  createdAt: number | null;
  createdBy: number | null;
  updatedAt: number | null;
  updatedBy: number | null;
  trashedAt: number | null;
  trashedBy: number | null;
}

// ---------------------------------------------------------------------------
// GET /role-module-mapping/:roleId
// List all active module mappings for a role
// ---------------------------------------------------------------------------
export const listMappingsByRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { roleId } = req.params;

    const [rows] = await pool.query<RoleModuleMappingRow[]>(
      `SELECT id, roleId, moduleId, createdAt, createdBy, updatedAt, updatedBy
             FROM role_module_mapping
             WHERE roleId = ? AND trashedAt IS NULL`,
      [roleId],
    );

    res.status(200).json({
      success: true,
      message: "Role module mappings retrieved successfully",
      data: rows,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /role-module-mapping/sync
// Replace the full set of module mappings for a role in one transaction:
//   - insert moduleIds that are missing
//   - soft-delete (trash) mappings that are no longer in the incoming list
//   - skip moduleIds that already exist (prevents duplicates)
//
// Body: { roleId: number, moduleIds: number[] }
// ---------------------------------------------------------------------------
export const syncRoleModuleMapping = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = (req as any).user?.userId ?? null;
  const { roleId, moduleIds } = req.body;

  if (!roleId) {
    res.status(400).json({ success: false, message: "roleId is required" });
    return;
  }
  if (!Array.isArray(moduleIds)) {
    res
      .status(400)
      .json({ success: false, message: "moduleIds must be an array" });
    return;
  }

  // Dedupe incoming moduleIds defensively
  const incomingModuleIds = [...new Set(moduleIds.map((m: unknown) => Number(m)))];

  let connection: PoolConnection | null = null;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Existing active mappings for this role
    const [existingRows] = await connection.query<RoleModuleMappingRow[]>(
      `SELECT id, moduleId FROM role_module_mapping
             WHERE roleId = ? AND trashedAt IS NULL`,
      [roleId],
    );
    const existingModuleIds = existingRows.map((r) => r.moduleId);

    // Mappings to add (present in incoming, not in existing)
    const toAdd = incomingModuleIds.filter(
      (id) => !existingModuleIds.includes(id),
    );

    // Mappings to remove (present in existing, not in incoming)
    const toRemove = existingRows.filter(
      (r) => !incomingModuleIds.includes(r.moduleId),
    );

    // Insert new mappings
    for (const moduleId of toAdd) {
      await connection.query<ResultSetHeader>(
        `INSERT INTO role_module_mapping (roleId, moduleId, createdAt, createdBy)
                 VALUES (?, ?, UNIX_TIMESTAMP(), ?)`,
        [roleId, moduleId, userId],
      );
    }

    // Soft-delete removed mappings
    if (toRemove.length) {
      const idsToRemove = toRemove.map((r) => r.id);
      await connection.query<ResultSetHeader>(
        `UPDATE role_module_mapping
                 SET trashedAt = UNIX_TIMESTAMP(), trashedBy = ?
                 WHERE id IN (?)`,
        [userId, idsToRemove],
      );
    }

    await connection.commit();

    const [finalRows] = await pool.query<RoleModuleMappingRow[]>(
      `SELECT id, roleId, moduleId, createdAt, createdBy, updatedAt, updatedBy
             FROM role_module_mapping
             WHERE roleId = ? AND trashedAt IS NULL`,
      [roleId],
    );

    res.status(200).json({
      success: true,
      message: "Role module mappings synced successfully",
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
// DELETE /role-module-mapping/:id
// Soft-delete a single mapping row
// ---------------------------------------------------------------------------
export const deleteMapping = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId ?? null;
    const { id } = req.params;

    const [existing] = await pool.query<RoleModuleMappingRow[]>(
      "SELECT id FROM role_module_mapping WHERE id = ? AND trashedAt IS NULL LIMIT 1",
      [id],
    );
    if (!existing.length) {
      res
        .status(404)
        .json({ success: false, message: "Mapping not found" });
      return;
    }

    await pool.query<ResultSetHeader>(
      "UPDATE role_module_mapping SET trashedAt = UNIX_TIMESTAMP(), trashedBy = ? WHERE id = ?",
      [userId, id],
    );

    res.status(200).json({
      success: true,
      message: "Mapping deleted successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
