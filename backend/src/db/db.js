import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../journal.db');

sqlite3.verbose();

const db = new sqlite3.Database(dbPath, (error) => {
  if (error) {
    console.error('Failed to connect to SQLite database:', error.message);
  }
});

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({ id: this.lastID, changes: this.changes });
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row);
    });
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });

const ensureColumn = async (tableName, columnName, definition) => {
  const columns = await all(`PRAGMA table_info(${tableName})`);
  if (columns.some((column) => column.name === columnName)) {
    return;
  }

  await run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
};

const ensureIndex = async (indexName, tableName, columnName, options = '') => {
  await run(
    `CREATE ${options} INDEX IF NOT EXISTS ${indexName} ON ${tableName} (${columnName})`
  );
};

const buildUsersSelectExpression = (columns, columnName, fallbackExpression) =>
  columns.some((column) => column.name === columnName) ? columnName : fallbackExpression;

const rebuildUsersTableIfNeeded = async () => {
  const columns = await all('PRAGMA table_info(users)');
  const passwordHashColumn = columns.find((column) => column.name === 'passwordHash');
  const passwordSaltColumn = columns.find((column) => column.name === 'passwordSalt');
  const needsRebuild =
    passwordHashColumn?.notnull === 1 ||
    passwordSaltColumn?.notnull === 1;

  if (!needsRebuild) {
    return;
  }

  const selectName = buildUsersSelectExpression(columns, 'name', "''");
  const selectEmail = buildUsersSelectExpression(columns, 'email', "''");
  const selectPasswordHash = buildUsersSelectExpression(columns, 'passwordHash', 'NULL');
  const selectPasswordSalt = buildUsersSelectExpression(columns, 'passwordSalt', 'NULL');
  const selectGoogleId = buildUsersSelectExpression(columns, 'googleId', 'NULL');
  const selectAuthProvider = buildUsersSelectExpression(columns, 'authProvider', "'local'");
  const selectAvatarUrl = buildUsersSelectExpression(columns, 'avatarUrl', 'NULL');
  const selectCreatedAt = buildUsersSelectExpression(columns, 'createdAt', 'CURRENT_TIMESTAMP');

  await run('PRAGMA foreign_keys = OFF');
  await run(`
    CREATE TABLE users_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      passwordHash TEXT,
      passwordSalt TEXT,
      googleId TEXT,
      authProvider TEXT NOT NULL DEFAULT 'local',
      avatarUrl TEXT,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await run(`
    INSERT INTO users_new (id, name, email, passwordHash, passwordSalt, googleId, authProvider, avatarUrl, createdAt)
    SELECT
      id,
      ${selectName},
      ${selectEmail},
      ${selectPasswordHash},
      ${selectPasswordSalt},
      ${selectGoogleId},
      ${selectAuthProvider},
      ${selectAvatarUrl},
      ${selectCreatedAt}
    FROM users
  `);
  await run('DROP TABLE users');
  await run('ALTER TABLE users_new RENAME TO users');
  await run('PRAGMA foreign_keys = ON');
};

const initializeDatabase = async () => {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      passwordHash TEXT,
      passwordSalt TEXT,
      googleId TEXT UNIQUE,
      authProvider TEXT NOT NULL DEFAULT 'local',
      avatarUrl TEXT,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await rebuildUsersTableIfNeeded();
  await ensureColumn('users', 'googleId', 'TEXT');
  await ensureColumn('users', 'authProvider', "TEXT NOT NULL DEFAULT 'local'");
  await ensureColumn('users', 'avatarUrl', 'TEXT');
  await ensureIndex('idx_users_google_id_unique', 'users', 'googleId', 'UNIQUE');

  await run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      tokenHash TEXT NOT NULL UNIQUE,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS journals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      ambience TEXT NOT NULL,
      text TEXT NOT NULL,
      emotion TEXT,
      keywords TEXT,
      summary TEXT,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

export { all, dbPath, get, initializeDatabase, run };
