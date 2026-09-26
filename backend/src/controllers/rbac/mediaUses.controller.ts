  import { Request, Response, NextFunction } from "express";
  import { RowDataPacket, ResultSetHeader } from "mysql2";

  import { pool } from "../../db/connection";
  import { ApiError } from "../../utils/apiError";
  import { sendSuccess } from "../../utils/response";

  /**
   * ==========================================================
   * Create Media Mapping
   * POST /api/v1/media-uses
   * ==========================================================
   */
  export const createMediaUses = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const connection = await pool.getConnection();

    try {
      const {
        objectType,
        objectID,
        mediaID,
        title,
        altText,
        priority,
        target,
        data,
        status,
      } = req.body;

      if (!objectType) {
        throw ApiError.badRequest("Object Type is required");
      }

      if (!objectID) {
        throw ApiError.badRequest("Object ID is required");
      }

      if (!mediaID) {
        throw ApiError.badRequest("Media ID is required");
      }

      await connection.beginTransaction();

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
          target,
          data,
          status
        )
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          objectType,
          objectID,
          mediaID,
          title ?? null,
          altText ?? null,
          priority ?? 1,
          target ? JSON.stringify(target) : null,
          data ? JSON.stringify(data) : null,
          status ?? 1,
        ],
      );

      if (result.affectedRows === 0) {
        throw ApiError.internal("Failed to create media mapping");
      }

      await connection.commit();

      sendSuccess(
        res,
        "Media mapped successfully",
        {
          id: result.insertId,
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
   * Get Media By Object
   * GET /api/v1/media-uses/:objectType/:objectID
   * ==========================================================
   */
  export const getMediaUsesByObject = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { objectType, objectID } = req.params;

      const [rows] = await pool.query<RowDataPacket[]>(
        `
        SELECT
            mu.id,
            mu.objectType,
            mu.objectID,
            mu.priority,
            mu.status,
            mu.title,
            mu.altText,
            m.id AS mediaID,
            m.fileURL,
            m.mediaType,
            m.mimeType,
            m.orgFileName
        FROM media_uses mu
        INNER JOIN media m
        ON m.id = mu.mediaID
        WHERE mu.objectType = ?
        AND mu.objectID = ?
        AND mu.status = 1
        ORDER BY mu.priority ASC, mu.id DESC
        `,
        [objectType, objectID],
      );

      sendSuccess(res, "Media fetched successfully", rows);
    } catch (error) {
      next(error);
    }
  };

  /**
   * ==========================================================
   * Delete Media Mapping
   * DELETE /api/v1/media-uses/:id
   * ==========================================================
   */
  export const deleteMediaUses = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const [rows] = await pool.query<RowDataPacket[]>(
        `
        SELECT id
        FROM media_uses
        WHERE id = ?
        LIMIT 1
        `,
        [id],
      );

      if (rows.length === 0) {
        throw ApiError.notFound("Media mapping not found");
      }

      await pool.query<ResultSetHeader>(
        `
        DELETE FROM media_uses
        WHERE id = ?
        `,
        [id],
      );

      sendSuccess(res, "Media mapping deleted successfully");
    } catch (error) {
      next(error);
    }
  };