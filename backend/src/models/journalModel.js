import { all, run } from '../db/db.js';

const createJournal = async ({ userId, ambience, text, emotion, keywords, summary }) => {
  const serializedKeywords = JSON.stringify(keywords ?? []);

  const result = await run(
    `
      INSERT INTO journals (userId, ambience, text, emotion, keywords, summary)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [userId, ambience, text, emotion ?? null, serializedKeywords, summary ?? null]
  );

  return {
    id: result.id,
    userId,
    ambience,
    text,
    emotion: emotion ?? null,
    keywords: keywords ?? [],
    summary: summary ?? null
  };
};

const getJournalsByUserId = async (userId) => {
  const rows = await all(
    `
      SELECT id, userId, ambience, text, emotion, keywords, summary, createdAt
      FROM journals
      WHERE userId = ?
      ORDER BY datetime(createdAt) DESC, id DESC
    `,
    [userId]
  );

  return rows.map((row) => ({
    ...row,
    keywords: row.keywords ? JSON.parse(row.keywords) : []
  }));
};

export { createJournal, getJournalsByUserId };
