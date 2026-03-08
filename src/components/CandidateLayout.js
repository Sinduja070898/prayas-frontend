import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiApplicationsMe } from '../api/client';
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
  const [showDropdown, setShowDropdown] = useState(false);
  const [application, setApplication] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user?.role === 'candidate') {
      let cancelled = false;
      (async () => {
        try {
          const app = await apiApplicationsMe();
          if (!cancelled) setApplication(app);
        } catch (_) {
          // Ignore errors, will show basic info
        }
      })();
      return () => { cancelled = true; };
    }
  }, [user?.role]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowDropdown(false);
  };

  const handleCandidateClick = () => {
    if (user?.role === 'candidate') {
      setShowDropdown(!showDropdown);
    }
  };

  const formData = application?.formData || {};
  const candidateName = user?.name || formData.fullName || 'Candidate';
  const candidateEmail = user?.email || formData.email || '—';

  return (
    <div className="candidate-layout">
      <header className="candidate-topbar">
        <Link to="/" className="candidate-brand">Prayas</Link>
        <nav className="candidate-flow">
          <span className="candidate-flow-label">CANDIDATE FLOW • 5 SCREENS</span>
          <div className="candidate-flow-steps">
            {CANDIDATE_STEPS.map((s) => {
              // Show "Logout" instead of "Login / Register" when logged in
              const label = s.num === 1 && user?.role === 'candidate' ? 'Logout' : s.label;
              const handleClick = s.num === 1 && user?.role === 'candidate' ? (e) => { e.preventDefault(); handleLogout(); } : undefined;
              return (
                <Link
                  key={s.num}
                  to={s.path}
                  onClick={handleClick}
                  className={`candidate-flow-step ${s.num === activeStep ? 'active' : ''}`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="candidate-badge-wrapper" ref={dropdownRef}>
          {user?.role === 'candidate' ? (
            <>
              <div 
                className="candidate-badge" 
                onClick={handleCandidateClick} 
                onKeyDown={(e) => e.key === 'Enter' && handleCandidateClick()} 
                role="button" 
                tabIndex={0}
              >
                <span className="candidate-badge-icon">👤</span> Candidate
              </div>
              {showDropdown && (
                <div className="candidate-dropdown">
                  <div className="candidate-dropdown-header">
                    <div className="candidate-dropdown-name">{candidateName}</div>
                    <div className="candidate-dropdown-email">{candidateEmail}</div>
                  </div>
                  <div className="candidate-dropdown-divider"></div>
                  <button 
                    type="button"
                    className="candidate-dropdown-logout" 
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="candidate-badge">Candidate</div>
          )}
        </div>
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
