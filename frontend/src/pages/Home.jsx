import { useEffect, useState } from 'react';
import { clearToken, getGoogleAuthUrl, getToken, request } from '../api.js';
import AuthForm from '../components/AuthForm.jsx';
import Insights from '../components/Insights.jsx';
import JournalForm from '../components/JournalForm.jsx';
import JournalList from '../components/JournalList.jsx';

const initialForm = {
  ambience: 'forest',
  text: 'I felt calm today after listening to the rain.'
};

function Home() {
  const [form, setForm] = useState(initialForm);
  const [currentUser, setCurrentUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const resetFeedback = () => {
    setError('');
    setMessage('');
  };

  const loadEntries = async (userId) => {
    const data = await request(`/journal/${userId}`);
    setEntries(data);
  };

  const loadInsights = async (userId) => {
    const data = await request(`/journal/insights/${userId}`);
    setInsights(data);
  };

  const bootstrapSession = async () => {
    if (!getToken()) {
      return;
    }

    try {
      const { user } = await request('/auth/me');
      setCurrentUser(user);
      await Promise.all([loadEntries(user.id), loadInsights(user.id)]);
    } catch (_error) {
      clearToken();
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    bootstrapSession();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleGoogleLogin = () => {
    setAuthLoading(true);
    resetFeedback();
    window.location.assign(getGoogleAuthUrl());
  };

  const handleSubmit = async () => {
    setLoading(true);
    resetFeedback();

    try {
      const created = await request('/journal', {
        method: 'POST',
        body: JSON.stringify({
          userId: String(currentUser.id),
          ...form
        })
      });

      setAnalysis({
        emotion: created.emotion,
        keywords: created.keywords,
        summary: created.summary
      });
      setMessage('Journal entry saved and insights have been updated.');
      await Promise.all([loadEntries(currentUser.id), loadInsights(currentUser.id)]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzeLoading(true);
    resetFeedback();

    try {
      const data = await request('/journal/analyze', {
        method: 'POST',
        body: JSON.stringify({ text: form.text })
      });

      setAnalysis(data);
      setMessage('Analysis complete. Submit Entry if you want this reflected in insights.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setAnalyzeLoading(false);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    resetFeedback();

    try {
      await request('/auth/logout', { method: 'POST' });
    } catch (_error) {
      // Ignore logout failures and clear local state regardless.
    } finally {
      clearToken();
      setCurrentUser(null);
      setEntries([]);
      setInsights(null);
      setAnalysis(null);
      setLogoutLoading(false);
      setMessage('Logged out.');
    }
  };

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">AI Assisted Journal System</p>
        <h1>Reflect after nature. Let the system map the emotional signal.</h1>
        <p className="hero-copy">
          Users, sessions, and journals are stored in SQLite. Authentication is Google OAuth only, protected by a dedicated auth rate limiter.
        </p>
      </section>

      {message ? <div className="banner success">{message}</div> : null}
      {error ? <div className="banner error">{error}</div> : null}

      {!currentUser ? (
        <AuthForm
          onGoogleLogin={handleGoogleLogin}
          loading={authLoading}
        />
      ) : (
        <div className="layout-grid">
          <div className="stack-lg">
            <JournalForm
              currentUser={currentUser}
              form={form}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onAnalyze={handleAnalyze}
              onLogout={handleLogout}
              loading={loading}
              analyzeLoading={analyzeLoading}
              logoutLoading={logoutLoading}
            />
            <JournalList entries={entries} />
          </div>

          <Insights analysis={analysis} insights={insights} />
        </div>
      )}
    </main>
  );
}

export default Home;
