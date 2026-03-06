import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/CandidateLayout.css';

const CANDIDATE_STEPS = [
  { num: 1, label: 'Login / Register', path: '/login' },
  { num: 2, label: 'Application Form', path: '/apply' },
  { num: 3, label: 'Dashboard', path: '/dashboard' },
  { num: 4, label: 'MCQ Assessment', path: '/assessment' },
  { num: 5, label: 'Confirmation', path: '/assessment/confirmation' },
];

export default function CandidateLayout({ children, activeStep = 1, title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="candidate-layout">
      <header className="candidate-topbar">
        <Link to="/" className="candidate-brand">Prayas</Link>
        <nav className="candidate-flow">
          <span className="candidate-flow-label">CANDIDATE FLOW • 5 SCREENS</span>
          <div className="candidate-flow-steps">
            {CANDIDATE_STEPS.map((s) => (
              <Link
                key={s.num}
                to={s.path}
                className={`candidate-flow-step ${s.num === activeStep ? 'active' : ''}`}
              >
                {s.num} {s.label}
              </Link>
            ))}
          </div>
        </nav>
        {user?.role === 'candidate' ? (
          <div className="candidate-badge" onClick={handleLogout} onKeyDown={(e) => e.key === 'Enter' && handleLogout()} role="button" tabIndex={0}>
            <span className="candidate-badge-icon">👤</span> Candidate
          </div>
        ) : (
          <div className="candidate-badge">Candidate</div>
        )}
      </header>
      <main className="candidate-main">
        {title && (
          <div className="candidate-page-header">
            <span className="candidate-page-num">{String(activeStep).padStart(2, '0')}</span>
            <div>
              <h1 className="candidate-page-title">{title}</h1>
              {subtitle && <p className="candidate-page-subtitle">{subtitle}</p>}
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
