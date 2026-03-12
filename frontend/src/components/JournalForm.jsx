function JournalForm({
  currentUser,
  form,
  onChange,
  onSubmit,
  onAnalyze,
  onLogout,
  loading,
  analyzeLoading,
  logoutLoading
}) {
  return (
    <section className="panel panel-accent">
      <div className="panel-header row-between">
        <div>
          <p className="eyebrow">New Reflection</p>
          <h2>Capture the session while it still feels vivid.</h2>
        </div>
        <div className="user-chip">
          <span>{currentUser.name}</span>
          <small>{currentUser.email}</small>
        </div>
      </div>

      <div className="grid-two">
        <label>
          Signed in user
          <input value={`${currentUser.name} (#${currentUser.id})`} disabled />
        </label>

        <label>
          Ambience
          <input
            name="ambience"
            value={form.ambience}
            onChange={onChange}
            placeholder="forest"
          />
        </label>
      </div>

      <label>
        Journal Entry
        <textarea
          name="text"
          rows="7"
          value={form.text}
          onChange={onChange}
          placeholder="I felt calm today after listening to the rain..."
        />
      </label>

      <div className="actions wrap">
        <button onClick={onSubmit} disabled={loading}>
          {loading ? 'Saving...' : 'Submit Entry'}
        </button>
        <button className="secondary" onClick={onAnalyze} disabled={analyzeLoading}>
          {analyzeLoading ? 'Analyzing...' : 'Analyze Only'}
        </button>
        <button className="secondary" onClick={onLogout} disabled={logoutLoading}>
          {logoutLoading ? 'Signing out...' : 'Logout'}
        </button>
      </div>
    </section>
  );
}

export default JournalForm;
