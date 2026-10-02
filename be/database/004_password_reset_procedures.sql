CREATE TABLE IF NOT EXISTS password_reset_codes (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  code_hash   CHAR(64)        NOT NULL COMMENT 'HMAC-SHA256 cua ma OTP, khong luu ma goc',
  expires_at  DATETIME        NOT NULL,
  used_at     DATETIME        NULL,
  attempts    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_password_reset_user_created (user_id, created_at),
  KEY idx_password_reset_expires (expires_at),
  CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Ma OTP dat lai mat khau'$$

DELIMITER $$
DROP PROCEDURE IF EXISTS sp_passwordreset_finduserbyemail_1$$
CREATE PROCEDURE sp_passwordreset_finduserbyemail_1(IN p_email VARCHAR(191))
BEGIN
  SELECT id, full_name, email, status, deleted_at FROM users WHERE email = p_email LIMIT 1;
END$$
DROP PROCEDURE IF EXISTS sp_passwordreset_invalidatecodes_1$$
CREATE PROCEDURE sp_passwordreset_invalidatecodes_1(IN p_user_id BIGINT UNSIGNED)
BEGIN
  UPDATE password_reset_codes SET used_at = CURRENT_TIMESTAMP WHERE user_id = p_user_id AND used_at IS NULL;
  SELECT ROW_COUNT() AS affectedRows, 0 AS insertId;
END$$
DROP PROCEDURE IF EXISTS sp_passwordreset_createcode_1$$
CREATE PROCEDURE sp_passwordreset_createcode_1(IN p_user_id BIGINT UNSIGNED, IN p_code_hash CHAR(64), IN p_expires_at DATETIME)
BEGIN
  INSERT INTO password_reset_codes (user_id, code_hash, expires_at) VALUES (p_user_id, p_code_hash, p_expires_at);
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$
DROP PROCEDURE IF EXISTS sp_passwordreset_findlatestforupdate_1$$
CREATE PROCEDURE sp_passwordreset_findlatestforupdate_1(IN p_user_id BIGINT UNSIGNED)
BEGIN
  SELECT id, user_id, code_hash, expires_at, used_at, attempts FROM password_reset_codes
  WHERE user_id = p_user_id ORDER BY id DESC LIMIT 1 FOR UPDATE;
END$$
DROP PROCEDURE IF EXISTS sp_passwordreset_incrementattempts_1$$
CREATE PROCEDURE sp_passwordreset_incrementattempts_1(IN p_id BIGINT UNSIGNED)
BEGIN
  UPDATE password_reset_codes SET attempts = attempts + 1 WHERE id = p_id AND used_at IS NULL;
  SELECT ROW_COUNT() AS affectedRows, 0 AS insertId;
END$$
DROP PROCEDURE IF EXISTS sp_passwordreset_markused_1$$
CREATE PROCEDURE sp_passwordreset_markused_1(IN p_id BIGINT UNSIGNED)
BEGIN
  UPDATE password_reset_codes SET used_at = CURRENT_TIMESTAMP WHERE id = p_id AND used_at IS NULL;
  SELECT ROW_COUNT() AS affectedRows, 0 AS insertId;
END$$
DELIMITER ;
