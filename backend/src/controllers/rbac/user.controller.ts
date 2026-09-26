import { Request, Response, NextFunction } from "express";
import { RowDataPacket } from "mysql2";

import { pool } from "../../db/connection";
import { ApiError } from "../../utils/apiError";
import { sendSuccess } from "../../utils/response";
import { isCompanyEmail, getCompanyEmailDomain } from "../../utils/Companyemail";

import {
  getUserById,
  createUserRecord,
  updateUserRecord,
} from "../../services/user.service";

import { createAddress } from "../../services/address.service";
import { attachMedia } from "../../services/mediaUse.service";

// ==========================================================
// USER ROLE MAPPING
// ==========================================================
// Adds new roles and removes roles that are no longer selected.

const mapUserRoles = async (
  connection: any,
  userId: number,
  roles: number[],
  createdBy?: number | null,
): Promise<void> => {
  if (!roles || !Array.isArray(roles)) {
    return;
  }

  const createdAt = Math.floor(Date.now() / 1000);

  // Get current roles of the user
  const [rows] = await connection.query(
    `
    SELECT roleId
    FROM user_roles
    WHERE userId = ?
    `,
    [userId],
  );

  const existingRoles = (rows as RowDataPacket[]).map(
    (row) => Number(row.roleId),
  );

  // Roles that need to be added
  const rolesToInsert = roles.filter(
    (roleId) => !existingRoles.includes(roleId),
  );

  // Roles that need to be removed
  const rolesToDelete = existingRoles.filter(
    (roleId) => !roles.includes(roleId),
  );

  // Delete removed roles
  if (rolesToDelete.length > 0) {
    await connection.query(
      `
      DELETE FROM user_roles
      WHERE userId = ?
      AND roleId IN (?)
      `,
      [userId, rolesToDelete],
    );
  }

  // Insert new roles
  for (const roleId of rolesToInsert) {
    await connection.query(
      `
      INSERT INTO user_roles
      (
        userId,
        roleId,
        createdAt,
        createdBy
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        userId,
        roleId,
        createdAt,
        createdBy ?? null,
      ],
    );
  }
};

// ==========================================================
// REPLACE USER PROFILE MEDIA
// ==========================================================

const replaceUserMedia = async (
  connection: any,
  userId: number,
  mediaId: number | null,
  title?: string | null,
): Promise<void> => {
  await connection.query(
    `
    DELETE FROM media_uses
    WHERE objectType = 'user'
    AND objectID = ?
    `,
    [userId],
  );

  if (mediaId) {
    await attachMedia(connection, {
      objectType: "user",
      objectID: userId,
      mediaID: mediaId,
      title: title ?? null,
    });
  }
};

// ==========================================================
// EMAIL / ALTERNATE EMAIL VALIDATION
// ==========================================================
// Rule:
//   - If `email` is provided, it MUST be the company domain.
//   - If the employee doesn't have a company email yet, leave `email`
//     empty and provide `alternateEmail` instead (their personal email,
//     used to sign in until HR assigns the company one).
//   - `alternateEmail`, if provided, must NOT itself be a company email
//     (that would defeat the point — use `email` for that).
//   - At least one of the two is required.

const validateEmailFields = (
  email: unknown,
  alternateEmail: unknown,
): { email: string | null; alternateEmail: string | null } => {
  const normalizedEmail = email
    ? String(email).trim().toLowerCase()
    : null;

  const normalizedAlternate = alternateEmail
    ? String(alternateEmail).trim().toLowerCase()
    : null;

  if (!normalizedEmail && !normalizedAlternate) {
    throw ApiError.badRequest(
      `Provide a company email (name@${getCompanyEmailDomain()}), or a personal email if the employee doesn't have one yet.`,
    );
  }

  if (normalizedEmail && !isCompanyEmail(normalizedEmail)) {
    throw ApiError.badRequest(
      `Company email must be a @${getCompanyEmailDomain()} address. Use the personal email field for employees without one yet.`,
    );
  }

  if (normalizedAlternate && isCompanyEmail(normalizedAlternate)) {
    throw ApiError.badRequest(
      `Personal email must not be a @${getCompanyEmailDomain()} address — use the company email field for that.`,
    );
  }

  return { email: normalizedEmail, alternateEmail: normalizedAlternate };
};

// ==========================================================
// LIST USERS
// ==========================================================

