import { get, run } from '../db/db.js';

const createSession = async ({ userId, tokenHash }) => {
  await run(
    `
      INSERT INTO sessions (userId, tokenHash)
      VALUES (?, ?)
    `,
    [userId, tokenHash]
  );
};

const getSessionByTokenHash = (tokenHash) =>
  get(
    `
      SELECT sessions.userId, users.name, users.email, users.authProvider, users.avatarUrl
      FROM sessions
      INNER JOIN users ON users.id = sessions.userId
      WHERE sessions.tokenHash = ?
    `,
    [tokenHash]
  );

const deleteSessionByTokenHash = (tokenHash) =>
  run(
    `
      DELETE FROM sessions
      WHERE tokenHash = ?
    `,
    [tokenHash]
  );

export { createSession, deleteSessionByTokenHash, getSessionByTokenHash };
