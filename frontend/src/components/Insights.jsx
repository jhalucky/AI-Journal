function Insights({ analysis, insights }) {
  const hasStoredEntries = Boolean(insights?.hasEntries);

  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="panel-header">
          <p className="eyebrow">Live Analysis</p>
          <h2>Emotion extraction</h2>
        </div>

        {!analysis ? (
          <p className="empty-state">Run Analyze to preview emotion, keywords, and summary.</p>
        ) : (
          <div className="stack">
            <div className="tag-row">
              <span className="tag">Emotion: {analysis.emotion}</span>
              <span className="tag">Provider: {analysis.provider ?? 'unknown'}</span>
              {(analysis.keywords ?? []).map((keyword) => (
                <span key={keyword} className="tag muted">{keyword}</span>
              ))}
            </div>
            <p>{analysis.summary}</p>
            <small>{analysis.cached ? 'Served from cache.' : 'Fresh analysis.'}</small>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <p className="eyebrow">User Insights</p>
          <h2>Patterns across entries</h2>
        </div>

        {!insights ? (
          <p className="empty-state">Load insights for a user to see trends.</p>
        ) : !hasStoredEntries ? (
          <div className="stack">
            <p className="empty-state">No saved journal entries yet.</p>
            <small>Analyze Only previews the LLM result but does not update insights. Use Submit Entry to store the journal in SQLite.</small>
          </div>
        ) : (
          <div className="metrics-grid">
            <div className="metric">
              <strong>{insights.totalEntries}</strong>
              <span>Total entries</span>
            </div>
            <div className="metric">
              <strong>{insights.topEmotion}</strong>
              <span>Top emotion</span>
            </div>
            <div className="metric">
              <strong>{insights.mostUsedAmbience}</strong>
              <span>Most used ambience</span>
            </div>
            <div className="metric metric-wide">
              <strong>{(insights.recentKeywords ?? []).join(', ')}</strong>
              <span>Recent keywords</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default Insights;
