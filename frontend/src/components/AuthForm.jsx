function AuthForm({ onGoogleLogin, loading }) {
  return (
    <section className="panel panel-accent">
      <div className="panel-header">
        <p className="eyebrow">Authentication</p>
        <h2>Sign in to your journal with Google</h2>
      </div>

      <p className="empty-state">
        This app now uses Google OAuth only. After Google verifies the user, the backend creates the app session and stores it in SQLite.
      </p>

      <button className="google-button" onClick={onGoogleLogin} disabled={loading}>
        <span className="google-button-content">
          <svg
            className="google-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path fill="#4285F4" d="M21.6 12.23c0-.68-.06-1.33-.17-1.95H12v3.69h5.39a4.62 4.62 0 0 1-2 3.03v2.52h3.24c1.9-1.75 2.97-4.34 2.97-7.29Z" />
            <path fill="#34A853" d="M12 22c2.7 0 4.96-.89 6.61-2.41l-3.24-2.52c-.89.6-2.03.96-3.37.96-2.6 0-4.8-1.76-5.58-4.12H3.08v2.6A9.98 9.98 0 0 0 12 22Z" />
            <path fill="#FBBC05" d="M6.42 13.91A5.98 5.98 0 0 1 6.1 12c0-.66.11-1.3.32-1.91V7.49H3.08A9.98 9.98 0 0 0 2 12c0 1.61.38 3.13 1.08 4.51l3.34-2.6Z" />
            <path fill="#EA4335" d="M12 5.97c1.47 0 2.8.51 3.85 1.52l2.89-2.89C16.95 2.94 14.69 2 12 2a9.98 9.98 0 0 0-8.92 5.49l3.34 2.6C7.2 7.73 9.4 5.97 12 5.97Z" />
          </svg>
          <span>{loading ? 'Redirecting...' : 'Continue with Google'}</span>
        </span>
      </button>
    </section>
  );
}

export default AuthForm;
