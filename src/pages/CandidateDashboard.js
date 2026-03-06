import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CandidateLayout from '../components/CandidateLayout';
import { apiApplicationsMe, apiAssessmentsMe } from '../api/client';
import { getApplicationByCandidateId, hasAttemptedAssessment } from '../utils/mockStore';
import { APPLICATION_STATUS, PUNJABI_PROFICIENCY_OPTIONS } from '../utils/constants';
import '../styles/CandidateDashboard.css';

const JOURNEY_LABELS = ['Registered', 'Applied', 'Shortlisted', 'Assessment', 'Complete'];

function getJourneyProgress(status, attempted) {
  const s = status || APPLICATION_STATUS.REGISTERED;
  if (s === APPLICATION_STATUS.REGISTERED) return 1;
  if (s === APPLICATION_STATUS.APPLICATION_SUBMITTED) return 2;
  if (s === APPLICATION_STATUS.NOT_SHORTLISTED) return 2;
  if (s === APPLICATION_STATUS.SHORTLISTED || s === APPLICATION_STATUS.ASSESSMENT_PENDING) {
    return attempted ? 4 : 3;
  }
  if (s === APPLICATION_STATUS.ASSESSMENT_SUBMITTED || attempted) return 5;
  return 1;
}

function getDisplayStatus(status, attempted) {
  const s = status || APPLICATION_STATUS.REGISTERED;
  if (s === APPLICATION_STATUS.SHORTLISTED || s === APPLICATION_STATUS.ASSESSMENT_PENDING) {
    return attempted ? 'Assessment Submitted' : 'Shortlisted';
  }
  return s;
}

