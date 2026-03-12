import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { initializeDatabase } from './db/db.js';
import { requireAuth } from './middleware/authMiddleware.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/authRoutes.js';
import journalRoutes from './routes/journalRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/api', apiRateLimiter);

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/journal', requireAuth, journalRoutes);

app.use((error, _request, response, _next) => {
  const status = error.status ?? 500;
  response.status(status).json({
    message: error.message ?? 'Internal server error'
  });
});

initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Backend server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize the database:', error);
    process.exit(1);
  });
