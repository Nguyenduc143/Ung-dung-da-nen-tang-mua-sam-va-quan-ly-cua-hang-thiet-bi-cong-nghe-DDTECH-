-- Procedures for allowlisted dynamic repository statements.
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_dynamic_address_updateownedaddress_1$$
CREATE PROCEDURE sp_dynamic_address_updateownedaddress_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_catalog_list_1$$
CREATE PROCEDURE sp_dynamic_catalog_list_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_catalog_find_1$$
CREATE PROCEDURE sp_dynamic_catalog_find_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_catalog_save_1$$
CREATE PROCEDURE sp_dynamic_catalog_save_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_catalog_remove_1$$
CREATE PROCEDURE sp_dynamic_catalog_remove_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_catalog_lockrecord_1$$
CREATE PROCEDURE sp_dynamic_catalog_lockrecord_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_dashboard_getrevenue_1$$
CREATE PROCEDURE sp_dynamic_dashboard_getrevenue_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_inventory_listinventory_1$$
CREATE PROCEDURE sp_dynamic_inventory_listinventory_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_inventory_listinventory_2$$
CREATE PROCEDURE sp_dynamic_inventory_listinventory_2(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_inventory_listinventory_3$$
CREATE PROCEDURE sp_dynamic_inventory_listinventory_3(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_inventory_listtransactions_1$$
CREATE PROCEDURE sp_dynamic_inventory_listtransactions_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_inventory_listtransactions_2$$
CREATE PROCEDURE sp_dynamic_inventory_listtransactions_2(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_notification_listnotifications_1$$
CREATE PROCEDURE sp_dynamic_notification_listnotifications_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_notification_listnotifications_2$$
CREATE PROCEDURE sp_dynamic_notification_listnotifications_2(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_notification_findownednotification_1$$
CREATE PROCEDURE sp_dynamic_notification_findownednotification_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_order_listorders_1$$
CREATE PROCEDURE sp_dynamic_order_listorders_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_order_listorders_2$$
CREATE PROCEDURE sp_dynamic_order_listorders_2(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_order_findorder_1$$
CREATE PROCEDURE sp_dynamic_order_findorder_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_order_findorderforupdate_1$$
CREATE PROCEDURE sp_dynamic_order_findorderforupdate_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_order_updateorderstatus_1$$
CREATE PROCEDURE sp_dynamic_order_updateorderstatus_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_payment_findpayment_1$$
CREATE PROCEDURE sp_dynamic_payment_findpayment_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_payment_updatepaymentstatus_1$$
CREATE PROCEDURE sp_dynamic_payment_updatepaymentstatus_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_product_listpublicproducts_1$$
CREATE PROCEDURE sp_dynamic_product_listpublicproducts_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_product_listpublicproducts_2$$
CREATE PROCEDURE sp_dynamic_product_listpublicproducts_2(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_product_findproduct_1$$
CREATE PROCEDURE sp_dynamic_product_findproduct_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_product_saveproduct_1$$
CREATE PROCEDURE sp_dynamic_product_saveproduct_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_product_listvariants_1$$
CREATE PROCEDURE sp_dynamic_product_listvariants_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_product_savevariant_1$$
CREATE PROCEDURE sp_dynamic_product_savevariant_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_product_savevariant_2$$
CREATE PROCEDURE sp_dynamic_product_savevariant_2(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_promotion_findbyid_1$$
CREATE PROCEDURE sp_dynamic_promotion_findbyid_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_promotion_findbycode_1$$
CREATE PROCEDURE sp_dynamic_promotion_findbycode_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_promotion_savepromotion_1$$
CREATE PROCEDURE sp_dynamic_promotion_savepromotion_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_promotion_savepromotion_2$$
CREATE PROCEDURE sp_dynamic_promotion_savepromotion_2(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_review_listproductreviews_1$$
CREATE PROCEDURE sp_dynamic_review_listproductreviews_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_review_listproductreviews_2$$
CREATE PROCEDURE sp_dynamic_review_listproductreviews_2(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_review_listadminreviews_1$$
CREATE PROCEDURE sp_dynamic_review_listadminreviews_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_review_listadminreviews_2$$
CREATE PROCEDURE sp_dynamic_review_listadminreviews_2(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_review_findreview_1$$
CREATE PROCEDURE sp_dynamic_review_findreview_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_review_updatereview_1$$
CREATE PROCEDURE sp_dynamic_review_updatereview_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_user_updateprofile_1$$
CREATE PROCEDURE sp_dynamic_user_updateprofile_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_user_listusers_1$$
CREATE PROCEDURE sp_dynamic_user_listusers_1(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_dynamic_user_listusers_2$$
CREATE PROCEDURE sp_dynamic_user_listusers_2(IN p_sql LONGTEXT, IN p_values JSON)
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\*|\\*/' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unsafe SQL statement';
  END IF;
  SET v_sql = p_sql;
  SET v_count = COALESCE(JSON_LENGTH(p_values), 0);
  WHILE v_index < v_count DO
    SET v_position = LOCATE('?', v_sql);
    IF v_position = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Too many parameters'; END IF;
    SET v_value = JSON_EXTRACT(p_values, CONCAT('$[', v_index, ']'));
    SET v_type = JSON_TYPE(v_value);
    CASE v_type
      WHEN 'NULL' THEN SET v_literal = 'NULL';
      WHEN 'INTEGER' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DOUBLE' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'DECIMAL' THEN SET v_literal = JSON_UNQUOTE(v_value);
      WHEN 'BOOLEAN' THEN SET v_literal = IF(JSON_UNQUOTE(v_value) = 'true', '1', '0');
      ELSE SET v_literal = QUOTE(JSON_UNQUOTE(v_value));
    END CASE;
    SET v_sql = INSERT(v_sql, v_position, 1, v_literal);
    SET v_index = v_index + 1;
  END WHILE;
  IF LOCATE('?', v_sql) > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing parameter'; END IF;
  SET @ddtech_dynamic_sql = v_sql;
  PREPARE ddtech_statement FROM @ddtech_dynamic_sql;
  EXECUTE ddtech_statement;
  DEALLOCATE PREPARE ddtech_statement;
  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;
END$$

DELIMITER ;
