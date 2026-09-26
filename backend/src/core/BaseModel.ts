import mysql from "mysql2/promise";
import { pool } from "../db/connection";
import logger from "../utils/logger";
import {
  DatabaseRecord,
  ModelConfig,
  FindAllOptions,
  FindOneOptions,
  CreateOptions,
  UpdateOptions,
  DeleteOptions,
  PaginateOptions,
  RawOptions,
  JoinConfig,
  WhereFilters,
  WhereValue,
  CastType,
  QueryMethod,
  DbConnection,
} from "../types";

/**
 * BaseModel — Core ORM Framework (MySQL / TypeScript edition)
 *
 * Extend this class in your model files:
 *
 * class ProductModel extends BaseModel {
 *   constructor() {
 *     super({ tableName: 'products', fillable: ['name', 'price'], timestamps: true });
 *   }
 * }
 *
 * Available CRUD:  findAll, findById, findOne, create, createMany,
 *                  update, updateWhere, delete, deleteWhere, restore,
 *                  count, exists, paginate, search, raw, transaction
 *
 * Lifecycle hooks (override in subclass):
 *   beforeCreate, afterCreate, beforeUpdate, afterUpdate,
 *   beforeDelete, afterDelete
 *
 * Notes (MySQL vs PostgreSQL differences handled internally):
 *   - Parameter placeholders use `?` instead of `$1, $2, ...`
 *   - No RETURNING clause — INSERT uses LAST_INSERT_ID(), UPDATE re-fetches
 *   - Arrays in WHERE use `IN (?)` with mysql2 automatic expansion
 *   - ILIKE replaced with LIKE (utf8mb4_unicode_ci is case-insensitive)
 *   - ::text cast replaced with CAST(col AS CHAR)
 */
class BaseModel {
  protected readonly tableName: string;
  protected readonly tableAlias: string;
  protected readonly primaryKey: string;
  protected readonly fillable: string[];
  protected readonly guarded: string[];
  protected readonly hidden: string[];
  protected readonly timestamps: boolean;
  protected readonly softDelete: boolean;
  protected readonly searchable: string[];
  protected readonly casts: Record<string, CastType>;
  protected readonly defaults: Record<string, unknown>;
  protected readonly pool: mysql.Pool;

  constructor(modelConfig: ModelConfig) {
    if (!modelConfig.tableName)
      throw new Error("tableName is required in model configuration");

    this.tableName = modelConfig.tableName;
    this.tableAlias = modelConfig.tableAlias ?? modelConfig.tableName.charAt(0);
    this.primaryKey = modelConfig.primaryKey ?? "id";
    this.fillable = modelConfig.fillable ?? [];
    this.guarded = modelConfig.guarded ?? [];
    this.hidden = modelConfig.hidden ?? [];
    this.timestamps = modelConfig.timestamps !== false;
    this.softDelete = modelConfig.softDelete ?? false;
    this.searchable = modelConfig.searchable ?? [];
    this.casts = modelConfig.casts ?? {};
    this.defaults = modelConfig.defaults ?? {};
    this.pool = pool;
  }

  // ====================================================
  // LOW-LEVEL MYSQL EXECUTOR
  // ====================================================

  /**
   * Execute a query and return results shaped by the requested method.
   * Both Pool and PoolConnection have the same .query() signature.
   */
  private async _execute<T>(
    executor: DbConnection,
    sql: string,
    params: unknown[],
    method: QueryMethod = "any",
  ): Promise<T> {
    const [rows] = await executor.query(sql, params);
    const result = rows as mysql.RowDataPacket[];

    switch (method) {
      case "any":
      case "many":
        if (method === "many" && result.length === 0) {
          throw new Error(`Expected at least one row from ${this.tableName}`);
        }
        return result as unknown as T;

      case "one": {
        if (result.length === 0)
          throw new Error(`No data returned from ${this.tableName}`);
        return result[0] as unknown as T;
      }

      case "oneOrNone":
        return (result[0] ?? null) as unknown as T;

      case "none":
        return undefined as unknown as T;

      case "result":
        return rows as unknown as T; // ResultSetHeader for INSERT/UPDATE/DELETE
    }
  }

  private _executor(transaction?: DbConnection): DbConnection {
    return transaction ?? this.pool;
  }

