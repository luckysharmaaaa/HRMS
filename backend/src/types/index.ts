// ```ts
import { Request } from 'express';
import { Pool, PoolConnection } from 'mysql2/promise';

// ============================================================
// DATABASE TYPES
// ============================================================

/** Generic record returned from the database */
export type DatabaseRecord = Record<string, unknown>;

/** mysql2 connection types */
export type DbConnection = Pool | PoolConnection;
export type DbTransaction = PoolConnection;

// ============================================================
// USER TYPES
// ============================================================

export type UserType =
    | 'super_admin'
    | 'admin'
    | 'hr_manager'
    | 'hr_executive'
    | 'employee';

export interface User extends DatabaseRecord {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    password?: string;
    status: '0' | '1';

    createdAt?: number | null;
    createdBy?: number | null;

    updatedAt?: number | null;
    updatedBy?: number | null;

    trashedAt?: number | null;
    trashedBy?: number | null;
}

// ============================================================
// CLIENT TYPES
// ============================================================

export interface Client extends DatabaseRecord {
    id: number;

    parent_client_id?: number | null;
    name: string;
    slug: string;
    client_type?: string | null;
    status: string;

    contact_email?: string | null;
    contact_phone?: string | null;
    address?: string | null;
    logo_url?: string | null;

    subscription_plan?: string | null;
    settings?: Record<string, unknown> | null;

    createdAt?: number | null;
    createdBy?: number | null;

    updatedAt?: number | null;
    updatedBy?: number | null;

    trashedAt?: number | null;
    trashedBy?: number | null;
}

// ============================================================
// ROLE TYPES
// ============================================================

export interface Role extends DatabaseRecord {
    id: number;
    roleName: string;
    roleCode: string;
    description?: string | null;
    status: '0' | '1';

    createdAt?: number | null;
    createdBy?: number | null;

    updatedAt?: number | null;
    updatedBy?: number | null;

    trashedAt?: number | null;
    trashedBy?: number | null;
}

export interface UserRole extends DatabaseRecord {
    id: number;
    userId: number;
    roleId: number;

    createdAt?: number | null;
    createdBy?: number | null;

    updatedAt?: number | null;
    updatedBy?: number | null;

    trashedAt?: number | null;
    trashedBy?: number | null;
}

// ============================================================
// MODULE TYPES
// ============================================================

export interface Module extends DatabaseRecord {
    id: number;
    moduleName: string;
    moduleCode: string;
    description?: string | null;
    status: '0' | '1';
}

export interface Action extends DatabaseRecord {
    id: number;
    actionName: string;
    actionCode: string;
    description?: string | null;
    status: '0' | '1';

    createdAt?: number | null;
    createdBy?: number | null;

    updatedAt?: number | null;
    updatedBy?: number | null;

    trashedAt?: number | null;
    trashedBy?: number | null;
}

export interface Permission extends DatabaseRecord {
    id: number;
    roleId: number;
    moduleId: number;
    action: 'view' | 'add' | 'edit' | 'delete' | 'approved';

    createdAt?: number | null;
    createdBy?: number | null;

    updatedAt?: number | null;
    updatedBy?: number | null;
}

// ============================================================
// AUTH TYPES
// ============================================================

export interface TokenPayload {
    userId: number;
    email: string;

    clientId?: number | null;

    roleId: number;
    roleSlug: string;
    level: number;

    iat?: number;
    exp?: number;
}

export interface AuthenticatedUser {
    userId: number;
    email: string;

    clientId?: number | null;

    roleId: number;
    roleSlug: string;
    level: number;
}

export interface AuthResponse {
    user: Partial<User>;
    roles: Role[];
    accessToken: string;
    refreshToken: string;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    errors?: string[];
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    currentPage: number;
    hasMore: boolean;
}

export interface PaginatedResponse<T = unknown> {
    success: boolean;
    message: string;
    data: T[];
    pagination: PaginationMeta;
}

// ============================================================
// BASE MODEL TYPES
// ============================================================