export default function CandidateDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const app = await apiApplicationsMe();
        if (!cancelled && app) setApplication(app);
      } catch (e) {
        if (cancelled) return;
        if (e?.status === 403) {
          logout();
          navigate('/login', { state: { message: 'Please sign in again as a candidate.' }, replace: true });
          return;
        }
        setApplication(getApplicationByCandidateId(user?.id) || null);
      }
      try {
        const res = await apiAssessmentsMe();
        if (!cancelled) setAttempted(!!res);
      } catch (e) {
        if (cancelled) return;
        if (e?.status === 403) {
          logout();
          navigate('/login', { state: { message: 'Please sign in again as a candidate.' }, replace: true });
          return;
        }
        setAttempted(hasAttemptedAssessment(user?.id));
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, logout, navigate]);

  const status = application?.status || APPLICATION_STATUS.REGISTERED;
  const canTakeAssessment = (status === APPLICATION_STATUS.SHORTLISTED || status === APPLICATION_STATUS.ASSESSMENT_PENDING) && !attempted;
  const progress = getJourneyProgress(status, attempted);
  const displayStatus = getDisplayStatus(status, attempted);
  const isShortlisted = [APPLICATION_STATUS.SHORTLISTED, APPLICATION_STATUS.ASSESSMENT_PENDING, APPLICATION_STATUS.ASSESSMENT_SUBMITTED].includes(status) || attempted;
  const formData = application?.formData || {};
  const punjabiLabel = formData.punjabiProficiency
    ? (PUNJABI_PROFICIENCY_OPTIONS.find((o) => o.value === formData.punjabiProficiency)?.label || formData.punjabiProficiency)
    : '—';
  const submittedAgo = application?.submittedAt
    ? (() => {
      const d = new Date(application.submittedAt);
      const days = Math.floor((Date.now() - d) / (24 * 60 * 60 * 1000));
      return days === 0 ? 'Today' : days === 1 ? '1 day ago' : `${days} days ago`;
    })()
    : null;

  return (
    <CandidateLayout activeStep={3} title="Candidate Dashboard" subtitle="Status tracker + action center.">
      <div className="candidate-dashboard">
        <div className="candidate-url-bar">
          <div className="candidate-url-dots"><span className="red" /><span className="yellow" /><span className="green" /></div>
          <span>prayas.in/dashboard</span>
        </div>
        <div className="dashboard-welcome">
          <h2 className="dashboard-welcome-text">Welcome back, <strong>{user?.name || 'Candidate'}</strong> ✨</h2>
          {status !== APPLICATION_STATUS.REGISTERED && (
            <span className={`dashboard-status-pill ${isShortlisted && !attempted ? 'shortlisted' : status === APPLICATION_STATUS.ASSESSMENT_SUBMITTED || attempted ? 'done' : status === APPLICATION_STATUS.NOT_SHORTLISTED ? 'rejected' : 'pending'}`}>
              • {displayStatus}
            </span>
          )}
        </div>

        {(status === APPLICATION_STATUS.APPLICATION_SUBMITTED || status === APPLICATION_STATUS.SHORTLISTED || status === APPLICATION_STATUS.ASSESSMENT_PENDING || status === APPLICATION_STATUS.ASSESSMENT_SUBMITTED || attempted) && (
          <div className="journey-section card">
            <h3 className="journey-title">YOUR APPLICATION JOURNEY</h3>
            <div className="journey-stepper">
              {JOURNEY_LABELS.map((label, i) => (
                <React.Fragment key={label}>
                  <div className={`journey-step-node ${i + 1 <= progress ? 'done' : i + 1 === progress ? 'current' : ''}`}>
                    {i + 1 < progress ? <span className="journey-check">✓</span> : <span className="journey-num">{i + 1}</span>}
                  </div>
                  {i < JOURNEY_LABELS.length - 1 && (
                    <div className={`journey-line ${i + 1 < progress ? 'done' : ''}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="journey-labels">
              {JOURNEY_LABELS.map((l) => (
                <span key={l} className="journey-label">{l}</span>
              ))}
            </div>
          </div>
        )}

        {status === APPLICATION_STATUS.REGISTERED && (
          <div className="card">
            <p className="status-desc">Submit your application to get started.</p>
            <Link to="/apply" className="btn btn-primary">Submit Application</Link>
          </div>
        )}

        {status === APPLICATION_STATUS.APPLICATION_SUBMITTED && (
          <div className="card">
            <p className="status-desc">Your application is under review. You will be notified when shortlisted.</p>
          </div>
        )}

        {status === APPLICATION_STATUS.NOT_SHORTLISTED && (
          <div className="card card-rejection">
            <p className="status-desc">Unfortunately you were not shortlisted this time. Thank you for your interest.</p>
          </div>
        )}

        {canTakeAssessment && (
          <div className="dashboard-card card card-assessment-ready">
            <span className="dashboard-card-icon">🎯</span>
            <div className="dashboard-card-content">
              <h4 className="dashboard-card-title">Assessment Ready</h4>
              <p className="dashboard-card-detail">30 min • 20 questions • 1 attempt only</p>
            </div>
            <Link to="/assessment" className="btn btn-begin">Begin →</Link>
          </div>
        )}

        {attempted && (status === APPLICATION_STATUS.SHORTLISTED || status === APPLICATION_STATUS.ASSESSMENT_PENDING) && (
          <div className="card">
            <p className="status-desc">Assessment already submitted. Results will be shared by the admin.</p>
          </div>
        )}

        {status === APPLICATION_STATUS.ASSESSMENT_SUBMITTED && (
          <div className="card">
            <p className="status-desc success-msg">Assessment completed. Check back for results.</p>
          </div>
        )}

        {(application?.formData || application) && (status !== APPLICATION_STATUS.REGISTERED) && (
          <div className="dashboard-card card card-summary">
            <span className="dashboard-card-icon">📄</span>
            <div className="dashboard-card-content">
              <h4 className="dashboard-card-title">Application Summary</h4>
              <p className="dashboard-card-detail">
                {formData.highestQualification || '—'}, {formData.academicDiscipline || '—'} · {formData.homeState || formData.currentStateOfResidence || '—'} · {punjabiLabel} Punjabi{submittedAgo ? ` · Submitted ${submittedAgo}` : ''}
              </p>
            </div>
          </div>
        )}

        <div className="dashboard-card card card-notice">
          <span className="dashboard-card-icon">📢</span>
          <div className="dashboard-card-content">
            <h4 className="dashboard-card-title">Notice</h4>
            <p className="dashboard-card-detail">The assessment must be completed before the deadline. Ensure a stable internet connection.</p>
          </div>
        </div>
      </div>
    </CandidateLayout>
  );
}
