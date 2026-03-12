function JournalList({ entries }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <p className="eyebrow">History</p>
        <h2>Previous entries</h2>
      </div>

      {entries.length === 0 ? (
        <p className="empty-state">No journal entries yet.</p>
      ) : (
        <div className="stack">
          {entries.map((entry) => (
            <article key={entry.id} className="entry-card">
              <div className="entry-meta">
                <span>{entry.ambience}</span>
                <span>{new Date(entry.createdAt).toLocaleString()}</span>
              </div>
              <p>{entry.text}</p>
              <div className="tag-row">
                <span className="tag">Emotion: {entry.emotion ?? 'n/a'}</span>
                {(entry.keywords ?? []).map((keyword) => (
                  <span key={keyword} className="tag muted">{keyword}</span>
                ))}
              </div>
              <small>{entry.summary}</small>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default JournalList;
