import { useEffect, useState } from 'react';
import { request, setToken } from '../api.js';

function AuthCallback() {
  const [message, setMessage] = useState('Completing Google sign-in...');
  const [error, setError] = useState('');

  useEffect(() => {
    const completeAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const oauthError = params.get('error');

      if (oauthError) {
        setError(oauthError);
        return;
      }

      if (!token) {
        setError('Google sign-in did not return a token.');
        return;
      }

      try {
        setToken(token);
        await request('/auth/me');
        setMessage('Google sign-in complete. Redirecting...');
        window.setTimeout(() => {
          window.location.replace('/');
        }, 800);
      } catch (requestError) {
        setError(requestError.message);
      }
    };

    completeAuth();
  }, []);

  return (
    <main className="page-shell">
      <section className="panel panel-accent">
        <div className="panel-header">
          <p className="eyebrow">Google OAuth</p>
          <h2>Authentication callback</h2>
        </div>

        {error ? <div className="banner error">{error}</div> : <div className="banner success">{message}</div>}
      </section>
    </main>
  );
}

export default AuthCallback;
