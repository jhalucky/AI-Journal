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

const assertAuthorizedUserId = (candidateUserId, request) => {
  if (String(candidateUserId) !== String(request.user.id)) {
    const error = new Error('Forbidden: you can only access your own journals');
    error.status = 403;
    throw error;
  }
};

const postJournal = async (request, response, next) => {
  try {
    const { userId, ambience, text } = request.body;

    assertRequired(userId, 'userId');
    assertRequired(ambience, 'ambience');
    assertRequired(text, 'text');
    assertAuthorizedUserId(String(userId).trim(), request);

    const analysis = await analyzeJournalText(String(text).trim());
    const journal = await createJournal({
      userId: String(userId).trim(),
      ambience: String(ambience).trim(),
      text: String(text).trim(),
      emotion: analysis.emotion,
      keywords: analysis.keywords,
      summary: analysis.summary
    });

    response.status(201).json(journal);
  } catch (error) {
    next(error);
  }
};

const listJournals = async (request, response, next) => {
  try {
    assertAuthorizedUserId(request.params.userId, request);
    const journals = await getJournalsByUserId(String(request.params.userId));
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
    response.json({
      emotion: analysis.emotion,
      keywords: analysis.keywords,
      summary: analysis.summary
    });
  } catch (error) {
    next(error);
  }
};

const getInsights = async (request, response, next) => {
  try {
    assertAuthorizedUserId(request.params.userId, request);
    const insights = await buildInsights(String(request.params.userId));
    response.json(insights);
  } catch (error) {
    next(error);
  }
};

export { analyzeJournal, getInsights, listJournals, postJournal };
