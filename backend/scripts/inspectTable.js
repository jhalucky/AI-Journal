import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../journal.db');
const requestedTable = process.argv[2];
const allowedTables = new Set(['users', 'journals', 'sessions']);

if (!allowedTables.has(requestedTable)) {
  console.error('Usage: node scripts/inspectTable.js <users|journals|sessions>');
  process.exit(1);
}

const db = new sqlite3.Database(dbPath, (error) => {
  if (error) {
    console.error('Failed to open database:', error.message);
    process.exit(1);
  }
});

const query = `SELECT * FROM ${requestedTable} ORDER BY id DESC`;

db.all(query, [], (error, rows) => {
  if (error) {
    console.error(`Failed to read ${requestedTable}:`, error.message);
    db.close();
    process.exit(1);
  }

  console.log(`Database file: ${dbPath}`);
  console.log(`Table: ${requestedTable}`);
  console.log(`Rows: ${rows.length}`);

  if (rows.length === 0) {
    console.log('No rows found.');
  } else {
    console.table(rows);
  }

  db.close();
});
