import { Request, Response, NextFunction } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../db/connection";
import { sendSuccess } from "../utils/response";

// ==========================================================
// GET ALL DESIGNATIONS
// ==========================================================

export const getDesignations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [designations] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        d.id,
        d.departmentId,
        d.designationName,
        d.description,
        d.status,
        d.createdAt,
        d.createdBy,
        dept.departmentName
      FROM designation d
      LEFT JOIN department dept
        ON dept.id = d.departmentId
      WHERE d.trashedAt IS NULL
      ORDER BY d.designationName ASC
      `
    );

    const formattedDesignations = designations.map((item) => ({
      id: item.id,
      departmentId: item.departmentId,
      designationName: item.designationName,
      description: item.description,
      departmentName: item.departmentName || "",
      status: String(item.status) === "1" ? "Active" : "Inactive",
      createdAt: item.createdAt,
      createdBy: item.createdBy,
    }));

    sendSuccess(
      res,
      "Designations fetched successfully",
      formattedDesignations
    );
  } catch (error) {
    next(error);
  }
};

// ==========================================================
// CREATE DESIGNATION
// ==========================================================

export const createDesignation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      departmentId,
      designationName,
      description,
      status,
    } = req.body;

    // ------------------------------------------------------
    // Validation
    // ------------------------------------------------------

    if (
      departmentId === undefined ||
      departmentId === null ||
      departmentId === ""
    ) {
      res.status(400).json({
        success: false,
        message: "Department is required",
      });
      return;
    }

    if (
      !designationName ||
      !designationName.trim()
    ) {
      res.status(400).json({
        success: false,
        message: "Designation name is required",
      });
      return;
    }

    // ------------------------------------------------------
    // Convert department ID
    // ------------------------------------------------------

    const departmentIdNumber = Number(departmentId);

    if (
      !Number.isInteger(departmentIdNumber) ||
      departmentIdNumber <= 0
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid department",
      });
      return;
    }

    // ------------------------------------------------------
    // Convert status
    // DB: ENUM('0','1')
    // ------------------------------------------------------

    let statusValue = "1";

    if (
      status === "0" ||
      status === 0 ||
      status === "Inactive"
    ) {
      statusValue = "0";
    } else if (
      status === "1" ||
      status === 1 ||
      status === "Active"
    ) {
      statusValue = "1";
    }

    // ------------------------------------------------------
    // Check department exists
    // ------------------------------------------------------

    const [department] =
      await pool.query<RowDataPacket[]>(
        `
        SELECT id
        FROM department
        WHERE id = ?
          AND trashedAt IS NULL
        LIMIT 1
        `,
        [departmentIdNumber]
      );

    if (department.length === 0) {
      res.status(404).json({
        success: false,
        message: "Department not found",
      });
      return;
    }

    // ------------------------------------------------------
    // Check duplicate designation
    // ------------------------------------------------------

    const [existingDesignation] =
      await pool.query<RowDataPacket[]>(
        `
        SELECT id
        FROM designation
        WHERE designationName = ?
          AND departmentId = ?
          AND trashedAt IS NULL
        LIMIT 1
        `,
        [
          designationName.trim(),
          departmentIdNumber,
        ]
      );

    if (existingDesignation.length > 0) {
      res.status(409).json({
        success: false,
        message:
          "Designation already exists for this department",
      });
      return;
    }

    // ------------------------------------------------------
    // Logged-in user
    // ------------------------------------------------------

    const createdBy =
      (req as any).user?.userId ?? null;

    // ------------------------------------------------------
    // Created timestamp
    // ------------------------------------------------------

    const createdAt = Math.floor(
      Date.now() / 1000
    );

    // ------------------------------------------------------
    // Insert designation
    // ------------------------------------------------------

    const [result] =
      await pool.query<ResultSetHeader>(
        `
        INSERT INTO designation (
          departmentId,
          designationName,
          description,
          status,
          createdAt,
          createdBy
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          departmentIdNumber,
          designationName.trim(),
          description?.trim() || null,
          statusValue,
          createdAt,
          createdBy,
        ]
      );

    // ------------------------------------------------------
    // Response
    // ------------------------------------------------------

    sendSuccess(
      res,
      "Designation created successfully",
      {
        id: result.insertId,
        departmentId: departmentIdNumber,
        designationName:
          designationName.trim(),
        description:
          description?.trim() || null,
        status:
          statusValue === "1"
            ? "Active"
            : "Inactive",
      }
    );
  } catch (error) {
    next(error);
  }
};

// ==========================================================
// UPDATE DESIGNATION
// ==========================================================

