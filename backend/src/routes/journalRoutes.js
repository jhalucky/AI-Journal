import { Router } from 'express';
import {
  analyzeJournal,
  getInsights,
  listJournals,
  postJournal
} from '../controllers/journalController.js';

const router = Router();

router.post('/', postJournal);
router.post('/analyze', analyzeJournal);
router.get('/insights/:userId', getInsights);
router.get('/:userId', listJournals);

export default router;
