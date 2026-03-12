# AI Journal System

## Overview
AI Journal System is a fullstack journaling app for post-nature-session reflections. Users authenticate with Google OAuth, write journal entries, store them in SQLite, analyze emotional tone with a real LLM provider, and review summary insights across their own past entries.

## Tech Stack
- Backend: Node.js, Express, SQLite
- Frontend: React with Vite
- Auth: Google OAuth plus app session tokens stored server-side in SQLite
- LLM: Gemini, Groq, OpenAI, or local Ollama

## Where Data Is Stored
All application data is stored in the SQLite file `backend/journal.db`.

### `users` table
- `id`
- `name`
- `email`
- `passwordHash`
- `passwordSalt`
- `googleId`
- `authProvider`
- `avatarUrl`
- `createdAt`

### `sessions` table
- `id`
- `userId`
- `tokenHash`
- `createdAt`

### `journals` table
- `id`
- `userId`
- `ambience`
- `text`
- `emotion`
- `keywords`
- `summary`
- `createdAt`

## Setup
### Backend
```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

### Frontend
```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

## Google OAuth Setup
Create OAuth credentials in Google Cloud Console and add this Authorized Redirect URI:
- `http://localhost:4000/api/auth/google/callback`

Set these backend variables:
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:4000/api/auth/google/callback
FRONTEND_OAUTH_SUCCESS_URL=http://localhost:5173/auth/callback
FRONTEND_OAUTH_ERROR_URL=http://localhost:5173/auth/callback
```

## Environment Variables
### Backend
- `PORT`: Express server port. Default is `4000`.
- `GOOGLE_CLIENT_ID`: Google OAuth client ID.
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret.
- `GOOGLE_REDIRECT_URI`: Backend Google callback URL.
- `FRONTEND_OAUTH_SUCCESS_URL`: Frontend route to receive successful OAuth login.
- `FRONTEND_OAUTH_ERROR_URL`: Frontend route to receive OAuth errors.
- `LLM_PROVIDER`: Optional explicit provider choice: `gemini`, `groq`, `openai`, or `ollama`.
- `GEMINI_API_KEY`: Google Gemini API key.
- `GEMINI_MODEL`: Optional Gemini model override.
- `OPENAI_API_KEY`: OpenAI API key.
- `OPENAI_MODEL`: Optional OpenAI model override.
- `OPENAI_BASE_URL`: Optional OpenAI-compatible base URL.
- `GROQ_API_KEY`: Groq API key.
- `GROQ_MODEL`: Optional Groq model override.
- `GROQ_BASE_URL`: Optional Groq-compatible base URL.
- `OLLAMA_BASE_URL`: Local Ollama server URL.
- `OLLAMA_MODEL`: Local Ollama model name.

### Frontend
- `VITE_API_BASE_URL`: Base URL for the backend API. Default is `http://localhost:4000/api`.

## Rate Limiting
There are two rate limiters:
- Global API limiter on `/api`: 100 requests per 15 minutes
- Auth-specific limiter on `/api/auth/*`: 20 authentication requests per 15 minutes

## API Documentation
### `GET /api/auth/google`
Start Google OAuth login.

### `GET /api/auth/google/callback`
Handle Google OAuth callback and redirect to the frontend with an app token.

### `GET /api/auth/me`
Return the currently authenticated user.

### `POST /api/auth/logout`
Invalidate the current session token.

### `POST /api/journal`
Create and store a journal entry for the authenticated user.

### `GET /api/journal/:userId`
Return all stored journal entries for the authenticated user only.

### `POST /api/journal/analyze`
Analyze freeform journal text without storing it.

### `GET /api/journal/insights/:userId`
Return aggregate insights for the authenticated user only.

## Notes
- SQLite database file is created at `backend/journal.db` after the backend starts.
- The app expects the backend on port `4000` unless `VITE_API_BASE_URL` is changed.
- This session could not run `npm install` or start the dev servers, so final runtime verification still needs to be executed locally.