  // ====================================================
  // QUERY BUILDERS
  // ====================================================

  private _buildSelectClause(
    columns: string | string[] = "*",
    alias: string | null = null,
  ): string {
    if (columns === "*") return alias ? `${alias}.*` : "*";
    if (Array.isArray(columns)) {
      const filtered = columns.filter((c) => !this.hidden.includes(c));
      if (filtered.length === 0) return "*";
      if (alias) {
        return filtered
          .map((c) =>
            c.includes(".") || /\s(as|AS)\s/.test(c) ? c : `${alias}.${c}`,
          )
          .join(", ");
      }
      return filtered.join(", ");
    }
    return columns;
  }

  private _buildJoinClause(joins: JoinConfig | JoinConfig[] = []): string {
    const arr = Array.isArray(joins) ? joins : [joins];
    if (arr.length === 0) return "";
    return (
      " " +
      arr
        .map(
          ({ type = "INNER", table, alias = "", on }) =>
            `${type.toUpperCase()} JOIN ${table}${alias ? ` ${alias}` : ""} ON ${on}`,
        )
        .join(" ")
    );
  }

  /**
   * Builds a WHERE clause using `?` placeholders (MySQL style).
   * Arrays use `IN (?)` — mysql2 automatically expands them.
   */
  private _buildWhereClause(
    filters: WhereFilters = {},
    alias: string | null = null,
  ): { clause: string; params: unknown[] } {
    const conditions: string[] = [];
    const params: unknown[] = [];

    for (const [key, value] of Object.entries(filters)) {
      const col = alias && !key.includes(".") ? `${alias}.${key}` : key;
      if (value === null) {
        conditions.push(`${col} IS NULL`);
      } else if (value === undefined) {
        // skip
      } else if (Array.isArray(value)) {
        // mysql2 expands arrays inside IN(?) automatically
        conditions.push(`${col} IN (?)`);
        params.push(value);
      } else if (typeof value === "object" && "operator" in (value as object)) {
        const wv = value as WhereValue;
        conditions.push(`${col} ${wv.operator} ?`);
        params.push(wv.value);
      } else {
        conditions.push(`${col} = ?`);
        params.push(value);
      }
    }

    return {
      clause: conditions.length ? " WHERE " + conditions.join(" AND ") : "",
      params,
    };
  }

  private _buildOrderClause(
    orderBy: string | string[] | null = null,
    direction = "ASC",
  ): string {
    if (!orderBy) return "";
    if (Array.isArray(orderBy)) return " ORDER BY " + orderBy.join(", ");
    return ` ORDER BY ${orderBy} ${direction.toUpperCase()}`;
  }

  private _buildLimitClause(
    limit: number | null,
    offset: number | null,
  ): { clause: string; params: unknown[] } {
    const params: unknown[] = [];
    let clause = "";
    if (limit !== null) {
      clause += " LIMIT ?";
      params.push(limit);
    }
    if (offset !== null) {
      clause += " OFFSET ?";
      params.push(offset);
    }
    return { clause, params };
  }

  private _buildGroupClause(groupBy: string | string[] | null = null): string {
    if (!groupBy) return "";
    return (
      " GROUP BY " + (Array.isArray(groupBy) ? groupBy.join(", ") : groupBy)
    );
  }

  private _buildHavingClause(having: string | null = null): string {
    return having ? ` HAVING ${having}` : "";
  }

  // ====================================================
  // MASS-ASSIGNMENT PROTECTION
  // ====================================================

  protected _filterFillable(data: DatabaseRecord): DatabaseRecord {
    if (this.fillable.length === 0 && this.guarded.length === 0)
      return { ...data };

    const filtered: DatabaseRecord = {};
    if (this.fillable.length > 0) {
      this.fillable.forEach((k) => {
        if (data[k] !== undefined) filtered[k] = data[k];
      });
    } else {
      Object.keys(data).forEach((k) => {
        if (!this.guarded.includes(k)) filtered[k] = data[k];
      });
    }

    for (const [k, v] of Object.entries(this.defaults)) {
      if (filtered[k] === undefined) {
        filtered[k] = typeof v === "function" ? (v as () => unknown)() : v;
      }
    }
    return filtered;
  }

