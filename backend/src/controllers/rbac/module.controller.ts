import { Request, Response, NextFunction } from "express";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import slugify from "slugify";
import { pool } from "../../db/connection";
import { ApiError } from "../../utils/apiError";

/**
 * Get All Modules
 */
export const listModules = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        id,
        moduleName,
        slug,
        parentId,
        path,
        icon,
        status,
        createdAt,
        createdBy,
        updatedAt,
        updatedBy
      FROM modules
      WHERE trashedAt IS NULL
      ORDER BY id DESC
      `,
    );

    res.status(200).json({
      success: true,
      message: "Modules fetched successfully",
      data: rows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Module By ID
 */
export const getModule = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);

    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT *
      FROM modules
      WHERE id = ?
      AND trashedAt IS NULL
      `,
      [id],
    );

    if (rows.length === 0) {
      throw new ApiError("Module not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Module fetched successfully",
      data: rows[0],
    });
  } catch (error) {
    next(error);
  }
};/**
 * Create Module
 */
export const createModule = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      moduleName,
      parentId,
      path,
      icon,
      status,
      createdBy,
    } = req.body;

    // Validate module name
    if (!moduleName) {
      throw new ApiError("Module name is required", 400);
    }

    // Generate slug automatically
    const slug = slugify(moduleName, {
      lower: true,
      strict: true,
      trim: true,
    });

    // Check duplicate module name
    const [moduleExists] = await pool.query<RowDataPacket[]>(
      `
      SELECT id
      FROM modules
      WHERE moduleName = ?
      AND trashedAt IS NULL
      `,
      [moduleName],
    );

    if (moduleExists.length > 0) {
      throw new ApiError("Module name already exists", 409);
    }

    // Check duplicate slug
    const [slugExists] = await pool.query<RowDataPacket[]>(
      `
      SELECT id
      FROM modules
      WHERE slug = ?
      AND trashedAt IS NULL
      `,
      [slug],
    );

    if (slugExists.length > 0) {
      throw new ApiError("Slug already exists", 409);
    }

    const createdAt = Math.floor(Date.now() / 1000);

    const [result] = await pool.query<ResultSetHeader>(
      `
      INSERT INTO modules
      (
        moduleName,
        slug,
        parentId,
        path,
        icon,
        status,
        createdAt,
        createdBy
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        moduleName,
        slug,
        parentId || null,
        path || null,
        icon || null,
        status ?? 1,
        createdAt,
        createdBy || null,
      ],
    );

    res.status(201).json({
      success: true,
      message: "Module created successfully",
      id: result.insertId,
    });

  } catch (error) {
    next(error);
  }
};/**
 * Update Module
 */
export const updateModule = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);

    const {
      moduleName,
      parentId,
      path,
      icon,
      status,
      updatedBy,
    } = req.body;

    // Check if module exists
    const [exists] = await pool.query<RowDataPacket[]>(
      `
      SELECT id
      FROM modules
      WHERE id = ?
      AND trashedAt IS NULL
      `,
      [id],
    );

    if (exists.length === 0) {
      throw new ApiError("Module not found", 404);
    }

    // Generate new slug
    const slug = slugify(moduleName, {
      lower: true,
      strict: true,
      trim: true,
    });

    // Check if another module already has this slug
    const [slugExists] = await pool.query<RowDataPacket[]>(
      `
      SELECT id
      FROM modules
      WHERE slug = ?
      AND id <> ?
      AND trashedAt IS NULL
      `,
      [slug, id],
    );

    if (slugExists.length > 0) {
      throw new ApiError("Slug already exists", 409);
    }

    const updatedAt = Math.floor(Date.now() / 1000);

    await pool.query(
      `
      UPDATE modules
      SET
        moduleName = ?,
        slug = ?,
        parentId = ?,
        path = ?,
        icon = ?,
        status = ?,
        updatedAt = ?,
        updatedBy = ?
      WHERE id = ?
      `,
      [
        moduleName,
        slug,
        parentId || null,
        path || null,
        icon || null,
        status,
        updatedAt,
        updatedBy || null,
        id,
      ],
    );

    res.status(200).json({
      success: true,
      message: "Module updated successfully",
    });

  } catch (error) {
    next(error);
  }
};
/**
 * Delete Module (Soft Delete)
 */
export const deleteModule = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);

    // Check if module exists
    const [exists] = await pool.query<RowDataPacket[]>(
      `
      SELECT id
      FROM modules
      WHERE id = ?
      AND trashedAt IS NULL
      `,
      [id],
    );

    if (exists.length === 0) {
      throw new ApiError("Module not found", 404);
    }

    const trashedAt = Math.floor(Date.now() / 1000);

    await pool.query(
      `
      UPDATE modules
      SET
        trashedAt = ?,
        trashedBy = ?
      WHERE id = ?
      `,
      [
        trashedAt,
        req.body.trashedBy || null,
        id,
      ],
    );

    res.status(200).json({
      success: true,
      message: "Module deleted successfully",
    });

  } catch (error) {
    next(error);
  }
};