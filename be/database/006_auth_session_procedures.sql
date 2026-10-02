-- Procedures that participate in JWT session-version invalidation.
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_auth_finduserforlogin_1$$
CREATE PROCEDURE sp_auth_finduserforlogin_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id, full_name, email, phone, password_hash, avatar_url, role, status,
         auth_version, deleted_at, created_at, updated_at
  FROM users
  WHERE email = p_1
  LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_auth_findactiveuserbyid_1$$
CREATE PROCEDURE sp_auth_findactiveuserbyid_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT id, full_name, email, phone, avatar_url, role, status, auth_version,
         last_login_at, created_at, updated_at
  FROM users
  WHERE id = p_1 AND status = 'ACTIVE' AND deleted_at IS NULL
  LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_auth_findusablerefreshtokenforupdate_1$$
CREATE PROCEDURE sp_auth_findusablerefreshtokenforupdate_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  SELECT rt.id, rt.user_id, u.role, u.auth_version
  FROM refresh_tokens rt
  INNER JOIN users u ON u.id = rt.user_id
  WHERE rt.token_hash = p_1
    AND rt.revoked_at IS NULL
    AND rt.expires_at > CURRENT_TIMESTAMP
    AND u.status = 'ACTIVE'
    AND u.deleted_at IS NULL
  LIMIT 1
  FOR UPDATE;
END$$

DROP PROCEDURE IF EXISTS sp_auth_revokeallrefreshtokens_1$$
CREATE PROCEDURE sp_auth_revokeallrefreshtokens_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE users
  SET auth_version = auth_version + 1
  WHERE id = p_1 AND deleted_at IS NULL;

  UPDATE refresh_tokens
  SET revoked_at = CURRENT_TIMESTAMP
  WHERE user_id = p_1 AND revoked_at IS NULL;

  SELECT ROW_COUNT() AS affectedRows, 0 AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_user_revokeusertokens_1$$
CREATE PROCEDURE sp_user_revokeusertokens_1(IN p_1 LONGTEXT)
SQL SECURITY INVOKER
BEGIN
  UPDATE users
  SET auth_version = auth_version + 1
  WHERE id = p_1 AND deleted_at IS NULL;

  UPDATE refresh_tokens
  SET revoked_at = CURRENT_TIMESTAMP
  WHERE user_id = p_1 AND revoked_at IS NULL;

  SELECT ROW_COUNT() AS affectedRows, 0 AS insertId;
END$$

DELIMITER ;
