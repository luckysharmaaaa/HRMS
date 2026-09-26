// ```typescript
import { Request, Response, NextFunction } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../db/connection";
import { sendSuccess } from "../utils/response";

/**
 * ==========================================================
 * Get All Departments
 * ==========================================================
 */
export const getDepartments = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const [departments] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        id,
        departmentName,
        description,
        status
      FROM department
      WHERE
        trashedAt IS NULL
      ORDER BY departmentName ASC
      `,
    );

    const formattedDepartments = departments.map((department) => ({
      id: department.id,
      name: department.departmentName,
      description: department.description || "",
      status: String(department.status) === "1"
        ? "Active"
        : "Inactive",
    }));

    sendSuccess(
      res,
      "Departments fetched successfully",
      formattedDepartments,
    );
  } catch (error) {
    next(error);
  }
};

/**
 * ==========================================================
 * Create Department
 * ==========================================================
 */
export const createDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      departmentName,
      description,
      status,
    } = req.body;

    // Validate department name
    if (!departmentName || !departmentName.trim()) {
      return next(
        new Error("Department name is required"),
      );
    }

    const departmentStatus =
      status === "Inactive" || status === "0"
        ? "0"
        : "1";

    const departmentDescription =
      description?.trim() || null;

    const [result] = await pool.query<ResultSetHeader>(
      `
      INSERT INTO department
      (
        departmentName,
        description,
        status
      )
      VALUES
      (?, ?, ?)
      `,
      [
        departmentName.trim(),
        departmentDescription,
        departmentStatus,
      ],
    );

    sendSuccess(
      res,
      "Department created successfully",
      {
        id: result.insertId,
        name: departmentName.trim(),
        description: departmentDescription || "",
        status:
          departmentStatus === "1"
            ? "Active"
            : "Inactive",
      },
    );
  } catch (error) {
    next(error);
  }
};

/**
 * ==========================================================
 * Update Department
 * ==========================================================
 */
export const updateDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const {
      departmentName,
      description,
      status,
    } = req.body;

    // Validate department name
    if (!departmentName || !departmentName.trim()) {
      return next(
        new Error("Department name is required"),
      );
    }

    const departmentStatus =
      status === "Inactive" || status === "0"
        ? "0"
        : "1";

    const departmentDescription =
      description?.trim() || null;

    const [result] = await pool.query<ResultSetHeader>(
      `
      UPDATE department
      SET
        departmentName = ?,
        description = ?,
        status = ?
      WHERE
        id = ?
        AND trashedAt IS NULL
      `,
      [
        departmentName.trim(),
        departmentDescription,
        departmentStatus,
        id,
      ],
    );

    if (result.affectedRows === 0) {
      return next(
        new Error("Department not found"),
      );
    }

    sendSuccess(
      res,
      "Department updated successfully",
      {
        id: Number(id),
        name: departmentName.trim(),
        description: departmentDescription || "",
        status:
          departmentStatus === "1"
            ? "Active"
            : "Inactive",
      },
    );
  } catch (error) {
    next(error);
  }
};

/**
 * ==========================================================
 * Delete Department
 * Soft Delete
 * ==========================================================
 */
export const deleteDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    /*
     * trashedAt is stored as an integer timestamp.
     * Therefore, do not use NOW().
     */
    const trashedAt = Math.floor(
      Date.now() / 1000,
    );

    const [result] = await pool.query<ResultSetHeader>(
      `
      UPDATE department
      SET
        trashedAt = ?
      WHERE
        id = ?
        AND trashedAt IS NULL
      `,
      [
        trashedAt,
        id,
      ],
    );

    if (result.affectedRows === 0) {
      return next(
        new Error("Department not found"),
      );
    }

    sendSuccess(
      res,
      "Department deleted successfully",
      {
        id: Number(id),
      },
    );
  } catch (error) {
    next(error);
  }
};
// ```
