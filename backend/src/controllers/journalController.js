import { createJournal, getJournalsByUserId } from '../models/journalModel.js';
import { buildInsights } from '../services/insightsService.js';
import { analyzeJournalText } from '../services/llmService.js';

const assertRequired = (value, fieldName) => {
  if (!value || !String(value).trim()) {
    const error = new Error(`${fieldName} is required`);
    error.status = 400;
    throw error;
  }
};

const assertAuthorizedUser = (request) => {
  if (request.params.userId && String(request.params.userId) !== String(request.user.id)) {
    const error = new Error('Forbidden: you can only access your own journals');
    error.status = 403;
    throw error;
  }
};

const postJournal = async (request, response, next) => {
  try {
    const { ambience, text } = request.body;

    assertRequired(ambience, 'ambience');
    assertRequired(text, 'text');

    const analysis = await analyzeJournalText(String(text).trim());
    const journal = await createJournal({
      userId: String(request.user.id),
      ambience: String(ambience).trim(),
      text: String(text).trim(),
      emotion: analysis.emotion,
      keywords: analysis.keywords,
      summary: analysis.summary
    });

    response.status(201).json({
      ...journal,
      provider: analysis.provider,
      cached: analysis.cached
    });
  } catch (error) {
    next(error);
  }
};

const listJournals = async (request, response, next) => {
  try {
    assertAuthorizedUser(request);
    const journals = await getJournalsByUserId(String(request.user.id));
    response.json(journals);
  } catch (error) {
    next(error);
  }
};

const analyzeJournal = async (request, response, next) => {
  try {
    const { text } = request.body;
    assertRequired(text, 'text');

    const analysis = await analyzeJournalText(String(text).trim());
    response.json(analysis);
  } catch (error) {
    next(error);
  }
};

const getInsights = async (request, response, next) => {
  try {
    assertAuthorizedUser(request);
    const insights = await buildInsights(String(request.user.id));
    response.json(insights);
  } catch (error) {
    next(error);
  }
};

export { analyzeJournal, getInsights, listJournals, postJournal };
