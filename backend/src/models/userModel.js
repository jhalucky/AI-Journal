import { get, run } from '../db/db.js';

const createUser = async ({ name, email, passwordHash = null, passwordSalt = null, googleId = null, authProvider = 'local', avatarUrl = null }) => {
  const result = await run(
    `
      INSERT INTO users (name, email, passwordHash, passwordSalt, googleId, authProvider, avatarUrl)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [name, email, passwordHash, passwordSalt, googleId, authProvider, avatarUrl]
  );

  return {
    id: result.id,
    name,
    email,
    googleId,
    authProvider,
    avatarUrl
  };
};

const getUserByEmail = (email) =>
  get(
    `
      SELECT id, name, email, passwordHash, passwordSalt, googleId, authProvider, avatarUrl, createdAt
      FROM users
      WHERE email = ?
    `,
    [email]
  );

const getUserByGoogleId = (googleId) =>
  get(
    `
      SELECT id, name, email, passwordHash, passwordSalt, googleId, authProvider, avatarUrl, createdAt
      FROM users
      WHERE googleId = ?
    `,
    [googleId]
  );

const getUserById = (id) =>
  get(
    `
      SELECT id, name, email, googleId, authProvider, avatarUrl, createdAt
      FROM users
      WHERE id = ?
    `,
    [id]
  );

const updateUserGoogleProfile = async ({ id, googleId, name, avatarUrl }) => {
  await run(
    `
      UPDATE users
      SET googleId = ?, authProvider = 'google', name = ?, avatarUrl = ?
      WHERE id = ?
    `,
    [googleId, name, avatarUrl, id]
  );

  return getUserById(id);
};

export { createUser, getUserByEmail, getUserByGoogleId, getUserById, updateUserGoogleProfile };
