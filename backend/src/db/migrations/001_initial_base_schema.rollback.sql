-- 001_initial_base_schema.rollback.sql
-- Rollback for the unified initial migration (MySQL)
-- Tables dropped in reverse dependency order (no CASCADE needed in MySQL DROP TABLE)

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS media_assets;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS user_settings;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS user_client_roles;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS actions;
DROP TABLE IF EXISTS modules;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS clients;

SET FOREIGN_KEY_CHECKS = 1;
