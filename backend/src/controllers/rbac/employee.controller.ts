// ```ts
import { Request, Response, NextFunction } from "express";
import { RowDataPacket, ResultSetHeader } from "mysql2";

import { pool } from "../../db/connection";
import { ApiError } from "../../utils/apiError";
import { sendSuccess } from "../../utils/response";

import {
  getUserById,
  findUserByEmailOrPhone,
  createUserRecord,
  updateUserRecord,
} from "../../services/user.service";

// NEW: reuse the existing, reusable attach-media service so the
// image mapping can be created inside the SAME transaction as the
// employee insert/update.
import { attachMedia } from "../../services/mediaUse.service";

// ==========================================================
// CHECK EXISTING USER
// ==========================================================

export const checkUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      throw ApiError.badRequest("Email or Phone is required.");
    }

    const user = await findUserByEmailOrPhone(
      pool,
      email,
      phone,
    );

    if (!user) {
      sendSuccess(res, "User not found.", {
        userExists: false,
        employeeExists: false,
      });

      return;
    }

    const [employees] = await pool.query<RowDataPacket[]>(
      `
      SELECT id
      FROM employee
      WHERE userId = ?
      AND trashedAt IS NULL
      LIMIT 1
      `,
      [user.id],
    );

    sendSuccess(res, "User check completed.", {
      userExists: true,
      employeeExists: employees.length > 0,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================================
// IMPORT EXISTING USER
// ==========================================================

export const importUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = Number(req.params.userId);

    if (!userId) {
      throw ApiError.badRequest("Invalid user ID.");
    }

    const user = await getUserById(pool, userId);

    if (!user) {
      throw ApiError.notFound("User not found.");
    }

    sendSuccess(
      res,
      "User fetched successfully.",
      user,
    );
  } catch (error) {
    next(error);
  }
};

// ==========================================================
// GET USERS AVAILABLE FOR IMPORT
// ==========================================================

