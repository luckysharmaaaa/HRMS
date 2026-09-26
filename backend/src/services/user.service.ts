import { RowDataPacket, ResultSetHeader } from "mysql2";
import { Pool, PoolConnection } from "mysql2/promise";
import bcrypt from "bcrypt";

type DbConnection = Pool | PoolConnection;

/**
 * ==========================================================
 * Get User By ID
 * ==========================================================
 */
export const getUserById = async (connection: DbConnection, userId: number) => {
  const [rows] = await connection.query<RowDataPacket[]>(
    `
      SELECT
        id,
        firstName,
        lastName,
        email,
        alternateEmail,
        phone,
        status,
        createdAt,
        createdBy,
        updatedAt,
        updatedBy
      FROM users
      WHERE id = ?
      AND trashedAt IS NULL
      LIMIT 1
    `,
    [userId],
  );

  return rows.length > 0 ? rows[0] : null;
};

/**
 * ==========================================================
 * Find User By Email OR Phone
 * ==========================================================
 */
export const findUserByEmailOrPhone = async (
  connection: DbConnection,
  email?: string,
  phone?: string,
) => {
  const [rows] = await connection.query<RowDataPacket[]>(
    `
      SELECT
        id,
        firstName,
        lastName,
        email,
        alternateEmail,
        phone,
        status
      FROM users
      WHERE (email = ? OR alternateEmail = ? OR phone = ?)
      AND trashedAt IS NULL
      LIMIT 1
    `,
    [email ?? null, email ?? null, phone ?? null],
  );

  return rows.length > 0 ? rows[0] : null;
};

/**
 * ==========================================================
 * Normalize User Status
 * ==========================================================
 *
 * Database column is enum('0','1'):
 *   '1' = Active
 *   '0' = Inactive
 *
 * Accepts:
 *   true / false
 *   1 / 0
 *   "1" / "0"
 *
 * IMPORTANT:
 * Must return the STRING "0" or "1", never a number.
 * MySQL enum columns read a numeric bound parameter as a
 * 1-indexed ENUM POSITION, not as the literal value — so
 * sending the number 0 or 1 here silently stores the wrong
 * row (or throws "Data truncated for column 'status'").
 *
 * Also: do not use Boolean("0") — Boolean("0") === true.
 */
const normalizeStatus = (status: boolean | string | number): "0" | "1" => {
  if (status === true || status === 1 || status === "1") {
    return "1";
  }

  return "0";
};

/**
 * ==========================================================
 * Create User Record
 * ==========================================================
 *
 * `email` (official company email) is nullable: an employee who
 * doesn't have their company email yet is created with `email: null`
 * and `alternateEmail` set to their personal email instead. The
 * controller guarantees at least one of the two is provided before
 * calling this.
 */
export const createUserRecord = async (
  connection: DbConnection,
  data: {
    firstName: string;
    lastName: string;
    email: string | null;
    alternateEmail?: string | null;
    phone?: string | null;
    password: string;
    status?: boolean | string | number;
    createdBy?: number | null;
  },
) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const status: "0" | "1" =
    data.status === undefined ? "1" : normalizeStatus(data.status);

  const [result] = await connection.query<ResultSetHeader>(
    `
        INSERT INTO users
        (
          firstName,
          lastName,
          email,
          alternateEmail,
          phone,
          password,
          status,
          createdAt,
          createdBy
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    [
      data.firstName,
      data.lastName,
      data.email,
      data.alternateEmail ?? null,
      data.phone ?? null,
      hashedPassword,
      status,
      Math.floor(Date.now() / 1000),
      data.createdBy ?? null,
    ],
  );

  if (result.affectedRows === 0) {
    throw new Error("Failed to create user");
  }

  return result.insertId;
};

/**
 * ==========================================================
 * Update User Record
 * ==========================================================
 *
 * `alternateEmail` can be explicitly set to null to clear it (e.g.
 * once the official company email has been assigned).
 */
export const updateUserRecord = async (
  connection: DbConnection,
  userId: number,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string | null;
    alternateEmail?: string | null;
    phone?: string | null;
    password?: string;
    status?: boolean | string | number;
    updatedBy?: number | null;
  },
) => {
  const fields: string[] = [];
  const values: any[] = [];

  // ========================================================
  // Basic Fields
  // ========================================================

  if (data.firstName !== undefined) {
    fields.push("firstName = ?");
    values.push(data.firstName);
  }

  if (data.lastName !== undefined) {
    fields.push("lastName = ?");
    values.push(data.lastName);
  }

  if (data.email !== undefined) {
    fields.push("email = ?");
    values.push(data.email);
  }

  if (data.alternateEmail !== undefined) {
    fields.push("alternateEmail = ?");
    values.push(data.alternateEmail);
  }

  if (data.phone !== undefined) {
    fields.push("phone = ?");
    values.push(data.phone);
  }

  // ========================================================
  // Password
  // ========================================================

  if (data.password !== undefined && data.password.trim() !== "") {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    fields.push("password = ?");
    values.push(hashedPassword);
  }

  // ========================================================
  // Status
  // ========================================================
  //
  // '1' = Active
  // '0' = Inactive
  //
  // IMPORTANT:
  // Only update status when status is actually provided.
  //
  // undefined = keep existing database status
  //
  // ========================================================

  if (data.status !== undefined) {
    const normalizedStatus = normalizeStatus(data.status);

    fields.push("status = ?");
    values.push(normalizedStatus);
  }

  // ========================================================
  // Nothing to update
  // ========================================================

  if (fields.length === 0) {
    return;
  }

  // ========================================================
  // Updated timestamps
  // ========================================================

  fields.push("updatedAt = ?");
  values.push(Math.floor(Date.now() / 1000));

  fields.push("updatedBy = ?");
  values.push(data.updatedBy ?? null);

  // ========================================================
  // Execute UPDATE
  // ========================================================

  await connection.query(
    `
      UPDATE users
      SET ${fields.join(", ")}
      WHERE id = ?
    `,
    [...values, userId],
  );
};