  protected hideColumns<T extends DatabaseRecord>(
    data: T | T[],
    skipHidden = false,
  ): T | T[] {
    if (skipHidden || this.hidden.length === 0) {
      return data;
    }

    const hide = (obj: T): T => {
      const r = { ...obj };
      this.hidden.forEach((k) => delete r[k]);
      return r;
    };

    return Array.isArray(data) ? data.map(hide) : hide(data);
  }

  protected castAttributes<T extends DatabaseRecord>(data: T): T {
    const r: DatabaseRecord = { ...(data as DatabaseRecord) };
    for (const [key, type] of Object.entries(this.casts)) {
      const v = r[key];
      if (v === undefined || v === null) continue;
      switch (type) {
        case "int":
        case "integer":
          r[key] = parseInt(String(v), 10);
          break;
        case "float":
        case "decimal":
          r[key] = parseFloat(String(v));
          break;
        case "bool":
        case "boolean":
          r[key] = Boolean(v);
          break;
        case "json":
          r[key] = typeof v === "string" ? JSON.parse(v) : v;
          break;
        case "string":
          r[key] = String(v);
          break;
        case "date":
          r[key] = new Date(String(v));
          break;
      }
    }
    return r as T;
  }

  private _transform<T extends DatabaseRecord>(
    data: T | T[],
    skipHidden = false,
  ): T | T[] {
    const process = (row: T): T =>
      this.castAttributes(this.hideColumns(row, skipHidden) as T);

    return Array.isArray(data) ? data.map(process) : process(data);
  }

  // ====================================================
  // LIFECYCLE HOOKS  (override in subclass)
  // ====================================================
  protected async beforeCreate(_data: DatabaseRecord): Promise<void> {}
  protected async afterCreate(_result: DatabaseRecord): Promise<void> {}
  protected async beforeUpdate(
    _id: number,
    _data: DatabaseRecord,
  ): Promise<void> {}
  protected async afterUpdate(_result: DatabaseRecord): Promise<void> {}
  protected async beforeDelete(_id: number): Promise<void> {}
  protected async afterDelete(_id: number): Promise<void> {}

  // ====================================================
  // CRUD OPERATIONS
  // ====================================================

  async findAll<T extends DatabaseRecord = DatabaseRecord>(
    options: FindAllOptions = {},
  ): Promise<T[]> {
    const {
      where = {},
      columns = "*",
      joins = [],
      orderBy = null,
      direction = "ASC",
      groupBy = null,
      having = null,
      limit = null,
      offset = null,
      transaction,
    } = options;

    try {
      const hasJoins = Array.isArray(joins) ? joins.length > 0 : !!joins;
      const alias = hasJoins ? this.tableAlias : null;

      const select = this._buildSelectClause(columns, alias);
      const join = this._buildJoinClause(joins as JoinConfig[]);
      const { clause: where_, params: wp } = this._buildWhereClause(
        where,
        alias,
      );
      const group = this._buildGroupClause(groupBy);
      const having_ = this._buildHavingClause(having);
      const order = this._buildOrderClause(orderBy, direction);
      const { clause: limit_, params: lp } = this._buildLimitClause(
        limit,
        offset,
      );

      const tableRef = alias ? `${this.tableName} ${alias}` : this.tableName;
      let sql = `SELECT ${select} FROM ${tableRef}${join}${where_}`;

      if (this.softDelete) {
        const dc = alias ? `${alias}.deleted_at` : "deleted_at";
        sql += where_ ? ` AND ${dc} IS NULL` : ` WHERE ${dc} IS NULL`;
      }
      sql += `${group}${having_}${order}${limit_}`;

      const rows = await this._execute<T[]>(this._executor(transaction), sql, [
        ...wp,
        ...lp,
      ]);
      return this._transform(rows) as T[];
    } catch (error) {
      logger.error(`Error in ${this.tableName}.findAll:`, error);
      throw error;
    }
  }

