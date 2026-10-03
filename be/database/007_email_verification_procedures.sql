-- Email verification for newly registered accounts.
SET @email_verified_column_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email_verified_at'
)$$

SET @email_verified_column_ddl = IF(
  @email_verified_column_exists = 0,
  'ALTER TABLE users ADD COLUMN email_verified_at DATETIME NULL COMMENT ''NULL cho đến khi xác nhận OTP đăng ký'' AFTER auth_version',
  'SELECT 1'
)$$
PREPARE email_verified_column_statement FROM @email_verified_column_ddl$$
EXECUTE email_verified_column_statement$$
DEALLOCATE PREPARE email_verified_column_statement$$

SET @email_verified_backfill = IF(
  @email_verified_column_exists = 0,
  'UPDATE users SET email_verified_at = COALESCE(created_at, CURRENT_TIMESTAMP)',
  'SELECT 1'
)$$
PREPARE email_verified_backfill_statement FROM @email_verified_backfill$$
EXECUTE email_verified_backfill_statement$$
DEALLOCATE PREPARE email_verified_backfill_statement$$

CREATE TABLE IF NOT EXISTS email_verification_codes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  code_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_email_verification_user_created (user_id, created_at),
  KEY idx_email_verification_expires (expires_at),
  CONSTRAINT fk_email_verification_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci$$

DELIMITER $$
DROP PROCEDURE IF EXISTS sp_auth_finduserforlogin_1$$
CREATE PROCEDURE sp_auth_finduserforlogin_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id, full_name, email, phone, password_hash, avatar_url, role, status,
         auth_version, email_verified_at, deleted_at, created_at, updated_at
  FROM users WHERE email = p_1 LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_emailverification_finduserbyemail_1$$
CREATE PROCEDURE sp_emailverification_finduserbyemail_1(IN p_email VARCHAR(191))
BEGIN
  SELECT id, full_name, email, status, email_verified_at, deleted_at
  FROM users WHERE email = p_email LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_emailverification_invalidatecodes_1$$
CREATE PROCEDURE sp_emailverification_invalidatecodes_1(IN p_user_id BIGINT UNSIGNED)
BEGIN
  UPDATE email_verification_codes SET used_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id AND used_at IS NULL;
  SELECT ROW_COUNT() AS affectedRows, 0 AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_emailverification_createcode_1$$
CREATE PROCEDURE sp_emailverification_createcode_1(IN p_user_id BIGINT UNSIGNED, IN p_code_hash CHAR(64), IN p_expires_at DATETIME)
BEGIN
  INSERT INTO email_verification_codes (user_id, code_hash, expires_at)
  VALUES (p_user_id, p_code_hash, p_expires_at);
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_emailverification_findlatestforupdate_1$$
CREATE PROCEDURE sp_emailverification_findlatestforupdate_1(IN p_user_id BIGINT UNSIGNED)
BEGIN
  SELECT id, user_id, code_hash, expires_at, used_at, attempts
  FROM email_verification_codes WHERE user_id = p_user_id
  ORDER BY id DESC LIMIT 1 FOR UPDATE;
END$$

DROP PROCEDURE IF EXISTS sp_emailverification_incrementattempts_1$$
CREATE PROCEDURE sp_emailverification_incrementattempts_1(IN p_id BIGINT UNSIGNED)
BEGIN
  UPDATE email_verification_codes SET attempts = attempts + 1
  WHERE id = p_id AND used_at IS NULL;
  SELECT ROW_COUNT() AS affectedRows, 0 AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_emailverification_markused_1$$
CREATE PROCEDURE sp_emailverification_markused_1(IN p_id BIGINT UNSIGNED)
BEGIN
  UPDATE email_verification_codes SET used_at = CURRENT_TIMESTAMP
  WHERE id = p_id AND used_at IS NULL;
  SELECT ROW_COUNT() AS affectedRows, 0 AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_emailverification_verifyuser_1$$
CREATE PROCEDURE sp_emailverification_verifyuser_1(IN p_user_id BIGINT UNSIGNED)
BEGIN
  UPDATE users SET email_verified_at = CURRENT_TIMESTAMP
  WHERE id = p_user_id AND email_verified_at IS NULL AND deleted_at IS NULL;
  SELECT ROW_COUNT() AS affectedRows, 0 AS insertId;
END$$

DELIMITER ;
