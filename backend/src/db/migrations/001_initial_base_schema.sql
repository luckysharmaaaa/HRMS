-- 001_initial_base_schema.sql
-- Unified Initial Database Schema for Advanced Base API (MySQL 8.0+)
-- Includes: Multi-Tenancy, Advanced RBAC, Auditing, Utilities, and Media Management
-- PKs: INT AUTO_INCREMENT

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. MULTI-TENANCY (CLIENTS/ORGANIZATIONS)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    parent_client_id  INT          NULL,
    name              VARCHAR(255) NOT NULL,
    slug              VARCHAR(100) NOT NULL,
    client_type       VARCHAR(50)  DEFAULT 'organization',
    status            VARCHAR(50)  DEFAULT 'active',         -- active, inactive, suspended
    contact_email     VARCHAR(255) NULL,
    contact_phone     VARCHAR(50)  NULL,
    address           TEXT         NULL,
    logo_url          TEXT         NULL,
    subscription_plan VARCHAR(50)  DEFAULT 'basic',
    settings          JSON         NULL,                     -- dynamic config (branding, feature flags)
    created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at        DATETIME(3)  NULL,
    UNIQUE KEY uq_clients_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Self-referencing FK added after table creation
ALTER TABLE clients
    ADD CONSTRAINT fk_clients_parent
        FOREIGN KEY (parent_client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- 2. USERS (CORE IDENTITY)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    email             VARCHAR(255) NOT NULL,
    password_hash     VARCHAR(255) NOT NULL,
    name              VARCHAR(255) NOT NULL,
    phone             VARCHAR(20)  NULL,
    avatar_url        VARCHAR(500) NULL,
    bio               TEXT         NULL,
    timezone          VARCHAR(100) DEFAULT 'UTC',
    language          VARCHAR(10)  DEFAULT 'en',
    is_verified       TINYINT(1)   NOT NULL DEFAULT 0,
    is_active         TINYINT(1)   NOT NULL DEFAULT 1,
    login_count       INT          NOT NULL DEFAULT 0,
    last_login_at     DATETIME(3)  NULL,
    last_activity_at  DATETIME(3)  NULL,
    deleted_at        DATETIME(3)  NULL,
    created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. RBAC & ABAC (ROLES, MODULES, ACTIONS, PERMISSIONS)
-- -----------------------------------------------------------------------------

-- Roles definition with hierarchy and privilege levels
CREATE TABLE IF NOT EXISTS roles (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    name              VARCHAR(100) NOT NULL,
    slug              VARCHAR(100) NOT NULL,
    description       TEXT         NULL,
    level             INT          DEFAULT 10,    -- 100=Super, 50=Admin, 10=User
    is_system         TINYINT(1)   DEFAULT 0,
    parent_role_id    INT          NULL,
    client_id         INT          NULL,           -- NULL for global/system roles
    created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE KEY uq_roles_slug (slug),
    CONSTRAINT fk_roles_parent FOREIGN KEY (parent_role_id) REFERENCES roles(id)  ON DELETE SET NULL,
    CONSTRAINT fk_roles_client FOREIGN KEY (client_id)      REFERENCES clients(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System modules/features
CREATE TABLE IF NOT EXISTS modules (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    name              VARCHAR(100) NOT NULL,
    slug              VARCHAR(100) NOT NULL,
    description       TEXT         NULL,
    is_active         TINYINT(1)   DEFAULT 1,
    sort_order        INT          DEFAULT 0,
    created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE KEY uq_modules_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Granular actions
CREATE TABLE IF NOT EXISTS actions (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    name              VARCHAR(100) NOT NULL,
    slug              VARCHAR(100) NOT NULL,
    description       TEXT         NULL,
    created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE KEY uq_actions_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permissions (Pivot with ABAC Condition support)
CREATE TABLE IF NOT EXISTS permissions (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    role_id           INT          NULL,
    user_id           INT          NULL,           -- direct override
    module_id         INT          NOT NULL,
    action_id         INT          NOT NULL,
    scope             VARCHAR(50)  DEFAULT 'client',  -- client, own, all
    conditions        JSON         NULL,              -- e.g. {"owner_id": "$user_id"}
    created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_perm_role   FOREIGN KEY (role_id)   REFERENCES roles(id)   ON DELETE CASCADE,
    CONSTRAINT fk_perm_user   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
    CONSTRAINT fk_perm_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    CONSTRAINT fk_perm_action FOREIGN KEY (action_id) REFERENCES actions(id) ON DELETE CASCADE,
    CONSTRAINT chk_role_or_user CHECK (
        (role_id IS NOT NULL AND user_id IS NULL) OR
        (role_id IS NULL AND user_id IS NOT NULL)
    ),
    UNIQUE KEY uq_role_perm (role_id, module_id, action_id),
    UNIQUE KEY uq_user_perm (user_id, module_id, action_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Flexible User Access Mapping (Many-to-Many User-Client-Role)
CREATE TABLE IF NOT EXISTS user_client_roles (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    user_id           INT          NOT NULL,
    client_id         INT          NULL,           -- NULL for global/system access
    role_id           INT          NOT NULL,
    is_default        TINYINT(1)   DEFAULT 0,
    created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_ucr_user   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
    CONSTRAINT fk_ucr_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_ucr_role   FOREIGN KEY (role_id)   REFERENCES roles(id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. UTILITIES (LOGS, SETTINGS, NOTIFICATIONS, MEDIA)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS activity_logs (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    user_id           INT          NULL,
    client_id         INT          NULL,
    action            VARCHAR(255) NOT NULL,
    entity_type       VARCHAR(100) NULL,
    entity_id         INT          NULL,
    details           JSON         NULL,
    metadata          JSON         NULL,  -- device, ip, browser
    created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_al_user   FOREIGN KEY (user_id)   REFERENCES users(id),
    CONSTRAINT fk_al_client FOREIGN KEY (client_id) REFERENCES clients(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    user_id           INT          NULL,
    client_id         INT          NULL,
    action            VARCHAR(100) NOT NULL,
    entity_type       VARCHAR(100) NOT NULL,
    entity_id         INT          NOT NULL,
    old_values        JSON         NULL,
    new_values        JSON         NULL,
    created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_aul_user   FOREIGN KEY (user_id)   REFERENCES users(id),
    CONSTRAINT fk_aul_client FOREIGN KEY (client_id) REFERENCES clients(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_settings (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    user_id           INT          NOT NULL,
    notifications     JSON         NULL,
    preferences       JSON         NULL,
    created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE KEY uq_user_settings (user_id),
    CONSTRAINT fk_us_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    user_id           INT          NOT NULL,
    sender_id         INT          NULL,
    title             VARCHAR(255) NOT NULL,
    message           TEXT         NOT NULL,
    type              VARCHAR(50)  DEFAULT 'info',
    action_url        VARCHAR(500) NULL,
    data              JSON         NULL,
    is_read           TINYINT(1)   DEFAULT 0,
    read_at           DATETIME(3)  NULL,
    created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_notif_user   FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_notif_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media_assets (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    file_name         VARCHAR(255) NOT NULL,
    original_name     VARCHAR(255) NOT NULL,
    file_url          TEXT         NOT NULL,
    mime_type         VARCHAR(100) NOT NULL,
    size_bytes        BIGINT       NOT NULL,
    uploaded_by       INT          NULL,
    client_id         INT          NULL,
    entity_type       VARCHAR(50)  NULL,
    entity_id         INT          NULL,
    created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_ma_user   FOREIGN KEY (uploaded_by) REFERENCES users(id)   ON DELETE SET NULL,
    CONSTRAINT fk_ma_client FOREIGN KEY (client_id)   REFERENCES clients(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- 5. INITIAL SEED DATA
-- -----------------------------------------------------------------------------

-- Core Actions
INSERT IGNORE INTO actions (name, slug) VALUES
('Create',  'create'),
('Read',    'read'),
('Update',  'update'),
('Delete',  'delete'),
('Export',  'export'),
('Import',  'import'),
('Approve', 'approve');

-- Core Modules
INSERT IGNORE INTO modules (name, slug, sort_order) VALUES
('Dashboard',   'dashboard', 1),
('User Mgmt',   'users',     2),
('Role Mgmt',   'roles',     3),
('Client Mgmt', 'clients',   4),
('Settings',    'settings',  5),
('Logs',        'logs',      6);

-- System Roles
INSERT IGNORE INTO roles (name, slug, description, level, is_system) VALUES
('Super Admin',  'super_admin',  'Unrestricted system-wide access.',    100, 1),
('Client Admin', 'client_admin', 'Full access within a single client.',  50, 1),
('User',         'user',         'Standard application user.',           10, 1);

-- NOTE: Super Admin permissions are seeded at the application level via `npm run seed`
-- because MySQL does not support PL/pgSQL procedural blocks.
-- Run: npm run migrate && npm run seed