  async findById<T extends DatabaseRecord = DatabaseRecord>(
    id: number,
    options: FindOneOptions = {},
  ): Promise<T | null> {
    const { columns = "*", joins = [], transaction } = options;
    try {
      const hasJoins = Array.isArray(joins) ? joins.length > 0 : !!joins;
      const alias = hasJoins ? this.tableAlias : null;
      const select = this._buildSelectClause(columns, alias);
      const join = this._buildJoinClause(joins as JoinConfig[]);
      const tableRef = alias ? `${this.tableName} ${alias}` : this.tableName;
      const pk = alias ? `${alias}.${this.primaryKey}` : this.primaryKey;

      let sql = `SELECT ${select} FROM ${tableRef}${join} WHERE ${pk} = ?`;
      if (this.softDelete) {
        const dc = alias ? `${alias}.deleted_at` : "deleted_at";
        sql += ` AND ${dc} IS NULL`;
      }
      sql += " LIMIT 1";

      const row = await this._execute<T>(
        this._executor(transaction),
        sql,
        [id],
        "oneOrNone",
      );
      return row ? (this._transform(row, columns === "*") as T) : null;
    } catch (error) {
      logger.error(`Error in ${this.tableName}.findById:`, error);
      throw error;
    }
  }

  async findOne<T extends DatabaseRecord = DatabaseRecord>(
    where: WhereFilters = {},
    options: FindOneOptions = {},
  ): Promise<T | null> {
    const { columns = "*", joins = [], transaction } = options;
    try {
      const hasJoins = Array.isArray(joins) ? joins.length > 0 : !!joins;
      const alias = hasJoins ? this.tableAlias : null;
      const select = this._buildSelectClause(columns, alias);
      const join = this._buildJoinClause(joins as JoinConfig[]);
      const { clause: where_, params } = this._buildWhereClause(where, alias);
      const tableRef = alias ? `${this.tableName} ${alias}` : this.tableName;

      let sql = `SELECT ${select} FROM ${tableRef}${join}${where_}`;
      if (this.softDelete) {
        const dc = alias ? `${alias}.deleted_at` : "deleted_at";
        sql += where_ ? ` AND ${dc} IS NULL` : ` WHERE ${dc} IS NULL`;
      }
      sql += " LIMIT 1";

      const row = await this._execute<T>(
        this._executor(transaction),
        sql,
        params,
        "oneOrNone",
      );
      return row ? (this._transform(row) as T) : null;
    } catch (error) {
      logger.error(`Error in ${this.tableName}.findOne:`, error);
      throw error;
    }
  }

  async create<T extends DatabaseRecord = DatabaseRecord>(
    data: DatabaseRecord,
    options: CreateOptions = {},
  ): Promise<T> {
    const { transaction } = options;
    try {
      const filtered = this._filterFillable(data);
      if (this.timestamps) {
        filtered.created_at = new Date();
        filtered.updated_at = new Date();
      }

      await this.beforeCreate(filtered);

      const cols = Object.keys(filtered);
      const vals = Object.values(filtered);
      const places = cols.map(() => "?").join(", ");
      const sql = `INSERT INTO ${this.tableName} (${cols.join(", ")}) VALUES (${places})`;

      const executor = this._executor(transaction);
      const [result] = await executor.query(sql, vals);
      const insertId = (result as mysql.ResultSetHeader).insertId;

      const inserted = await this.findById<T>(insertId, { transaction });
      if (!inserted)
        throw new Error(
          `Failed to retrieve inserted row from ${this.tableName}`,
        );

      await this.afterCreate(inserted as DatabaseRecord);
      return inserted;
    } catch (error) {
      logger.error(`Error in ${this.tableName}.create:`, error);
      throw error;
    }
  }

  async createMany<T extends DatabaseRecord = DatabaseRecord>(
    dataArray: DatabaseRecord[],
    options: CreateOptions = {},
  ): Promise<T[]> {
    const { transaction } = options;
    try {
      const results: T[] = [];
      if (transaction) {
        // Already inside a transaction — just run sequentially
        for (const data of dataArray) {
          results.push(await this.create<T>(data, { transaction }));
        }
      } else {
        await this.transaction(async (conn) => {
          for (const data of dataArray) {
            results.push(await this.create<T>(data, { transaction: conn }));
          }
        });
      }
      return results;
    } catch (error) {
      logger.error(`Error in ${this.tableName}.createMany:`, error);
      throw error;
    }
  }

