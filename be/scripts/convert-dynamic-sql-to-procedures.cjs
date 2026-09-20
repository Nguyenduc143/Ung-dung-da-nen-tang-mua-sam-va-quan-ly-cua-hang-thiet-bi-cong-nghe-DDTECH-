const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const directory = path.join(root, 'src', 'repositories');
const procedures = [];
let converted = 0;

for (const fileName of fs.readdirSync(directory).filter((name) => name.endsWith('.repository.ts')).sort()) {
  const filePath = path.join(directory, fileName);
  let source = fs.readFileSync(filePath, 'utf8');
  const ast = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
  const replacements = [];
  const counts = new Map();
  const repository = fileName.replace('.repository.ts', '');

  function functionName(node) {
    let current = node;
    while (current) {
      if (ts.isFunctionDeclaration(current) && current.name) return current.name.text;
      if ((ts.isArrowFunction(current) || ts.isFunctionExpression(current))
          && ts.isVariableDeclaration(current.parent)
          && ts.isIdentifier(current.parent.name)) return current.parent.name.text;
      current = current.parent;
    }
    return 'query';
  }

  function visit(node) {
    if (ts.isCallExpression(node)
        && ts.isPropertyAccessExpression(node.expression)
        && node.expression.name.text === 'execute') {
      const fn = functionName(node);
      const sequence = (counts.get(fn) ?? 0) + 1;
      counts.set(fn, sequence);
      let name = `sp_dynamic_${repository}_${fn}_${sequence}`.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      if (name.length > 64) name = `${name.slice(0, 55)}_${sequence}`;
      const type = node.typeArguments?.length
        ? `<${node.typeArguments.map((item) => item.getText(ast)).join(', ')}>` : '';
      const executor = node.expression.expression.getText(ast);
      const sql = node.arguments[0].getText(ast);
      const values = node.arguments[1]?.getText(ast) ?? '[]';
      replacements.push({
        start: node.getStart(ast), end: node.getEnd(),
        text: `executeDynamicProcedure${type}(${executor}, '${name}', ${sql}, ${values})`,
      });
      procedures.push(name);
      converted += 1;
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);

  replacements.sort((a, b) => b.start - a.start);
  for (const item of replacements) source = source.slice(0, item.start) + item.text + source.slice(item.end);
  if (replacements.length) {
    source = source.replace(
      /import \{ executeProcedure, pool \} from '\.\.\/config\/database';/,
      "import { executeDynamicProcedure, executeProcedure, pool } from '../config/database';",
    );
    fs.writeFileSync(filePath, source);
  }
}

const body = `
SQL SECURITY INVOKER
BEGIN
  DECLARE v_sql LONGTEXT;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_position INT;
  DECLARE v_value JSON;
  DECLARE v_type VARCHAR(16);
  DECLARE v_literal LONGTEXT;
  IF p_sql IS NULL OR p_sql REGEXP ';|--|#|/\\\\*|\\\\*/' THEN
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
END$$`;

const lines = ['-- Procedures for allowlisted dynamic repository statements.', 'DELIMITER $$', ''];
for (const name of procedures) {
  lines.push(`DROP PROCEDURE IF EXISTS ${name}$$`);
  lines.push(`CREATE PROCEDURE ${name}(IN p_sql LONGTEXT, IN p_values JSON)${body}`, '');
}
lines.push('DELIMITER ;', '');
fs.writeFileSync(path.join(root, 'database', '002_dynamic_repository_procedures.sql'), lines.join('\n'));
console.log(JSON.stringify({ converted, procedures: procedures.length }));
