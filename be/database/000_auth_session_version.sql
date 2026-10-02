-- Add a per-user session version so logout-all invalidates access tokens immediately.
-- This migration is idempotent and runs before the repository procedures.
SET @auth_version_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'auth_version'
)$$

SET @auth_version_ddl = IF(
  @auth_version_exists = 0,
  'ALTER TABLE users ADD COLUMN auth_version INT UNSIGNED NOT NULL DEFAULT 0 COMMENT ''Tăng để vô hiệu hóa toàn bộ JWT cũ'' AFTER status',
  'SELECT 1'
)$$

PREPARE auth_version_statement FROM @auth_version_ddl$$
EXECUTE auth_version_statement$$
DEALLOCATE PREPARE auth_version_statement$$