  async update<T extends DatabaseRecord = DatabaseRecord>(
    id: number,
    data: DatabaseRecord,
    options: UpdateOptions = {},
  ): Promise<T | null> {
    const { transaction } = options;
    try {
      const filtered = this._filterFillable(data);
      if (Object.keys(filtered).length === 0)
        return this.findById<T>(id, { transaction });
      if (this.timestamps) filtered.updated_at = new Date();

      await this.beforeUpdate(id, filtered);

      const fields = Object.keys(filtered);
      const vals = Object.values(filtered);
      const set = fields.map((f) => `${f} = ?`).join(", ");
      const sql = `UPDATE ${this.tableName} SET ${set} WHERE ${this.primaryKey} = ?${this.softDelete ? " AND deleted_at IS NULL" : ""}`;

      await this._executor(transaction).query(sql, [...vals, id]);
      const result = await this.findById<T>(id, { transaction });
      if (result) await this.afterUpdate(result as DatabaseRecord);
      return result;
    } catch (error) {
      logger.error(`Error in ${this.tableName}.update:`, error);
      throw error;
    }
  }

  async updateWhere<T extends DatabaseRecord = DatabaseRecord>(
    where: WhereFilters,
    data: DatabaseRecord,
    options: UpdateOptions = {},
  ): Promise<T[]> {
    const { transaction } = options;
    try {
      const filtered = this._filterFillable(data);
      if (Object.keys(filtered).length === 0) return [];
      if (this.timestamps) filtered.updated_at = new Date();

      const setFields = Object.keys(filtered);
      const setVals = Object.values(filtered);
      const set = setFields.map((f) => `${f} = ?`).join(", ");
      const { clause: where_, params: wp } = this._buildWhereClause(where);

      const softCheck = this.softDelete
        ? where_
          ? " AND deleted_at IS NULL"
          : " WHERE deleted_at IS NULL"
        : "";
      const sql = `UPDATE ${this.tableName} SET ${set}${where_}${softCheck}`;

      await this._executor(transaction).query(sql, [...setVals, ...wp]);

      // Re-fetch updated rows
      return this.findAll<T>({ where, transaction });
    } catch (error) {
      logger.error(`Error in ${this.tableName}.updateWhere:`, error);
      throw error;
    }
  }

  async delete(id: number, options: DeleteOptions = {}): Promise<boolean> {
    const { transaction, force = false } = options;
    try {
      await this.beforeDelete(id);
      let sql: string;
      if (this.softDelete && !force) {
        sql = `UPDATE ${this.tableName} SET deleted_at = CURRENT_TIMESTAMP${this.timestamps ? ", updated_at = CURRENT_TIMESTAMP" : ""} WHERE ${this.primaryKey} = ? AND deleted_at IS NULL`;
      } else {
        sql = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
      }
      await this._executor(transaction).query(sql, [id]);
      await this.afterDelete(id);
      return true;
    } catch (error) {
      logger.error(`Error in ${this.tableName}.delete:`, error);
      throw error;
    }
  }

  async deleteWhere(
    where: WhereFilters,
    options: DeleteOptions = {},
  ): Promise<number> {
    const { transaction, force = false } = options;
    try {
      const { clause: where_, params } = this._buildWhereClause(where);
      let sql: string;
      if (this.softDelete && !force) {
        sql = `UPDATE ${this.tableName} SET deleted_at = CURRENT_TIMESTAMP${this.timestamps ? ", updated_at = CURRENT_TIMESTAMP" : ""}${where_}${where_ ? " AND" : " WHERE"} deleted_at IS NULL`;
      } else {
        sql = `DELETE FROM ${this.tableName}${where_}`;
      }
      const [result] = await this._executor(transaction).query(sql, params);
      return (result as mysql.ResultSetHeader).affectedRows ?? 0;
    } catch (error) {
      logger.error(`Error in ${this.tableName}.deleteWhere:`, error);
      throw error;
    }
  }

  async restore<T extends DatabaseRecord = DatabaseRecord>(
    id: number,
    options: { transaction?: DbConnection } = {},
  ): Promise<T | null> {
    if (!this.softDelete)
      throw new Error("restore() is only available on soft-delete models");
    const { transaction } = options;
    try {
      const sql = `UPDATE ${this.tableName} SET deleted_at = NULL${this.timestamps ? ", updated_at = CURRENT_TIMESTAMP" : ""} WHERE ${this.primaryKey} = ?`;
      await this._executor(transaction).query(sql, [id]);
      return this.findById<T>(id, { transaction });
    } catch (error) {
      logger.error(`Error in ${this.tableName}.restore:`, error);
      throw error;
    }
  }