export const listUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const [users] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        u.id,
        u.firstName,
        u.lastName,
        u.email,
        u.alternateEmail,
        u.phone,
        u.status,
        u.createdAt,
        u.createdBy,
        u.updatedAt,
        u.updatedBy,

        GROUP_CONCAT(DISTINCT r.id) AS roleIds,
        GROUP_CONCAT(DISTINCT r.roleName) AS roleNames,

        MAX(pm.fileURL) AS profileImage

      FROM users u

      LEFT JOIN user_roles ur
        ON ur.userId = u.id
        AND ur.trashedAt IS NULL

      LEFT JOIN roles r
        ON r.id = ur.roleId
        AND r.trashedAt IS NULL

      LEFT JOIN (
        SELECT
          mu.objectID,
          m.fileURL,

          ROW_NUMBER() OVER (
            PARTITION BY mu.objectID
            ORDER BY mu.priority ASC, mu.id DESC
          ) AS rn

        FROM media_uses mu

        INNER JOIN media m
          ON m.id = mu.mediaID
          AND (
            m.trashedOn IS NULL
            OR m.trashedOn = 0
          )

        WHERE mu.objectType = 'user'
        AND mu.status = 1
      ) pm

        ON pm.objectID = u.id
        AND pm.rn = 1

      WHERE u.trashedAt IS NULL

      GROUP BY u.id

      ORDER BY u.id DESC
      `,
    );

    const formattedUsers = users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      alternateEmail: user.alternateEmail,
      phone: user.phone,
      status: user.status,

      // Frontend hint: still waiting on a company email.
      pendingCompanyEmail: !user.email && !!user.alternateEmail,

      createdAt: user.createdAt,
      createdBy: user.createdBy,
      updatedAt: user.updatedAt,
      updatedBy: user.updatedBy,

      roles:
        user.roleIds && user.roleNames
          ? user.roleIds
              .split(",")
              .map(
                (
                  roleId: string,
                  index: number,
                ) => ({
                  roleId: Number(roleId),
                  roleName:
                    user.roleNames
                      .split(",")[index]
                      ?.trim(),
                }),
              )
          : [],

      profileImage:
        user.profileImage ?? null,
    }));

    sendSuccess(
      res,
      "Users fetched successfully",
      formattedUsers,
    );
  } catch (error) {
    next(error);
  }
};

// ==========================================================
// GET USER BY ID
// ==========================================================

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await getUserById(
      pool,
      Number(id),
    );

    if (!user) {
      throw ApiError.notFound(
        "User not found",
      );
    }

    const [roleRows] =
      await pool.query<RowDataPacket[]>(
        `
        SELECT
          r.id AS roleId,
          r.roleName

        FROM user_roles ur

        LEFT JOIN roles r
          ON r.id = ur.roleId
          AND r.trashedAt IS NULL

        WHERE ur.userId = ?
        AND ur.trashedAt IS NULL
        `,
        [id],
      );

    const formattedUser = {
      ...user,

      roles: roleRows.map((row) => ({
        roleId: row.roleId,
        roleName: row.roleName,
      })),
    };

    sendSuccess(
      res,
      "User fetched successfully",
      formattedUser,
    );
  } catch (error) {
    next(error);
  }
};

// ==========================================================
// CREATE USER
// ==========================================================
// Transaction:
// 1. Validate email / alternateEmail (domain rules)
// 2. Check duplicates across both columns
// 3. Validate roles
// 4. Validate media
// 5. Create user
// 6. Map roles
// 7. Create address
// 8. Attach profile image
// 9. Commit

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const connection =
    await pool.getConnection();

  try {
    const {
      firstName,
      lastName,
      email,
      alternateEmail,
      phone,
      password,
      status,
      roles = [],
      mediaId,
      address,
      createdBy,
    } = req.body;

    // ------------------------------------------------------
    // 1. Validate required fields
    // ------------------------------------------------------

    if (
      !firstName ||
      !lastName ||
      !password
    ) {
      throw ApiError.badRequest(
        "firstName, lastName and password are required",
      );
    }

    // ------------------------------------------------------
    // 2. Validate email / alternateEmail domain rules
    // ------------------------------------------------------

    const normalized = validateEmailFields(
      email,
      alternateEmail,
    );

    // ------------------------------------------------------
    // 3. Check duplicates across email AND alternateEmail
    // ------------------------------------------------------

    const duplicateChecks: string[] = [];
    const duplicateValues: string[] = [];

    if (normalized.email) {
      duplicateChecks.push("email = ?");
      duplicateValues.push(normalized.email);
    }

    if (normalized.alternateEmail) {
      duplicateChecks.push("alternateEmail = ?");
      duplicateValues.push(normalized.alternateEmail);
    }

    const [existingUser] =
      await connection.query<RowDataPacket[]>(
        `
        SELECT id
        FROM users
        WHERE (${duplicateChecks.join(" OR ")})
        AND trashedAt IS NULL
        `,
        duplicateValues,
      );

    if (existingUser.length > 0) {
      throw ApiError.conflict(
        "Email already exists",
      );
    }

    // ------------------------------------------------------
    // 4. Validate roles
    // ------------------------------------------------------

    if (
      !roles ||
      !Array.isArray(roles) ||
      roles.length === 0
    ) {
      throw ApiError.badRequest(
        "Please select at least one role.",
      );
    }

    const [validRoles] =
      await connection.query<RowDataPacket[]>(
        `
        SELECT id
        FROM roles
        WHERE id IN (?)
        AND trashedAt IS NULL
        `,
        [roles],
      );

    if (
      validRoles.length !== roles.length
    ) {
      throw ApiError.badRequest(
        "One or more selected roles are invalid.",
      );
    }

    // ------------------------------------------------------
    // 5. Validate media
    // ------------------------------------------------------

    if (mediaId) {
      const [validMedia] =
        await connection.query<RowDataPacket[]>(
          `
          SELECT id
          FROM media
          WHERE id = ?
          AND (
            trashedOn IS NULL
            OR trashedOn = 0
          )
          `,
          [mediaId],
        );

      if (validMedia.length === 0) {
        throw ApiError.badRequest(
          "Selected media is invalid.",
        );
      }
    }

    // ------------------------------------------------------
    // 6. Start transaction
    // ------------------------------------------------------

    await connection.beginTransaction();

    // ------------------------------------------------------
    // 7. CREATE USER
    // ------------------------------------------------------
    // NOTE: user.service.ts's createUserRecord() must be updated to
    // accept and insert `alternateEmail` alongside the existing fields.

    const userId =
      await createUserRecord(
        connection,
        {
          firstName,
          lastName,
          email: normalized.email,
          alternateEmail: normalized.alternateEmail,
          phone,
          password,
          status,
          createdBy,
        },
      );

    // ------------------------------------------------------
    // 8. Map roles
    // ------------------------------------------------------

    await mapUserRoles(
      connection,
      userId,
      roles,
      createdBy,
    );

    // ------------------------------------------------------
    // 9. Create address
    // ------------------------------------------------------

    const fullName =
      `${firstName} ${lastName}`;

    await createAddress(connection, {
      ownerType: "user",
      ownerID: userId,
      fullName,
      createdBy,
      address: address ?? {},
    });

    // ------------------------------------------------------
    // 10. Attach profile image
    // ------------------------------------------------------

    if (mediaId) {
      await attachMedia(connection, {
        objectType: "user",
        objectID: userId,
        mediaID: mediaId,
        title: fullName,
      });
    }

    // ------------------------------------------------------
    // 11. Commit
    // ------------------------------------------------------

    await connection.commit();

    sendSuccess(
      res,
      "User created successfully",
      {
        id: userId,
        pendingCompanyEmail: !normalized.email,
      },
      201,
    );
  } catch (error) {
    await connection.rollback();

    console.error(
      "CREATE USER ERROR:",
      error,
    );

    next(error);
  } finally {
    connection.release();
  }
};

// ==========================================================
// UPDATE USER
// ==========================================================

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const connection =
    await pool.getConnection();

  try {
    const { id } = req.params;

    const {
      firstName,
      lastName,
      email,
      alternateEmail,
      phone,
      password,
      status,
      roles,
      mediaId,
      updatedBy,
    } = req.body;

    const userId = Number(id);

    // ------------------------------------------------------
    // 1. Check user exists
    // ------------------------------------------------------

    const existingUser =
      await getUserById(
        connection,
        userId,
      );

    if (!existingUser) {
      throw ApiError.notFound(
        "User not found",
      );
    }

    // ------------------------------------------------------
    // 2. Validate email / alternateEmail domain rules
    //    (only for whichever field is actually being changed)
    // ------------------------------------------------------

    let normalizedEmail: string | undefined;
    let normalizedAlternate: string | undefined;

    if (email !== undefined) {
      normalizedEmail = email
        ? String(email).trim().toLowerCase()
        : null as unknown as string;

      // Assigning a real company email — this is the moment an employee's
      // alternate-email login path closes for good.
      if (normalizedEmail && !isCompanyEmail(normalizedEmail)) {
        throw ApiError.badRequest(
          `Company email must be a @${getCompanyEmailDomain()} address.`,
        );
      }
    }

    if (alternateEmail !== undefined) {
      normalizedAlternate = alternateEmail
        ? String(alternateEmail).trim().toLowerCase()
        : null as unknown as string;

      if (normalizedAlternate && isCompanyEmail(normalizedAlternate)) {
        throw ApiError.badRequest(
          `Personal email must not be a @${getCompanyEmailDomain()} address.`,
        );
      }
    }

    // ------------------------------------------------------
    // 3. Check duplicates
    // ------------------------------------------------------

    if (normalizedEmail || normalizedAlternate) {
      const checks: string[] = [];
      const values: string[] = [];

      if (normalizedEmail) {
        checks.push("email = ?");
        values.push(normalizedEmail);
      }

      if (normalizedAlternate) {
        checks.push("alternateEmail = ?");
        values.push(normalizedAlternate);
      }

      const [duplicate] =
        await connection.query<RowDataPacket[]>(
          `
          SELECT id
          FROM users
          WHERE (${checks.join(" OR ")})
          AND id <> ?
          AND trashedAt IS NULL
          `,
          [...values, userId],
        );

      if (duplicate.length > 0) {
        throw ApiError.conflict(
          "Email already exists",
        );
      }
    }

    // ------------------------------------------------------
    // 4. Validate media
    // ------------------------------------------------------

    if (mediaId) {
      const [validMedia] =
        await connection.query<RowDataPacket[]>(
          `
          SELECT id
          FROM media
          WHERE id = ?
          AND (
            trashedOn IS NULL
            OR trashedOn = 0
          )
          `,
          [mediaId],
        );

      if (validMedia.length === 0) {
        throw ApiError.badRequest(
          "Selected media is invalid.",
        );
      }
    }

    // ------------------------------------------------------
    // 5. Start transaction
    // ------------------------------------------------------

    await connection.beginTransaction();

    // ------------------------------------------------------
    // 6. UPDATE USER
    // ------------------------------------------------------
    // NOTE: user.service.ts's updateUserRecord() must be updated to
    // accept and persist `alternateEmail` alongside the existing fields.

    await updateUserRecord(
      connection,
      userId,
      {
        firstName,
        lastName,
        email: normalizedEmail,
        alternateEmail: normalizedAlternate,
        phone,
        password,
        status,
        updatedBy,
      },
    );

    // ------------------------------------------------------
    // 7. Update roles
    // ------------------------------------------------------

    await mapUserRoles(
      connection,
      userId,
      roles,
      updatedBy,
    );

    // ------------------------------------------------------
    // 8. Update profile image
    // ------------------------------------------------------

    if ("mediaId" in req.body) {
      const fullName =
        `${firstName ?? existingUser.firstName} ${
          lastName ?? existingUser.lastName
        }`.trim();

      await replaceUserMedia(
        connection,
        userId,
        mediaId ?? null,
        fullName,
      );
    }

    // ------------------------------------------------------
    // 9. Commit
    // ------------------------------------------------------

    await connection.commit();

    // ------------------------------------------------------
    // 10. Get updated user
    // ------------------------------------------------------

    const updatedUser =
      await getUserById(
        connection,
        userId,
      );

    if (!updatedUser) {
      throw ApiError.notFound(
        "User not found after update",
      );
    }

    const [roleRows] =
      await connection.query<RowDataPacket[]>(
        `
        SELECT
          r.id AS roleId,
          r.roleName

        FROM user_roles ur

        LEFT JOIN roles r
          ON r.id = ur.roleId
          AND r.trashedAt IS NULL

        WHERE ur.userId = ?
        AND ur.trashedAt IS NULL
        `,
        [userId],
      );

    const formattedUser = {
      ...updatedUser,

      roles: roleRows.map((row) => ({
        roleId: row.roleId,
        roleName: row.roleName,
      })),
    };

    sendSuccess(
      res,
      "User updated successfully",
      formattedUser,
    );
  } catch (error) {
    await connection.rollback();

    console.error(
      "UPDATE USER ERROR:",
      error,
    );

    next(error);
  } finally {
    connection.release();
  }
};

// ==========================================================
// DELETE USER
// ==========================================================

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { trashedBy } = req.body;

    const user =
      await getUserById(
        pool,
        Number(id),
      );

    if (!user) {
      throw ApiError.notFound(
        "User not found",
      );
    }

    await pool.query(
      `
      UPDATE users
      SET
        trashedAt = ?,
        trashedBy = ?
      WHERE id = ?
      `,
      [
        Math.floor(Date.now() / 1000),
        trashedBy ?? null,
        id,
      ],
    );

    sendSuccess(
      res,
      "User deleted successfully",
    );
  } catch (error) {
    next(error);
  }
};