export type CastType =
    | 'integer'
    | 'int'
    | 'float'
    | 'decimal'
    | 'boolean'
    | 'bool'
    | 'json'
    | 'string'
    | 'date';

export type QueryMethod =
    | 'any'
    | 'one'
    | 'oneOrNone'
    | 'none'
    | 'many'
    | 'result';

export interface JoinConfig {
    type?: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
    table: string;
    alias?: string;
    on: string;
}

export interface WhereValue {
    operator: string;
    value: unknown;
}

export type WhereFilters = Record<
    string,
    unknown | null | unknown[] | WhereValue
>;

export interface ModelConfig {
    tableName: string;
    tableAlias?: string;
    primaryKey?: string;
    fillable?: string[];
    guarded?: string[];
    hidden?: string[];
    timestamps?: boolean;
    softDelete?: boolean;
    searchable?: string[];
    casts?: Record<string, CastType>;
    defaults?: Record<string, unknown>;
}

export interface FindAllOptions {
    where?: WhereFilters;
    columns?: string | string[];
    joins?: JoinConfig | JoinConfig[];
    orderBy?: string | string[] | null;
    direction?: 'ASC' | 'DESC';
    groupBy?: string | string[] | null;
    having?: string | null;
    limit?: number | null;
    offset?: number | null;
    transaction?: DbConnection;
}

export interface FindOneOptions {
    columns?: string | string[];
    joins?: JoinConfig | JoinConfig[];
    transaction?: DbConnection;
}

export interface CreateOptions {
    transaction?: DbConnection;
}

export interface UpdateOptions {
    transaction?: DbConnection;
}

export interface DeleteOptions {
    transaction?: DbConnection;
    force?: boolean;
}

export interface PaginateOptions extends FindAllOptions {
    page?: number;
    limit?: number;
}

export interface RawOptions {
    method?: QueryMethod;
    transaction?: DbConnection;
}

// ============================================================
// CONFIG TYPES
// ============================================================

export interface ServerConfig {
    port: number;
    env: string;
    apiVersion: string;
}

export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    poolMin: number;
    poolMax: number;
}

export interface JWTConfig {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
}

export interface CorsConfig {
    origin: string[];
    credentials: boolean;
}

export interface RateLimitConfig {
    windowMs: number;
    max: number;
}

export interface UploadConfig {
    maxFileSize: number;
    path: string;
}

export interface LoggingConfig {
    level: string;
    filePath: string;
}

export interface EmailConfig {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    from: string;
}

export interface AppConfig {
    server: ServerConfig;
    database: DatabaseConfig;
    jwt: JWTConfig;
    cors: CorsConfig;
    rateLimit: RateLimitConfig;
    upload: UploadConfig;
    logging: LoggingConfig;
    email: EmailConfig;
    frontendUrl: string;
}

// ============================================================
// EXPRESS AUGMENTATION
// ============================================================

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

export interface AuthRequest extends Request {
    user: AuthenticatedUser;
}

// ============================================================
// COMMON TYPES
// ============================================================

export interface SelectOption {
    label: string;
    value: string | number;
}

export interface SortOptions {
    field: string;
    direction: 'ASC' | 'DESC';
}

export interface SearchOptions {
    keyword?: string;
    page?: number;
    limit?: number;
    sort?: SortOptions;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    user: Partial<User>;
    roles: Role[];
    accessToken: string;
    refreshToken: string;
}

export interface JwtUser {
    userId: number;
    email: string;

    clientId?: number | null;

    roleId: number;
    roleSlug: string;
    level: number;
}

// ============================================================
// UTILITY TYPES
// ============================================================

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type PartialBy<T, K extends keyof T> =
    Omit<T, K> &
    Partial<Pick<T, K>>;

export type RequiredBy<T, K extends keyof T> =
    Omit<T, K> &
    Required<Pick<T, K>>;

export type AsyncHandler = (
    req: Request,
    res: import('express').Response,
    next: import('express').NextFunction
) => Promise<void>;
