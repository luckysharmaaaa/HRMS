import { Request, Response, NextFunction } from "express";
import { RowDataPacket, ResultSetHeader } from "mysql2";

import { pool } from "../../db/connection";
import { ApiError } from "../../utils/apiError";
import { sendSuccess } from "../../utils/response";
import { createAddress as createAddressRecord } from "../../services/address.service";

/**
 * ==========================================================
 * Create Address
 * ==========================================================
 * NOTE: The actual insert (and "only one default address" logic)
 * now lives in services/address.service.ts so that this same
 * logic can be reused by the User module's createUser transaction
 * without duplicating SQL. This controller keeps its own
 * request validation and transaction boundaries; only the insert
 * itself is delegated to the shared service.
 */
export const createAddress = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const connection = await pool.getConnection();

  try {
    const {
      addressType,
      ownerType,
      ownerID,
      fullName,
      houseNumber,
      addressLine1,
      addressLine2,
      landmark,
      locality,
      zipCode,
      state,
      city,
      countryID,
      countryCode,
      phoneCode,
      phone,
      latitude,
      longitude,
      isDefault,
      createdBy,
    } = req.body;

    // =========================
    // Required Validation
    // =========================

    if (!addressType) {
      throw ApiError.badRequest("Address type is required");
    }

    if (!ownerType) {
      throw ApiError.badRequest("Owner type is required");
    }

    if (!ownerID) {
      throw ApiError.badRequest("Owner ID is required");
    }

    if (!addressLine1) {
      throw ApiError.badRequest("Address Line 1 is required");
    }

    if (!zipCode) {
      throw ApiError.badRequest("Zip Code is required");
    }

    if (!state) {
      throw ApiError.badRequest("State is required");
    }

    if (!city) {
      throw ApiError.badRequest("City is required");
    }

    if (!countryID) {
      throw ApiError.badRequest("Country is required");
    }

    if (!countryCode) {
      throw ApiError.badRequest("Country Code is required");
    }

    if (!phoneCode) {
      throw ApiError.badRequest("Phone Code is required");
    }

    await connection.beginTransaction();

    // =========================
    // Insert Address (via reusable AddressService)
    // =========================
    const insertId = await createAddressRecord(connection, {
      ownerType,
      ownerID,
      fullName,
      createdBy,
      address: {
        addressType,
        houseNumber,
        addressLine1,
        addressLine2,
        landmark,
        locality,
        zipCode,
        state,
        city,
        countryID,
        countryCode,
        phoneCode,
        phone,
        latitude,
        longitude,
        isDefault,
      },
    });

    await connection.commit();

    sendSuccess(
      res,
      "Address created successfully",
      {
        id: insertId,
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
 * Get All Addresses
 * ==========================================================
 */
export const getAllAddresses = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        id,
        addressType,
        ownerType,
        ownerID,
        fullName,
        houseNumber,
        addressLine1,
        addressLine2,
        landmark,
        locality,
        zipCode,
        state,
        city,
        countryID,
        countryCode,
        phoneCode,
        phone,
        latitude,
        longitude,
        isDefault,
        createdOn,
        createdBy,
        updatedOn,
        updatedBy
      FROM address_info
      WHERE trashedOn IS NULL
      ORDER BY id DESC
      `,
    );

    sendSuccess(res, "Addresses fetched successfully", rows);
  } catch (error) {
    next(error);
  }
};

/**
 * ==========================================================
 * Get Address By ID
 * ==========================================================
 */
export const getAddressById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        id,
        addressType,
        ownerType,
        ownerID,
        fullName,
        houseNumber,
        addressLine1,
        addressLine2,
        landmark,
        locality,
        zipCode,
        state,
        city,
        countryID,
        countryCode,
        phoneCode,
        phone,
        latitude,
        longitude,
        isDefault,
        createdOn,
        createdBy,
        updatedOn,
        updatedBy
      FROM address_info
      WHERE id = ?
      AND trashedOn IS NULL
      LIMIT 1
      `,
      [id],
    );

    if (rows.length === 0) {
      throw ApiError.notFound("Address not found");
    }

    sendSuccess(res, "Address fetched successfully", rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * ==========================================================
 * Get Address By Owner
 * ==========================================================
 */
export const getAddressByOwner = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { ownerType, ownerID } = req.params;

    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        id,
        addressType,
        ownerType,
        ownerID,
        fullName,
        houseNumber,
        addressLine1,
        addressLine2,
        landmark,
        locality,
        zipCode,
        state,
        city,
        countryID,
        countryCode,
        phoneCode,
        phone,
        latitude,
        longitude,
        isDefault,
        createdOn,
        createdBy,
        updatedOn,
        updatedBy
      FROM address_info
      WHERE ownerType = ?
      AND ownerID = ?
      AND trashedOn IS NULL
      ORDER BY isDefault DESC, id DESC
      `,
      [ownerType, ownerID],
    );

    sendSuccess(res, "Addresses fetched successfully", rows);
  } catch (error) {
    next(error);
  }
};
/**
 * ==========================================================
 * Update Address
 * ==========================================================
 */
export const updateAddress = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;

    const {
      addressType,
      fullName,
      houseNumber,
      addressLine1,
      addressLine2,
      landmark,
      locality,
      zipCode,
      state,
      city,
      countryID,
      countryCode,
      phoneCode,
      phone,
      latitude,
      longitude,
      isDefault,
      updatedBy,
    } = req.body;

    const [rows] = await connection.query<RowDataPacket[]>(
      `
      SELECT *
      FROM address_info
      WHERE id = ?
      AND trashedOn IS NULL
      LIMIT 1
      `,
      [id],
    );

    if (rows.length === 0) {
      throw ApiError.notFound("Address not found");
    }

    const existingAddress = rows[0];

    await connection.beginTransaction();

    // Only one default address for an owner
    if (Number(isDefault) === 1) {
      await connection.query(
        `
        UPDATE address_info
        SET isDefault = 0
        WHERE ownerType = ?
        AND ownerID = ?
        `,
        [existingAddress.ownerType, existingAddress.ownerID],
      );
    }

    const updatedOn = Math.floor(Date.now() / 1000);

    const [result] = await connection.query<ResultSetHeader>(
      `
      UPDATE address_info
      SET
        addressType = ?,
        fullName = ?,
        houseNumber = ?,
        addressLine1 = ?,
        addressLine2 = ?,
        landmark = ?,
        locality = ?,
        zipCode = ?,
        state = ?,
        city = ?,
        countryID = ?,
        countryCode = ?,
        phoneCode = ?,
        phone = ?,
        latitude = ?,
        longitude = ?,
        isDefault = ?,
        updatedOn = ?,
        updatedBy = ?
      WHERE id = ?
      `,
      [
        addressType,
        fullName ?? null,
        houseNumber ?? null,
        addressLine1,
        addressLine2 ?? null,
        landmark ?? null,
        locality ?? null,
        zipCode,
        state,
        city,
        countryID,
        countryCode,
        phoneCode,
        phone ?? null,
        latitude ?? null,
        longitude ?? null,
        Number(isDefault) || 0,
        updatedOn,
        updatedBy ?? null,
        id,
      ],
    );

    if (result.affectedRows === 0) {
      throw ApiError.internal("Failed to update address");
    }

    await connection.commit();

    sendSuccess(res, "Address updated successfully");
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * ==========================================================
 * Delete Address (Soft Delete)
 * ==========================================================
 */
export const deleteAddress = async (
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
      FROM address_info
      WHERE id = ?
      AND trashedOn IS NULL
      LIMIT 1
      `,
      [id],
    );

    if (rows.length === 0) {
      throw ApiError.notFound("Address not found");
    }

    const trashedOn = Math.floor(Date.now() / 1000);

    const [result] = await pool.query<ResultSetHeader>(
      `
      UPDATE address_info
      SET
        trashedOn = ?,
        trashedBy = ?
      WHERE id = ?
      `,
      [trashedOn, trashedBy ?? null, id],
    );

    if (result.affectedRows === 0) {
      throw ApiError.internal("Failed to delete address");
    }

    sendSuccess(res, "Address deleted successfully");
  } catch (error) {
    next(error);
  }
};