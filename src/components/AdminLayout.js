import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCandidates } from '../utils/mockStore';
import { getApplications, getAssessmentResults } from '../utils/mockStore';
import { APPLICATION_STATUS } from '../utils/constants';
import '../styles/AdminLayout.css';

const STEPS = [
  { num: 1, label: 'Admin Login', path: '/admin/login' },
  { num: 2, label: 'Dashboard', path: '/admin' },
  { num: 3, label: 'Candidate Detail', path: '/admin' },
  { num: 4, label: 'MCQ Manager', path: '/admin/questions' },
  { num: 5, label: 'Results & Export', path: '/admin/results' },
];

function getCounts() {
  const candidates = getCandidates();
  const applications = getApplications();
  const results = getAssessmentResults();
  let pending = 0;
  let shortlisted = 0;
  candidates.forEach((c) => {
    const app = applications.find((a) => a.candidateId === c.id);
    const status = app?.status;
    if (status === APPLICATION_STATUS.APPLICATION_SUBMITTED || status === APPLICATION_STATUS.REGISTERED) pending++;
    else if ([APPLICATION_STATUS.SHORTLISTED, APPLICATION_STATUS.ASSESSMENT_PENDING, APPLICATION_STATUS.ASSESSMENT_SUBMITTED].includes(status)) shortlisted++;
  });
  return { total: candidates.length, pending, shortlisted, assessed: results.length };
}

export default function AdminLayout({ children, activeStep = 1, title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = user?.role === 'admin';
  const counts = isLoggedIn ? getCounts() : { total: 0, pending: 0, shortlisted: 0, assessed: 0 };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-layout">
      <header className="admin-topbar">
        <div className="admin-brand">Prayas Admin</div>
        <nav className="admin-flow">
          <span className="admin-flow-label">Admin Flow • 5 Screens</span>
          <div className="admin-flow-steps">
            {STEPS.map((s) => (
              <Link
                key={s.num}
                to={s.path}
                className={`admin-flow-step ${s.num === activeStep ? 'active' : ''}`}
              >
                {s.num} {s.label}
              </Link>
            ))}
          </div>
        </nav>
        <div className="admin-badge">
          <span className="admin-badge-icon">🛡</span> Admin
        </div>
      </header>

      <div className="admin-body">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-brand">
            <span className="admin-sidebar-logo">Prayas</span>
            <span className="admin-sidebar-console">ADMIN CONSOLE</span>
          </div>
          <nav className="admin-sidebar-nav">
            <div className="admin-nav-section">
              <span className="admin-nav-section-title">OVERVIEW</span>
              <Link to="/admin" className={`admin-nav-item ${activeStep === 2 ? 'active' : ''}`}>
                <span className="admin-nav-icon">📊</span> Dashboard
              </Link>
            </div>
            <div className="admin-nav-section">
              <span className="admin-nav-section-title">CANDIDATES</span>
              <Link to="/admin" className={`admin-nav-item ${location.pathname === '/admin' && !location.search ? 'active' : ''}`}>
                <span className="admin-nav-icon">👥</span> All Candidates
                <span className="admin-nav-badge">{counts.total}</span>
              </Link>
              <Link to="/admin?filter=pending" className="admin-nav-item">
                <span className="admin-nav-icon">⏳</span> Pending Review
              </Link>
              <Link to="/admin?filter=shortlisted" className="admin-nav-item">
                <span className="admin-nav-icon admin-nav-icon-green">✓</span> Shortlisted
              </Link>
            </div>
            <div className="admin-nav-section">
              <span className="admin-nav-section-title">ASSESSMENT</span>
              <Link to="/admin/questions" className={`admin-nav-item ${activeStep === 4 ? 'active' : ''}`}>
                <span className="admin-nav-icon">?</span> MCQ Manager
              </Link>
              <Link to="/admin/results" className={`admin-nav-item ${activeStep === 5 ? 'active' : ''}`}>
                <span className="admin-nav-icon">📈</span> Results
              </Link>
              <Link to="/admin/results" className="admin-nav-item">
                <span className="admin-nav-icon">↓</span> Export CSV
              </Link>
            </div>
            <div className="admin-nav-section">
              <span className="admin-nav-section-title">ACCOUNT</span>
              <Link to="/admin" className="admin-nav-item">
                <span className="admin-nav-icon">⚙</span> Settings
              </Link>
              <button type="button" className="admin-nav-item admin-nav-logout" onClick={handleLogout}>
                <span className="admin-nav-icon">🚪</span> Logout
              </button>
            </div>
          </nav>
        </aside>

        <main className="admin-main">
          {title && (
            <div className="admin-page-header">
              <span className="admin-page-num">{String(activeStep).padStart(2, '0')}</span>
              <div>
                <h1 className="admin-page-title">{title}</h1>
                {subtitle && <p className="admin-page-subtitle">{subtitle}</p>}
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
