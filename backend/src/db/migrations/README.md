# Put your SQL migration files here.
# File naming convention: 001_create_table_name.sql
# For rollbacks, create matching: 001_create_table_name.rollback.sql
#
# Example migration (001_create_users.sql):
#
# CREATE TABLE IF NOT EXISTS users (
#   id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
#   email          VARCHAR(255) NOT NULL UNIQUE,
#   password_hash  VARCHAR(255) NOT NULL,
#   name           VARCHAR(255),
#   user_type      VARCHAR(50) NOT NULL DEFAULT 'user',
#   phone          VARCHAR(20),
#   avatar_url     VARCHAR(500),
#   bio            TEXT,
#   timezone       VARCHAR(100) DEFAULT 'UTC',
#   language       VARCHAR(10)  DEFAULT 'en',
#   is_verified    BOOLEAN NOT NULL DEFAULT false,
#   is_active      BOOLEAN NOT NULL DEFAULT true,
#   login_count    INTEGER NOT NULL DEFAULT 0,
#   last_login_at    TIMESTAMPTZ,
#   last_activity_at TIMESTAMPTZ,
#   created_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
#   updated_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
# );
