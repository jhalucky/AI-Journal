import { getJournalsByUserId } from '../models/journalModel.js';

const countBy = (items, selector) =>
  items.reduce((accumulator, item) => {
    const key = selector(item);
    if (!key) {
      return accumulator;
    }

    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});

const topKey = (record) =>
  Object.entries(record).sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;

const buildInsights = async (userId) => {
  const journals = await getJournalsByUserId(userId);
  const recentKeywords = [...new Set(
    journals
      .slice(0, 5)
      .flatMap((journal) => journal.keywords ?? [])
  )].slice(0, 5);

  return {
    totalEntries: journals.length,
    topEmotion: topKey(countBy(journals, (journal) => journal.emotion)),
    mostUsedAmbience: topKey(countBy(journals, (journal) => journal.ambience)),
    recentKeywords
  };
};

export { buildInsights };
