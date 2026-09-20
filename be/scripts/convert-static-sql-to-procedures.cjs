const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const repositoryDirectory = path.join(root, 'src', 'repositories');
const writeChanges = process.argv.includes('--write');

function staticConstants(sourceFile) {
  const values = new Map();
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
      const value = evaluateString(declaration.initializer, values);
      if (value !== null) values.set(declaration.name.text, value);
    }
  }
  return values;
}

function evaluateString(node, constants) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isIdentifier(node)) return constants.get(node.text) ?? null;
  if (ts.isParenthesizedExpression(node)) return evaluateString(node.expression, constants);
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = evaluateString(node.left, constants);
    const right = evaluateString(node.right, constants);
    return left === null || right === null ? null : left + right;
  }
  if (ts.isTemplateExpression(node)) {
    let value = node.head.text;
    for (const span of node.templateSpans) {
      const expression = evaluateString(span.expression, constants);
      if (expression === null) return null;
      value += expression + span.literal.text;
    }
    return value;
  }
  return null;
}

function enclosingFunctionName(node) {
  let current = node;
  while (current) {
    if (ts.isFunctionDeclaration(current) && current.name) return current.name.text;
    if ((ts.isArrowFunction(current) || ts.isFunctionExpression(current)) && current.parent) {
      if (ts.isVariableDeclaration(current.parent) && ts.isIdentifier(current.parent.name)) {
        return current.parent.name.text;
      }
    }
    current = current.parent;
  }
  return 'query';
}

function procedureName(repository, functionName, sequence) {
  const base = `sp_${repository}_${functionName}_${sequence}`
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .toLowerCase();
  return base.length <= 64 ? base : `${base.slice(0, 55)}_${sequence}`;
}

function replaceParameters(sql, count) {
  const pieces = sql.split('?');
  if (pieces.length - 1 !== count) return null;
  let output = pieces[0];
  const parameterTypes = [];
  for (let index = 0; index < count; index += 1) {
    const before = pieces[index].slice(-30);
    const isLimit = /(?:LIMIT|OFFSET)\s*$/i.test(before);
    parameterTypes.push(isLimit ? 'BIGINT UNSIGNED' : 'LONGTEXT');
    output += `p_${index + 1}${pieces[index + 1]}`;
  }
  return { sql: output, parameterTypes };
}

const files = fs.readdirSync(repositoryDirectory)
  .filter((name) => name.endsWith('.repository.ts'))
  .sort();
const procedures = [];
let converted = 0;
let skipped = 0;

for (const fileName of files) {
  const filePath = path.join(repositoryDirectory, fileName);
  let source = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
  const constants = staticConstants(sourceFile);
  const repository = fileName.replace('.repository.ts', '');
  const sequences = new Map();
  const replacements = [];

  function visit(node) {
    if (ts.isCallExpression(node)
      && ts.isPropertyAccessExpression(node.expression)
      && node.expression.name.text === 'execute'
      && node.arguments.length > 0) {
      const sql = evaluateString(node.arguments[0], constants);
      if (sql === null) {
        skipped += 1;
      } else {
        const functionName = enclosingFunctionName(node);
        const sequence = (sequences.get(functionName) ?? 0) + 1;
        sequences.set(functionName, sequence);
        const name = procedureName(repository, functionName, sequence);
        const valuesText = node.arguments[1]
          ? node.arguments[1].getText(sourceFile)
          : '[]';
        const placeholderCount = sql.split('?').length - 1;
        const replaced = replaceParameters(sql, placeholderCount);
        if (!replaced) {
          skipped += 1;
        } else {
          const typeArguments = node.typeArguments?.length
            ? `<${node.typeArguments.map((item) => item.getText(sourceFile)).join(', ')}>`
            : '';
          const executor = node.expression.expression.getText(sourceFile);
          replacements.push({
            start: node.getStart(sourceFile),
            end: node.getEnd(),
            text: `executeProcedure${typeArguments}(${executor}, '${name}', ${valuesText})`,
          });
          procedures.push({
            name,
            sql: replaced.sql.trim(),
            parameterTypes: replaced.parameterTypes,
            read: /^SELECT\b/i.test(sql.trim()),
          });
          converted += 1;
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);

  if (replacements.length > 0 && writeChanges) {
    replacements.sort((a, b) => b.start - a.start);
    for (const replacement of replacements) {
      source = source.slice(0, replacement.start) + replacement.text + source.slice(replacement.end);
    }
    source = source.replace(
      /import \{ pool \} from '\.\.\/config\/database';/,
      "import { executeProcedure, pool } from '../config/database';",
    );
    fs.writeFileSync(filePath, source);
  }
}

if (writeChanges) {
  const lines = [
    '-- Generated from static repository statements. Dynamic queries are migrated separately.',
    'DELIMITER $$',
    '',
  ];
  for (const procedure of procedures) {
    const parameters = procedure.parameterTypes
      .map((type, index) => `IN p_${index + 1} ${type}`)
      .join(', ');
    lines.push(`DROP PROCEDURE IF EXISTS ${procedure.name}$$`);
    lines.push(`CREATE PROCEDURE ${procedure.name}(${parameters})`);
    lines.push('SQL SECURITY INVOKER');
    lines.push('BEGIN');
    lines.push(`  ${procedure.sql};`);
    if (!procedure.read) {
      lines.push('  SELECT ROW_COUNT() AS affectedRows, LAST_INSERT_ID() AS insertId;');
    }
    lines.push('END$$', '');
  }
  lines.push('DELIMITER ;', '');
  fs.mkdirSync(path.join(root, 'database'), { recursive: true });
  fs.writeFileSync(path.join(root, 'database', '001_static_repository_procedures.sql'), lines.join('\n'));
}

console.log(JSON.stringify({ converted, skipped, procedures: procedures.length, writeChanges }));
