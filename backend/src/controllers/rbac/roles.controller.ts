import { Request, Response, NextFunction } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../../db/connection";

interface RoleRow extends RowDataPacket {
  id: number;
  roleName: string;
  roleCode: string;
  description: string | null;
  status: "0" | "1";
  createdAt: number | null;
  createdBy: number | null;
  updatedAt: number | null;
  updatedBy: number | null;
  trashedAt: number | null;
  trashedBy: number | null;
}

// ---------------------------------------------------------------------------
// GET /roles
// ---------------------------------------------------------------------------
export const listRoles = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { status, search, page = "1", limit = "10" } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(limit as string, 10)),
    );
    const offset = (pageNum - 1) * limitNum;

    const conditions: string[] = ["trashedAt IS NULL"];
    const params: unknown[] = [];

    if (status !== undefined) {
      conditions.push("status = ?");
      params.push(Number(status));
    }

    if (search) {
      conditions.push("(roleName LIKE ? OR roleCode LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.join(" AND ");

    const [[{ total }]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total
       FROM roles
       WHERE ${whereClause}`,
      params,
    );

    const [rows] = await pool.query<RoleRow[]>(
      `SELECT
          id,
          roleName,
          roleCode,
          description,
          status,
          createdAt,
          createdBy,
          updatedAt,
          updatedBy
       FROM roles
       WHERE ${whereClause}
       ORDER BY createdAt DESC
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset],
    );

    res.status(200).json({
      success: true,
      message: "Roles retrieved successfully",
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total as number,
        totalPages: Math.ceil((total as number) / limitNum),
        currentPage: pageNum,
        hasMore: pageNum * limitNum < (total as number),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /roles/:id
// ---------------------------------------------------------------------------
export const getRoleById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query<RoleRow[]>(
      `SELECT
          id,
          roleName,
          roleCode,
          description,
          status,
          createdAt,
          createdBy,
          updatedAt,
          updatedBy
       FROM roles
       WHERE id = ? AND trashedAt IS NULL
       LIMIT 1`,
      [id],
    );

    if (!rows.length) {
      res.status(404).json({
        success: false,
        message: "Role not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Role retrieved successfully",
      data: rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /roles
// ---------------------------------------------------------------------------
export const createRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId ?? null;

    const {
      roleName,
      roleCode,
      description,
      status = "0",
    } = req.body;

    // -----------------------------------------------------------------------
    // Basic validation
    // -----------------------------------------------------------------------
    if (!roleName?.trim()) {
      res.status(400).json({
        success: false,
        message: "roleName is required",
      });
      return;
    }

    if (!roleCode?.trim()) {
      res.status(400).json({
        success: false,
        message: "roleCode is required",
      });
      return;
    }

    const normalizedRoleName = roleName.trim();
    const normalizedRoleCode = roleCode.trim().toUpperCase();

    // -----------------------------------------------------------------------
    // Check duplicate role name
    //
    // IMPORTANT:
    // We do NOT check trashedAt IS NULL here because role_name has a
    // database-level UNIQUE constraint. A soft-deleted row can still occupy
    // the unique value.
    // -----------------------------------------------------------------------
    const [existingRoleName] = await pool.query<RoleRow[]>(
      `SELECT id, roleName, trashedAt
       FROM roles
       WHERE roleName = ?
       LIMIT 1`,
      [normalizedRoleName],
    );

    if (existingRoleName.length) {
      res.status(409).json({
        success: false,
        message: `Role "${normalizedRoleName}" already exists`,
        field: "roleName",
      });
      return;
    }

    // -----------------------------------------------------------------------
    // Check duplicate role code
    // -----------------------------------------------------------------------
    const [existingRoleCode] = await pool.query<RoleRow[]>(
      `SELECT id, roleCode, trashedAt
       FROM roles
       WHERE roleCode = ?
       LIMIT 1`,
      [normalizedRoleCode],
    );

    if (existingRoleCode.length) {
      res.status(409).json({
        success: false,
        message: `Role code "${normalizedRoleCode}" already exists`,
        field: "roleCode",
      });
      return;
    }

    // -----------------------------------------------------------------------
    // Normalize status
    // -----------------------------------------------------------------------
    const roleStatus: "0" | "1" =
      status === true || status === "1" || status === 1
        ? "1"
        : "0";

    // -----------------------------------------------------------------------
    // Create role
    // -----------------------------------------------------------------------
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO roles
        (
          roleName,
          roleCode,
          description,
          status,
          createdAt,
          createdBy
        )
       VALUES
        (
          ?,
          ?,
          ?,
          ?,
          UNIX_TIMESTAMP(),
          ?
        )`,
      [
        normalizedRoleName,
        normalizedRoleCode,
        description?.trim() || null,
        roleStatus,
        userId,
      ],
    );

    // -----------------------------------------------------------------------
    // Get created role
    // -----------------------------------------------------------------------
    const [newRole] = await pool.query<RoleRow[]>(
      `SELECT
          id,
          roleName,
          roleCode,
          description,
          status,
          createdAt,
          createdBy,
          updatedAt,
          updatedBy
       FROM roles
       WHERE id = ?`,
      [result.insertId],
    );

    res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: newRole[0],
    });
  } catch (error: any) {
    // -----------------------------------------------------------------------
    // Final DB-level duplicate protection
    //
    // Even after checking above, another request could create the same role
    // between the SELECT and INSERT. MySQL UNIQUE constraint protects us.
    // Convert that DB error into a proper API response instead of 500.
    // -----------------------------------------------------------------------
    if (error?.code === "ER_DUP_ENTRY") {
      const duplicateMessage = String(error?.sqlMessage || "");

      if (duplicateMessage.includes("role_name")) {
        res.status(409).json({
          success: false,
          message: `Role "${req.body?.roleName?.trim()}" already exists`,
          field: "roleName",
        });
        return;
      }

      if (duplicateMessage.includes("role_code")) {
        res.status(409).json({
          success: false,
          message: `Role code "${req.body?.roleCode?.trim()?.toUpperCase()}" already exists`,
          field: "roleCode",
        });
        return;
      }

      res.status(409).json({
        success: false,
        message: "A role with the same unique value already exists",
      });
      return;
    }

    next(error);
  }
};

// ---------------------------------------------------------------------------
// PUT /roles/:id
// ---------------------------------------------------------------------------
export const updateRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId ?? null;
    const { id } = req.params;

    // -----------------------------------------------------------------------
    // Check current role
    // -----------------------------------------------------------------------
    const [existing] = await pool.query<RoleRow[]>(
      `SELECT
          id,
          roleName,
          roleCode
       FROM roles
       WHERE id = ? AND trashedAt IS NULL
       LIMIT 1`,
      [id],
    );

    if (!existing.length) {
      res.status(404).json({
        success: false,
        message: "Role not found",
      });
      return;
    }

    const {
      roleName,
      roleCode,
      description,
      status,
    } = req.body;

    const fields: string[] = [];
    const values: unknown[] = [];

    // -----------------------------------------------------------------------
    // Role name
    // -----------------------------------------------------------------------
    if (roleName !== undefined) {
      if (!roleName?.trim()) {
        res.status(400).json({
          success: false,
          message: "roleName cannot be empty",
        });
        return;
      }

      const normalizedRoleName = roleName.trim();

      // Only check when the name is actually changing
      if (normalizedRoleName !== existing[0].roleName) {
        const [duplicateName] = await pool.query<RoleRow[]>(
          `SELECT id, roleName
           FROM roles
           WHERE roleName = ?
             AND id != ?
           LIMIT 1`,
          [normalizedRoleName, id],
        );

        if (duplicateName.length) {
          res.status(409).json({
            success: false,
            message: `Role "${normalizedRoleName}" already exists`,
            field: "roleName",
          });
          return;
        }
      }

      fields.push("roleName = ?");
      values.push(normalizedRoleName);
    }

    // -----------------------------------------------------------------------
    // Role code
    // -----------------------------------------------------------------------
    if (roleCode !== undefined) {
      if (!roleCode?.trim()) {
        res.status(400).json({
          success: false,
          message: "roleCode cannot be empty",
        });
        return;
      }

      const newCode = roleCode.trim().toUpperCase();

      if (newCode !== existing[0].roleCode) {
        const [duplicateCode] = await pool.query<RoleRow[]>(
          `SELECT id, roleCode
           FROM roles
           WHERE roleCode = ?
             AND id != ?
           LIMIT 1`,
          [newCode, id],
        );

        if (duplicateCode.length) {
          res.status(409).json({
            success: false,
            message: `Role code "${newCode}" already exists`,
            field: "roleCode",
          });
          return;
        }
      }

      fields.push("roleCode = ?");
      values.push(newCode);
    }

    // -----------------------------------------------------------------------
    // Description
    // -----------------------------------------------------------------------
    if (description !== undefined) {
      fields.push("description = ?");
      values.push(description?.trim() ?? null);
    }

    // -----------------------------------------------------------------------
    // Status
    // -----------------------------------------------------------------------
    if (status !== undefined) {
      const statusValue: "0" | "1" =
        status === true || status === "1" || status === 1
          ? "1"
          : "0";

      fields.push("status = ?");
      values.push(statusValue);
    }

    // -----------------------------------------------------------------------
    // Nothing to update
    // -----------------------------------------------------------------------
    if (!fields.length) {
      res.status(400).json({
        success: false,
        message: "No fields provided for update",
      });
      return;
    }

    fields.push(
      "updatedAt = UNIX_TIMESTAMP()",
      "updatedBy = ?",
    );

    values.push(userId, id);

    // -----------------------------------------------------------------------
    // Update role
    // -----------------------------------------------------------------------
    await pool.query<ResultSetHeader>(
      `UPDATE roles
       SET ${fields.join(", ")}
       WHERE id = ?`,
      values,
    );

    // -----------------------------------------------------------------------
    // Get updated role
    // -----------------------------------------------------------------------
    const [updated] = await pool.query<RoleRow[]>(
      `SELECT
          id,
          roleName,
          roleCode,
          description,
          status,
          createdAt,
          createdBy,
          updatedAt,
          updatedBy
       FROM roles
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: updated[0],
    });
  } catch (error: any) {
    // -----------------------------------------------------------------------
    // Final DB-level duplicate protection
    // -----------------------------------------------------------------------
    if (error?.code === "ER_DUP_ENTRY") {
      const duplicateMessage = String(error?.sqlMessage || "");

      if (duplicateMessage.includes("role_name")) {
        res.status(409).json({
          success: false,
          message: `Role "${req.body?.roleName?.trim()}" already exists`,
          field: "roleName",
        });
        return;
      }

      if (duplicateMessage.includes("role_code")) {
        res.status(409).json({
          success: false,
          message: `Role code "${req.body?.roleCode?.trim()?.toUpperCase()}" already exists`,
          field: "roleCode",
        });
        return;
      }

      res.status(409).json({
        success: false,
        message: "A role with the same unique value already exists",
      });
      return;
    }

    next(error);
  }
};

// ---------------------------------------------------------------------------
// DELETE /roles/:id — soft delete
// ---------------------------------------------------------------------------
export const deleteRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId ?? null;
    const { id } = req.params;

    const [existing] = await pool.query<RoleRow[]>(
      `SELECT id
       FROM roles
       WHERE id = ? AND trashedAt IS NULL
       LIMIT 1`,
      [id],
    );

    if (!existing.length) {
      res.status(404).json({
        success: false,
        message: "Role not found",
      });
      return;
    }

    await pool.query<ResultSetHeader>(
      `UPDATE roles
       SET
         trashedAt = UNIX_TIMESTAMP(),
         trashedBy = ?
       WHERE id = ?`,
      [userId, id],
    );

    res.status(200).json({
      success: true,
      message: "Role deleted successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};