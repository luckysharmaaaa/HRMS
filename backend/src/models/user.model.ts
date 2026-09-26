import BaseModel from "../core/BaseModel";
import { User, Role, DbConnection } from "../types";
import { isCompanyEmail } from "../utils/Companyemail";

class UserModel extends BaseModel {
  constructor() {
    super({
      tableName: "users",
      fillable: [
        "firstName",
        "lastName",
        "email",
        "alternateEmail",
        "phone",
        "password",
        "status",
        "createdBy",
        "updatedBy",
      ],
      hidden: ["password"],
      searchable: [
        "firstName",
        "lastName",
        "email",
        "alternateEmail",
        "phone",
      ],
    });
  }

  /**
   * Find User By Email (company email column only — unchanged behaviour).
   */
  async findByEmail(
    email: string,
    options: {
      includePassword?: boolean;
      transaction?: DbConnection;
    } = {},
  ): Promise<User | null> {
    if (options.includePassword) {
      const sql = `
            SELECT *
            FROM users
            WHERE email = ?
            LIMIT 1
        `;

      return this.raw<User>(sql, [email], {
        method: "oneOrNone",
        transaction: options.transaction,
      });
    }

    return this.findOne<User>(
      {
        email,
      },
      {
        columns: [
          "id",
          "firstName",
          "lastName",
          "email",
          "alternateEmail",
          "phone",
          "status",
          "createdAt",
          "updatedAt",
        ],
        transaction: options.transaction,
      },
    );
  }

  /**
   * Find a user by their registered personal/alternate email.
   * Only matches accounts that don't have a company email yet
   * (email IS NULL) — once HR assigns the company email, this
   * login path closes automatically.
   */
  async findByAlternateEmail(
    alternateEmail: string,
    options: {
      includePassword?: boolean;
      transaction?: DbConnection;
    } = {},
  ): Promise<User | null> {
    const columns = options.includePassword ? "*" : `
      id, firstName, lastName, email, alternateEmail,
      phone, status, createdAt, updatedAt
    `;

    const sql = `
      SELECT ${columns}
      FROM users
      WHERE alternateEmail = ?
        AND email IS NULL
        AND trashedAt IS NULL
      LIMIT 1
    `;

    return this.raw<User>(sql, [alternateEmail], {
      method: "oneOrNone",
      transaction: options.transaction,
    });
  }

  /**
   * Login lookup: resolves a login identifier to the right account,
   * strictly by domain.
   *   - Looks like a company email (@bytesbrick.com) -> match users.email
   *   - Anything else -> match users.alternateEmail, and ONLY while the
   *     account is still pending (email IS NULL). Once a company email
   *     is assigned, the personal email stops working for login.
   */
  async findLoginCandidate(
    identifier: string,
    transaction?: DbConnection,
  ): Promise<User | null> {
    if (isCompanyEmail(identifier)) {
      return this.findByEmail(identifier, {
        includePassword: true,
        transaction,
      });
    }

    return this.findByAlternateEmail(identifier, {
      includePassword: true,
      transaction,
    });
  }

  /**
   * Find User By Id
   */
  async findUserById(
    id: number,
    transaction?: DbConnection,
  ): Promise<User | null> {
    return this.findOne<User>(
      {
        id,
      },
      {
        transaction,
      },
    );
  }

  /**
   * Get User Roles
   */
  async getUserRoles(
    userId: number,
    transaction?: DbConnection,
  ): Promise<Role[]> {
    const sql = `
            SELECT
                r.id,
                r.roleName,
                r.roleCode,
                r.description,
                r.status
            FROM user_roles ur
            INNER JOIN roles r
                ON ur.roleId = r.id
            WHERE ur.userId = ?
            AND ur.trashedAt IS NULL
            AND r.trashedAt IS NULL
        `;

    return this.raw<Role[]>(sql, [userId], {
      method: "any",
      transaction,
    });
  }

  async findByEmailOrPhone(
    email: string,
    phone: string,
    transaction?: DbConnection,
  ): Promise<User | null> {
    const sql = `
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
  `;

    return this.raw<User>(sql, [email, email, phone], {
      method: "oneOrNone",
      transaction,
    });
  }

  async recordLogin(userId: number, transaction?: DbConnection): Promise<void> {
    const sql = `
            UPDATE users
            SET
                updatedAt = UNIX_TIMESTAMP()
            WHERE id = ?
        `;

    await this.raw(sql, [userId], {
      method: "none",
      transaction,
    });
  }

  /**
   * ==========================================================
   * Update Profile (Account Settings)
   * ==========================================================
   */
  async updateProfile(
    userId: number,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string | null;
      email?: string;
    },
    updatedBy?: number | null,
    transaction?: DbConnection,
  ): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.firstName !== undefined) {
      fields.push("firstName = ?");
      values.push(data.firstName);
    }

    if (data.lastName !== undefined) {
      fields.push("lastName = ?");
      values.push(data.lastName);
    }

    if (data.phone !== undefined) {
      fields.push("phone = ?");
      values.push(data.phone);
    }

    if (data.email !== undefined) {
      fields.push("email = ?");
      values.push(data.email);
    }

    if (fields.length === 0) {
      return;
    }

    fields.push("updatedAt = ?");
    values.push(Math.floor(Date.now() / 1000));

    fields.push("updatedBy = ?");
    values.push(updatedBy ?? null);

    values.push(userId);

    const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;

    await this.raw(sql, values, { method: "none", transaction });
  }

  async getUserPasswordById(
    id: number,
    transaction?: DbConnection,
  ): Promise<string | null> {
    const sql = `
      SELECT password
      FROM users
      WHERE id = ?
      LIMIT 1
    `;

    const row = await this.raw<{ password: string } | null>(
      sql,
      [id],
      { method: "oneOrNone", transaction },
    );

    return row ? row.password : null;
  }

  async updatePassword(
    userId: number,
    hashedPassword: string,
    updatedBy?: number | null,
    transaction?: DbConnection,
  ): Promise<void> {
    const sql = `
      UPDATE users
      SET
        password = ?,
        updatedAt = ?,
        updatedBy = ?
      WHERE id = ?
    `;

    await this.raw(
      sql,
      [hashedPassword, Math.floor(Date.now() / 1000), updatedBy ?? null, userId],
      { method: "none", transaction },
    );
  }
}

export default new UserModel();