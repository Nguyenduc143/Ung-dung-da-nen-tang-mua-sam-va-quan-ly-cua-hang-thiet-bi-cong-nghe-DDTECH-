const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

const root = path.resolve(__dirname, '..');

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
  });

  try {
    const migrationDirectory = path.join(root, 'database');
    const migrations = fs.readdirSync(migrationDirectory)
      .filter((name) => name.endsWith('.sql'))
      .sort();
    let statementCount = 0;

    for (const migration of migrations) {
      const source = fs.readFileSync(path.join(migrationDirectory, migration), 'utf8')
        .replace(/^DELIMITER .*$/gm, '');
      const statements = source.split('$$').map((item) => item.trim()).filter(Boolean);
      for (const statement of statements) {
        await connection.query(statement);
        statementCount += 1;
      }
    }

    const [rows] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM information_schema.ROUTINES
       WHERE ROUTINE_SCHEMA = DATABASE()
         AND ROUTINE_TYPE = 'PROCEDURE'
         AND ROUTINE_NAME LIKE 'sp\\_%'`,
    );
    console.log(`Applied ${statementCount} statements; ${rows[0].total} DDTECH procedures installed.`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