export const updateDesignation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const {
      departmentId,
      designationName,
      description,
      status,
    } = req.body;

    // ------------------------------------------------------
    // Validation
    // ------------------------------------------------------

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Designation ID is required",
      });
      return;
    }

    if (
      departmentId === undefined ||
      departmentId === null ||
      departmentId === ""
    ) {
      res.status(400).json({
        success: false,
        message: "Department is required",
      });
      return;
    }

    if (
      !designationName ||
      !designationName.trim()
    ) {
      res.status(400).json({
        success: false,
        message: "Designation name is required",
      });
      return;
    }

    const designationId = Number(id);
    const departmentIdNumber = Number(
      departmentId
    );

    if (
      !Number.isInteger(designationId) ||
      designationId <= 0
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid designation ID",
      });
      return;
    }

    if (
      !Number.isInteger(departmentIdNumber) ||
      departmentIdNumber <= 0
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid department",
      });
      return;
    }

    // ------------------------------------------------------
    // Convert status
    // DB: ENUM('0','1')
    // ------------------------------------------------------

    let statusValue = "1";

    if (
      status === "0" ||
      status === 0 ||
      status === "Inactive"
    ) {
      statusValue = "0";
    } else if (
      status === "1" ||
      status === 1 ||
      status === "Active"
    ) {
      statusValue = "1";
    }

    // ------------------------------------------------------
    // Check department exists
    // ------------------------------------------------------

    const [department] =
      await pool.query<RowDataPacket[]>(
        `
        SELECT id
        FROM department
        WHERE id = ?
          AND trashedAt IS NULL
        LIMIT 1
        `,
        [departmentIdNumber]
      );

    if (department.length === 0) {
      res.status(404).json({
        success: false,
        message: "Department not found",
      });
      return;
    }

    // ------------------------------------------------------
    // Check designation exists
    // ------------------------------------------------------

    const [existingDesignation] =
      await pool.query<RowDataPacket[]>(
        `
        SELECT id
        FROM designation
        WHERE id = ?
          AND trashedAt IS NULL
        LIMIT 1
        `,
        [designationId]
      );

    if (existingDesignation.length === 0) {
      res.status(404).json({
        success: false,
        message: "Designation not found",
      });
      return;
    }

    // ------------------------------------------------------
    // Check duplicate designation
    // ------------------------------------------------------

    const [duplicateDesignation] =
      await pool.query<RowDataPacket[]>(
        `
        SELECT id
        FROM designation
        WHERE designationName = ?
          AND departmentId = ?
          AND id != ?
          AND trashedAt IS NULL
        LIMIT 1
        `,
        [
          designationName.trim(),
          departmentIdNumber,
          designationId,
        ]
      );

    if (duplicateDesignation.length > 0) {
      res.status(409).json({
        success: false,
        message:
          "Designation already exists for this department",
      });
      return;
    }

    // ------------------------------------------------------
    // Updated timestamp
    // ------------------------------------------------------

    const updatedAt = Math.floor(
      Date.now() / 1000
    );

    // ------------------------------------------------------
    // Logged-in user
    // ------------------------------------------------------

    const updatedBy =
      (req as any).user?.userId ?? null;

    // ------------------------------------------------------
    // Update designation
    // ------------------------------------------------------

    await pool.query<ResultSetHeader>(
      `
      UPDATE designation
      SET
        departmentId = ?,
        designationName = ?,
        description = ?,
        status = ?,
        updatedAt = ?,
        updatedBy = ?
      WHERE id = ?
        AND trashedAt IS NULL
      `,
      [
        departmentIdNumber,
        designationName.trim(),
        description?.trim() || null,
        statusValue,
        updatedAt,
        updatedBy,
        designationId,
      ]
    );

    // ------------------------------------------------------
    // Response
    // ------------------------------------------------------

    sendSuccess(
      res,
      "Designation updated successfully",
      {
        id: designationId,
        departmentId: departmentIdNumber,
        designationName:
          designationName.trim(),
        description:
          description?.trim() || null,
        status:
          statusValue === "1"
            ? "Active"
            : "Inactive",
      }
    );
  } catch (error) {
    next(error);
  }
};

// ==========================================================
// DELETE DESIGNATION
// ==========================================================

export const deleteDesignation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // ------------------------------------------------------
    // Validation
    // ------------------------------------------------------

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Designation ID is required",
      });
      return;
    }

    const designationId = Number(id);

    if (
      !Number.isInteger(designationId) ||
      designationId <= 0
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid designation ID",
      });
      return;
    }

    // ------------------------------------------------------
    // Check designation exists
    // ------------------------------------------------------

    const [existingDesignation] =
      await pool.query<RowDataPacket[]>(
        `
        SELECT id
        FROM designation
        WHERE id = ?
          AND trashedAt IS NULL
        LIMIT 1
        `,
        [designationId]
      );

    if (existingDesignation.length === 0) {
      res.status(404).json({
        success: false,
        message: "Designation not found",
      });
      return;
    }

    // ------------------------------------------------------
    // Soft delete
    // ------------------------------------------------------

    const trashedAt = Math.floor(
      Date.now() / 1000
    );

    const trashedBy =
      (req as any).user?.userId ?? null;

    await pool.query<ResultSetHeader>(
      `
      UPDATE designation
      SET
        trashedAt = ?,
        trashedBy = ?
      WHERE id = ?
        AND trashedAt IS NULL
      `,
      [
        trashedAt,
        trashedBy,
        designationId,
      ]
    );

    // ------------------------------------------------------
    // Response
    // ------------------------------------------------------

    sendSuccess(
      res,
      "Designation deleted successfully",
      {
        id: designationId,
      }
    );
  } catch (error) {
    next(error);
  }
};