  // ====================================================
  // AGGREGATION & UTILITIES
  // ====================================================

  async count(
    where: WhereFilters = {},
    options: FindOneOptions = {},
  ): Promise<number> {
    const { joins = [], transaction } = options;
    try {
      const hasJoins = Array.isArray(joins) ? joins.length > 0 : !!joins;
      const alias = hasJoins ? this.tableAlias : null;
      const join = this._buildJoinClause(joins as JoinConfig[]);
      const { clause: where_, params } = this._buildWhereClause(where, alias);
      const tableRef = alias ? `${this.tableName} ${alias}` : this.tableName;

      let sql = `SELECT COUNT(*) AS \`count\` FROM ${tableRef}${join}${where_}`;
      if (this.softDelete) {
        const dc = alias ? `${alias}.deleted_at` : "deleted_at";
        sql += where_ ? ` AND ${dc} IS NULL` : ` WHERE ${dc} IS NULL`;
      }

      const row = await this._execute<{ count: string }>(
        this._executor(transaction),
        sql,
        params,
        "one",
      );
      return parseInt(row.count, 10);
    } catch (error) {
      logger.error(`Error in ${this.tableName}.count:`, error);
      throw error;
    }
  }

  async exists(
    where: WhereFilters = {},
    options: FindOneOptions = {},
  ): Promise<boolean> {
    return (await this.count(where, options)) > 0;
  }

  async paginate<T extends DatabaseRecord = DatabaseRecord>(
    options: PaginateOptions = {},
  ) {
    const { page = 1, limit = 20, ...rest } = options;
    const offset = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.findAll<T>({ ...rest, limit, offset }),
      this.count(rest.where ?? {}, { transaction: rest.transaction }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        currentPage: page,
        hasMore: page < totalPages,
      },
    };
  }

  async search<T extends DatabaseRecord = DatabaseRecord>(
    term: string,
    options: FindAllOptions = {},
  ): Promise<T[]> {
    if (!this.searchable.length) return this.findAll<T>(options);
    const {
      where = {},
      columns = "*",
      limit = 20,
      offset = 0,
      transaction,
    } = options;
    try {
      const { clause: where_, params: wp } = this._buildWhereClause(where);
      // Each searchable column gets its own `?` with the same search term
      // MySQL utf8mb4_unicode_ci is case-insensitive, so LIKE behaves like ILIKE
      const cols = this.searchable.map((c) => `CAST(${c} AS CHAR) LIKE ?`);
      const searchParams = this.searchable.map(() => `%${term}%`);
      const combiner = where_ ? " AND" : " WHERE";
      const limitClause = ` LIMIT ? OFFSET ?`;
      const sql = `SELECT ${columns} FROM ${this.tableName}${where_}${combiner} (${cols.join(" OR ")})${limitClause}`;
      const rows = await this._execute<T[]>(this._executor(transaction), sql, [
        ...wp,
        ...searchParams,
        limit,
        offset,
      ]);
      return this._transform(rows) as T[];
    } catch (error) {
      logger.error(`Error in ${this.tableName}.search:`, error);
      throw error;
    }
  }

  async raw<T = unknown>(
    sql: string,
    params: unknown[] = [],
    options: RawOptions = {},
  ): Promise<T> {
    const { method = "any", transaction } = options;
    try {
      return await this._execute<T>(
        this._executor(transaction),
        sql,
        params,
        method,
      );
    } catch (error) {
      logger.error(`Error in ${this.tableName}.raw:`, error);
      throw error;
    }
  }

  /**
   * Run a callback inside a MySQL transaction.
   * Automatically commits on success, rolls back on error.
   */
  async transaction<T>(
    callback: (conn: mysql.PoolConnection) => Promise<T>,
  ): Promise<T> {
    const conn = await this.pool.getConnection();
    await conn.beginTransaction();
    try {
      const result = await callback(conn);
      await conn.commit();
      return result;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

export default BaseModel;