export const getImportableUsers = async (
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
        u.phone,
        u.status,

        EXISTS (
          SELECT 1
          FROM employee e
          WHERE e.userId = u.id
          AND e.trashedAt IS NULL
        ) AS isEmployee

      FROM users u

      WHERE u.trashedAt IS NULL

      ORDER BY
        u.firstName ASC,
        u.lastName ASC
      `,
    );

    const result = users.map((user) => ({
      ...user,
      isEmployee: Number(user.isEmployee) === 1,
    }));

    sendSuccess(
      res,
      "Users fetched successfully.",
      result,
    );
  } catch (error) {
    next(error);
  }
};

// ==========================================================
// CREATE EMPLOYEE
// ==========================================================

export const createEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const connection = await pool.getConnection();

  try {
    const {
      userId,
      firstName,
      lastName,
      email,
      phone,
      password,
      employeeCode,
      departmentId,
      designationId,
      joiningDate: joiningDateRaw,
      managerId,
      about,
      profileImage,
      // NEW: id of a media row already uploaded (via /media/upload,
      // WITHOUT objectID/objectType, since the employee doesn't exist
      // yet at upload time). We attach it to this employee inside this
      // same transaction below.
      mediaId,
      status,
      roles = [],
      createdBy,
    } = req.body;

    const joiningDate = joiningDateRaw
      ? String(joiningDateRaw).slice(0, 10)
      : null;

    await connection.beginTransaction();

    let finalUserId = userId;

    // ------------------------------------------------------
    // EXISTING USER / IMPORT
    // ------------------------------------------------------

    if (finalUserId) {
      const existingUser = await getUserById(
        connection,
        Number(finalUserId),
      );

      if (!existingUser) {
        throw ApiError.notFound("User not found");
      }

      const [existingEmployee] =
        await connection.query<RowDataPacket[]>(
          `
          SELECT id
          FROM employee
          WHERE userId = ?
          AND trashedAt IS NULL
          LIMIT 1
          `,
          [finalUserId],
        );

      if (existingEmployee.length > 0) {
        throw ApiError.conflict(
          "Employee already exists",
        );
      }
    }

    // ------------------------------------------------------
    // CREATE NEW USER
    // ------------------------------------------------------

    else {
      if (
        !firstName ||
        !lastName ||
        !email ||
        !password
      ) {
        throw ApiError.badRequest(
          "firstName, lastName, email and password are required",
        );
      }

      const existingUser =
        await findUserByEmailOrPhone(
          connection,
          email,
          phone,
        );

      if (existingUser) {
        const [existingEmployee] =
          await connection.query<RowDataPacket[]>(
            `
            SELECT id
            FROM employee
            WHERE userId = ?
            AND trashedAt IS NULL
            LIMIT 1
            `,
            [existingUser.id],
          );

        if (existingEmployee.length > 0) {
          throw ApiError.conflict(
            "This person is already an employee.",
            "ALREADY_EMPLOYEE",
          );
        }

        throw ApiError.conflict(
          "This email already belongs to an existing user.",
          "USER_EXISTS",
        );
      }

      // ----------------------------------------------------
      // Validate roles
      // ----------------------------------------------------

      if (roles.length > 0) {
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

        if (validRoles.length !== roles.length) {
          throw ApiError.badRequest(
            "One or more selected roles are invalid",
          );
        }
      }

      // ----------------------------------------------------
      // Create user
      // ----------------------------------------------------

      finalUserId = await createUserRecord(
        connection,
        {
          firstName,
          lastName,
          email,
          phone,
          password,
          status,
          createdBy,
        },
      );
    }

    // ------------------------------------------------------
    // CREATE EMPLOYEE
    // ------------------------------------------------------

    const [employeeResult] =
      await connection.query<ResultSetHeader>(
        `
        INSERT INTO employee
        (
          userId,
          employeeCode,
          departmentId,
          designationId,
          joiningDate,
          managerId,
          status,
          about,
          profileImage,
          createdAt,
          createdBy
        )
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          finalUserId,
          employeeCode ?? null,
          departmentId ?? null,
          designationId ?? null,
          joiningDate,
          managerId ?? null,
          status ? "1" : "0",
          about ?? null,
          profileImage ?? null,
          Math.floor(Date.now() / 1000),
          createdBy ?? null,
        ],
      );

    if (employeeResult.affectedRows === 0) {
      throw ApiError.internal(
        "Failed to create employee",
      );
    }

    // ------------------------------------------------------
    // ATTACH PROFILE IMAGE (same transaction)
    // ------------------------------------------------------
    // If the frontend already uploaded an image (POST /media/upload,
    // no objectID/objectType at that point since the employee didn't
    // exist yet) and got back a mediaId, attach it to the employee we
    // just created here — inside this same transaction. If this
    // throws, the whole employee creation rolls back too, so we never
    // end up with an employee that silently has no image because a
    // second, independent request happened to fail.
    // ------------------------------------------------------

    if (mediaId) {
      await attachMedia(connection, {
        objectType: "employees",
        objectID: employeeResult.insertId,
        mediaID: Number(mediaId),
        title: `${firstName || "Employee"} Profile Image`,
        altText: `${firstName || "Employee"} Profile Image`,
      });
    }

    await connection.commit();

    sendSuccess(
      res,
      "Employee created successfully",
      {
        employeeId: employeeResult.insertId,
        userId: finalUserId,
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

// ==========================================================
// GET ALL EMPLOYEES
// ==========================================================


export const getEmployees = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const connection = await pool.getConnection();

  try {
    const [employees] = await connection.query<RowDataPacket[]>(
      `
      SELECT
        e.id,
        e.employeeCode,
        e.managerId,
        e.joiningDate,
        e.status,
        e.about,

        /* Employee profile image */
        media.fileURL AS profileImage,

        u.firstName,
        u.lastName,
        u.email,
        u.phone,

        d.departmentName,
        ds.designationName,

        m.employeeCode AS managerEmployeeCode,

        CONCAT(
          mu.firstName,
          ' ',
          mu.lastName
        ) AS managerName

      FROM employee e

      INNER JOIN users u
        ON e.userId = u.id

      LEFT JOIN department d
        ON e.departmentId = d.id

      LEFT JOIN designation ds
        ON e.designationId = ds.id

      LEFT JOIN employee m
        ON e.managerId = m.id

      LEFT JOIN users mu
        ON m.userId = mu.id

      /* Employee -> media mapping */
      LEFT JOIN media_uses mediaUse
        ON mediaUse.objectID = e.id
        AND mediaUse.objectType = 'employees'
        AND mediaUse.status = 1

      LEFT JOIN media
        ON media.id = mediaUse.mediaID
        AND (media.trashedOn IS NULL OR media.trashedOn = 0)

      WHERE e.trashedAt IS NULL

      ORDER BY e.id DESC
      `,
    );

    sendSuccess(
      res,
      "Employees fetched successfully",
      employees,
      200,
    );
  } catch (error) {
    next(error);
  } finally {
    connection.release();
  }
};


// ==========================================================
// GET MANAGERS
// ==========================================================

export const getManagers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const [managers] =
      await pool.query<RowDataPacket[]>(
        `
        SELECT
          e.id,
          e.employeeCode,
          u.firstName,
          u.lastName

        FROM employee e

        INNER JOIN users u
          ON e.userId = u.id

        WHERE e.trashedAt IS NULL
        AND e.status = '1'

        ORDER BY
          u.firstName ASC,
          u.lastName ASC
        `,
      );

    sendSuccess(
      res,
      "Managers fetched successfully",
      managers,
      200,
    );
  } catch (error) {
    next(error);
  }
};

// ==========================================================
// UPDATE EMPLOYEE
// ==========================================================

