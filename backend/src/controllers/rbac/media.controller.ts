import { Request, Response, NextFunction } from "express";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import path from "path";

import { pool } from "../../db/connection";
import { ApiError } from "../../utils/apiError";
import { sendSuccess } from "../../utils/response";
import config from "../../config";

// import { sendSuccess } from "../../utils/response";
import { attachMedia } from "../../services/mediaUse.service";
/**
 * ==========================================================
 * Upload Media
 * ==========================================================
 * CHANGE (module-wise storage): files are now saved into a
 * per-module subfolder (uploads/users/, uploads/employees/, ...)
 * by the Multer destination logic in upload.middleware.ts.
 *
 * fileURL is derived from `file.destination` — the actual absolute
 * path Multer wrote the file to — rather than re-implementing the
 * module-resolution logic here a second time. This keeps a single
 * source of truth: whatever folder Multer picked is exactly what
 * gets stored in the DB, so the two can never drift out of sync.
 *
 * Response format, media table structure, and everything else below
 * is unchanged.
 */
export const uploadMedia = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const connection = await pool.getConnection();

  try {
    if (!req.file) {
      throw ApiError.badRequest("Please select a file");
    }

    if (!req.user || !req.user.userId) {
      throw ApiError.unauthorized("User not authenticated");
    }

const { title, altText, objectID, objectType } = req.body;
    const createdBy = req.user.userId;

    const file = req.file;

    const extension = path.extname(file.originalname).toLowerCase();

    let mediaType = "other";

    if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(extension)) {
      mediaType = "image";
    } else if ([".mp4", ".avi", ".mov", ".mkv"].includes(extension)) {
      mediaType = "video";
    } else if (extension === ".pdf") {
      mediaType = "pdf";
    } else if ([".xls", ".xlsx"].includes(extension)) {
      mediaType = "excel";
    } else if (extension === ".csv") {
      mediaType = "csv";
    }

    const createdOn = Math.floor(Date.now() / 1000);

    // Build "uploads/<module>/<filename>" from the actual folder Multer
    // wrote to (file.destination), e.g. "<uploadPath>/users" -> "users".
    const moduleFolder = path
      .relative(config.upload.path, file.destination)
      .split(path.sep)
      .join("/");
    const fileURL = moduleFolder
      ? `uploads/${moduleFolder}/${file.filename}`
      : `uploads/${file.filename}`;

    await connection.beginTransaction();

    const [result] = await connection.query<ResultSetHeader>(
      `
      INSERT INTO media
      (
        title,
        orgFileName,
        altText,
        mediaType,
        mimeType,
        fileURL,
        fileExtension,
        createdOn,
        createdBy
      )
      VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        title || file.originalname,
        file.originalname,
        altText || null,
        mediaType,
        file.mimetype,
        fileURL,
        extension.replace(".", ""),
        createdOn,
        createdBy ?? null,
      ],
    );

    if (result.affectedRows === 0) {
      throw ApiError.internal("Failed to upload media");
    }

        /**
     * ==========================================================
     * Attach Media (Optional)
     * ==========================================================
     * If objectID and objectType are supplied, create the mapping
     * in media_uses using the reusable service.
     */
    if (objectID && objectType) {
      await attachMedia(connection, {
        objectType,
        objectID: Number(objectID),
        mediaID: result.insertId,
        title: title || file.originalname,
        altText: altText || null,
      });
    }


    

    await connection.commit();

    sendSuccess(
      res,
      "Media uploaded successfully",
      {
        mediaId: result.insertId,
        fileName: file.filename,
        fileURL,
      },
      201,
    );
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * ==========================================================
 * Get All Media
 * ==========================================================
 */
export const getAllMedia = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        id,
        title,
        orgFileName,
        altText,
        mediaType,
        mimeType,
        fileURL,
        thumbnail,
        fileExtension,
        embedSource,
        embedCode,
        createdOn,
        createdBy,
        updatedOn,
        updatedBy
      FROM media
      WHERE (trashedOn IS NULL OR trashedOn = 0)
      ORDER BY id DESC
      `,
    );

    sendSuccess(res, "Media fetched successfully", rows);
  } catch (error) {
    next(error);
  }
};

/**
 * ==========================================================
 * Get Media By ID
 * ==========================================================
 */
export const getMediaById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT *
      FROM media
      WHERE id = ?
      AND (trashedOn IS NULL OR trashedOn = 0)
      LIMIT 1
      `,
      [id],
    );

    if (rows.length === 0) {
      throw ApiError.notFound("Media not found");
    }

    sendSuccess(res, "Media fetched successfully", rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * ==========================================================
 * Delete Media (Soft Delete)
 * ==========================================================
 */
export const deleteMedia = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { trashedBy } = req.body;

    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT id
      FROM media
      WHERE id = ?
      AND (trashedOn IS NULL OR trashedOn = 0)
      `,
      [id],
    );

    if (rows.length === 0) {
      throw ApiError.notFound("Media not found");
    }

    await pool.query<ResultSetHeader>(
      `
      UPDATE media
      SET
        trashedOn = ?,
        trashedBy = ?
      WHERE id = ?
      `,
      [Math.floor(Date.now() / 1000), trashedBy ?? null, id],
    );

    sendSuccess(res, "Media deleted successfully");
  } catch (error) {
    next(error);
  }
};