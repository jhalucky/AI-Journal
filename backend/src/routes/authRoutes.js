import { Router } from 'express';
import { googleAuthCallback, googleAuthStart, logout, me } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/google', authRateLimiter, googleAuthStart);
router.get('/google/callback', authRateLimiter, googleAuthCallback);
router.get('/me', requireAuth, me);
router.post('/logout', requireAuth, logout);

export default router;