export const updateEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const connection = await pool.getConnection();

  try {
    const employeeId = Number(req.params.id);

    if (!employeeId) {
      throw ApiError.badRequest(
        "Invalid employee ID.",
      );
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      employeeCode,
      departmentId,
      designationId,
      joiningDate: joiningDateRaw,
      managerId,
      about,
      profileImage,
      // NEW: id of a newly-uploaded media row (only present when the
      // user actually picked a new image in the edit drawer).
      mediaId,
      status,
      updatedBy,
    } = req.body;

    const joiningDate = joiningDateRaw
      ? String(joiningDateRaw).slice(0, 10)
      : undefined;

    await connection.beginTransaction();

    // ------------------------------------------------------
    // Find employee
    // ------------------------------------------------------

    const [employeeRows] =
      await connection.query<RowDataPacket[]>(
        `
        SELECT
          id,
          userId
        FROM employee
        WHERE id = ?
        AND trashedAt IS NULL
        LIMIT 1
        `,
        [employeeId],
      );

    if (employeeRows.length === 0) {
      throw ApiError.notFound(
        "Employee not found",
      );
    }

    const userId = Number(
      employeeRows[0].userId,
    );

    // ------------------------------------------------------
    // Get user
    // ------------------------------------------------------

    const existingUser = await getUserById(
      connection,
      userId,
    );

    if (!existingUser) {
      throw ApiError.notFound(
        "User not found",
      );
    }

    // ------------------------------------------------------
    // Check duplicate email
    // ------------------------------------------------------

    if (email !== undefined && email !== null) {
      const [duplicateEmail] =
        await connection.query<RowDataPacket[]>(
          `
          SELECT id
          FROM users
          WHERE email = ?
          AND id != ?
          AND trashedAt IS NULL
          LIMIT 1
          `,
          [email, userId],
        );

      if (duplicateEmail.length > 0) {
        throw ApiError.conflict(
          "Email already exists",
        );
      }
    }

    // ------------------------------------------------------
    // Update user
    // ------------------------------------------------------

    await updateUserRecord(
      connection,
      userId,
      {
        firstName,
        lastName,
        email,
        phone,
        status,
        updatedBy,
      },
    );

    // ------------------------------------------------------
    // Update employee
    // ------------------------------------------------------

    const [employeeResult] =
      await connection.query<ResultSetHeader>(
        `
        UPDATE employee
        SET
          employeeCode = COALESCE(?, employeeCode),

          departmentId = COALESCE(?, departmentId),

          designationId = COALESCE(?, designationId),

          joiningDate = COALESCE(?, joiningDate),

          managerId = COALESCE(?, managerId),

          status = COALESCE(?, status),

          about = COALESCE(?, about),

          profileImage = COALESCE(?, profileImage),

          updatedAt = ?,

          updatedBy = COALESCE(?, updatedBy)

        WHERE id = ?
        `,
        [
          employeeCode ?? null,
          departmentId ?? null,
          designationId ?? null,
          joiningDate ?? null,
          managerId ?? null,

          status !== undefined
            ? status
              ? "1"
              : "0"
            : null,

          about ?? null,

          profileImage ?? null,

          Math.floor(Date.now() / 1000),

          updatedBy ?? null,

          employeeId,
        ],
      );

    if (employeeResult.affectedRows === 0) {
      throw ApiError.internal(
        "Failed to update employee",
      );
    }

    // ------------------------------------------------------
    // REPLACE PROFILE IMAGE (same transaction)
    // ------------------------------------------------------
    // Only runs when the user actually picked a new image in the
    // edit drawer (mediaId present). We deactivate any previously
    // active image mapping first so getEmployees' LEFT JOIN never
    // finds two active rows for the same employee (which would
    // otherwise duplicate the employee row in the list).
    // ------------------------------------------------------

    if (mediaId) {
      await connection.query<ResultSetHeader>(
        `
        UPDATE media_uses
        SET status = 0
        WHERE objectType = 'employees'
        AND objectID = ?
        AND status = 1
        `,
        [employeeId],
      );

      await attachMedia(connection, {
        objectType: "employees",
        objectID: employeeId,
        mediaID: Number(mediaId),
        title: "Employee Profile Image",
        altText: "Employee Profile Image",
      });
    }

    await connection.commit();

    sendSuccess(
      res,
      "Employee updated successfully",
      {},
      200,
    );
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// ==========================================================
// DELETE EMPLOYEE (soft delete)
// ==========================================================
// Sets trashedAt/trashedBy instead of removing the row, matching
// the pattern already used everywhere else (getEmployees filters
// WHERE e.trashedAt IS NULL). This also means the employee's
// media_uses / media rows are left alone — no cleanup needed here,
// and the employee simply stops showing up in GET /employees.

export const deleteEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const employeeId = Number(req.params.id);

    if (!employeeId) {
      throw ApiError.badRequest("Invalid employee ID.");
    }

    const { trashedBy } = req.body;

    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT id
      FROM employee
      WHERE id = ?
      AND trashedAt IS NULL
      LIMIT 1
      `,
      [employeeId],
    );

    if (rows.length === 0) {
      throw ApiError.notFound("Employee not found");
    }

    const [result] = await pool.query<ResultSetHeader>(
      `
      UPDATE employee
      SET
        trashedAt = ?,
        trashedBy = ?
      WHERE id = ?
      `,
      [Math.floor(Date.now() / 1000), trashedBy ?? null, employeeId],
    );

    if (result.affectedRows === 0) {
      throw ApiError.internal("Failed to delete employee");
    }

    sendSuccess(res, "Employee deleted successfully", {}, 200);
  } catch (error) {
    next(error);
  }
};