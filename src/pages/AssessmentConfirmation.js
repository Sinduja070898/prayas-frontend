import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CandidateLayout from '../components/CandidateLayout';
import { apiAssessmentsMe } from '../api/client';
import { getResultByCandidateId } from '../utils/mockStore';
import '../styles/AssessmentConfirmation.css';

function formatDuration(seconds) {
  if (seconds == null || seconds < 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m} min ${s} sec`;
}

function formatSubmittedAt(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' });
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${date} • ${time}`;
}

export default function AssessmentConfirmation() {
  const { user } = useAuth();
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiAssessmentsMe();
        if (!cancelled) setResult(res);
      } catch (_) {
        if (!cancelled && user?.role === 'candidate') setResult(getResultByCandidateId(user.id) || null);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, user?.role]);

  const answered = result ? (result.answers || []).filter((a) => a !== null && a !== undefined).length : 0;
  const total = result?.total ?? 0;
  const timeTaken = result?.timeTakenSeconds;
  const submittedAt = result?.submittedAt;

  return (
    <CandidateLayout activeStep={5} title="Confirmation Screen" subtitle="Post-submission feedback.">
      <div className="confirmation-page">
        <div className="candidate-url-bar">
          <div className="candidate-url-dots"><span className="red" /><span className="yellow" /><span className="green" /></div>
          <span>prayas.in/assessment/complete</span>
        </div>
        <div className="confirmation-card card">
          <div className="confirmation-icon">🎉</div>
          <h2 className="confirmation-heading">Assessment Submitted!</h2>
          <p className="confirmation-message">
            Your responses have been recorded. The admin team will review results and update you shortly.
          </p>
          <div className="confirmation-stats">
            <div className="confirmation-stat-main">
              {answered}/{total} Questions Answered
            </div>
            <dl className="confirmation-details">
              <div>
                <dt>Time Taken</dt>
                <dd>{formatDuration(timeTaken)}</dd>
              </div>
              <div>
                <dt>Submitted At</dt>
                <dd>{formatSubmittedAt(submittedAt)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd><span className="confirmation-status-dot">•</span> Submitted</dd>
              </div>
            </dl>
          </div>
          <Link to="/dashboard" className="btn btn-return-dashboard">Return to Dashboard</Link>
        </div>
      </div>
    </CandidateLayout>
  );
}
