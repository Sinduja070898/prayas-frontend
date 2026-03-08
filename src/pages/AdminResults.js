import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { apiAssessmentsList, apiAssessmentsExport } from '../api/client';
import { getAssessmentResults } from '../utils/mockStore';
import '../styles/AdminResults.css';

function downloadCsv(results) {
  const headers = ['#', 'Candidate Name', 'Candidate ID', 'Score', 'Total', 'Submitted At'];
  const rows = results.map((r, i) => [
    i + 1,
    r.candidateName || '—',
    r.candidateId || '—',
    r.score,
    r.total,
    r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '—',
  ]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `assessment-results-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function formatTimeTaken(seconds) {
  if (seconds == null || seconds === undefined) return '—';
  const m = Math.floor(Number(seconds) / 60);
  const s = Math.round(Number(seconds) % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function AdminResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromApi, setFromApi] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiAssessmentsList();
        if (!cancelled) {
          setResults(res.assessments || []);
          setFromApi(true);
        }
      } catch (_) {
        if (!cancelled) {
          setResults(getAssessmentResults());
          setFromApi(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const completed = results.length;
  const totalQuestions = results[0]?.total || 20;
  const avgScoreSum = completed ? results.reduce((s, r) => s + r.score, 0) / completed : 0;
  const topResult = completed ? results.reduce((best, r) => (r.score > (best?.score ?? 0) ? r : best), results[0]) : null;
  const sorted = [...results].sort((a, b) => (b.total ? b.score / b.total : 0) - (a.total ? a.score / a.total : 0));

  const handleDownloadCsv = async () => {
    try {
      const blob = await apiAssessmentsExport();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `results-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (_) {
      downloadCsv(results);
    }
  };

  return (
    <AdminLayout activeStep={4} title="Results & Export" subtitle="Assessment scores, rankings, CSV download.">
      <div className="admin-results-page">
        <div className="admin-url-bar">
          <div className="admin-url-dots"><span className="red" /><span className="yellow" /><span className="green" /></div>
          <span>prayas.in/admin/results</span>
        </div>
        {loading && <p className="admin-loading">Loading…</p>}
        <div className="results-summary-cards">
          <div className="results-card results-completed">
            <span className="results-value">{completed}</span>
            <span className="results-label">ASSESSMENTS COMPLETED</span>
          </div>
          <div className="results-card results-avg">
            <span className="results-value">{completed ? `${avgScoreSum.toFixed(1)}/${totalQuestions}` : '—'}</span>
            <span className="results-label">AVERAGE SCORE</span>
          </div>
          <div className="results-card results-top">
            <span className="results-value">{topResult ? `${topResult.score}/${topResult.total}` : '—'}</span>
            <span className="results-label">TOP SCORE</span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-download-csv"
          onClick={handleDownloadCsv}
          disabled={results.length === 0}
        >
          ↓ Download CSV
        </button>
        <div className="leaderboard-card card">
          <h3 className="leaderboard-title">Leaderboard</h3>
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>CANDIDATE</th>
                <th>SCORE</th>
                <th>TIME</th>
                <th>SUBMITTED</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <p className="leaderboard-empty">No assessment results yet.</p>
                    {fromApi && (
                      <p className="leaderboard-empty-hint">Results are in-memory; they clear on server restart.</p>
                    )}
                  </td>
                </tr>
              ) : (
                sorted.map((r, i) => {
                  const pct = r.total ? (r.score / r.total) * 100 : 0;
                  const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                  return (
                    <tr key={r.id}>
                      <td>{medal || i + 1}</td>
                      <td>{r.candidateName || '—'}</td>
                      <td>
                        <div className="score-bar-wrap">
                          <div className="score-bar" style={{ width: `${pct}%` }} data-tier={pct >= 80 ? 'high' : pct >= 50 ? 'mid' : 'low'} />
                          <span className="score-text">{r.score}/{r.total}</span>
                        </div>
                      </td>
                      <td>{formatTimeTaken(r.timeTakenSeconds)}</td>
                      <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <p className="leaderboard-note">* Auto-submitted on timer expiry</p>
        </div>
      </div>
    </AdminLayout>
  );
}
