import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiApplicationsList, apiAssessmentsList } from '../api/client';
import { getCandidates } from '../utils/mockStore';
import { getApplications, getAssessmentResults } from '../utils/mockStore';
import { APPLICATION_STATUS } from '../utils/constants';
import '../styles/AdminLayout.css';

const STEPS = [
  { num: 1, label: 'Admin Login', path: '/admin/login' },
  { num: 2, label: 'Dashboard', path: '/admin' },
  { num: 3, label: 'MCQ Manager', path: '/admin/questions' },
  { num: 4, label: 'Results & Export', path: '/admin/results' },
];

function getCountsMem() {
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
  const [counts, setCounts] = useState({ total: 0, pending: 0, shortlisted: 0, assessed: 0 });
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setCounts({ total: 0, pending: 0, shortlisted: 0, assessed: 0 });
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const [appRes, assRes] = await Promise.all([apiApplicationsList(), apiAssessmentsList()]);
        if (!cancelled) {
          const apps = appRes.applications || [];
          const results = assRes.assessments || [];
          let pending = 0;
          let shortlisted = 0;
          apps.forEach((app) => {
            const status = app.status || '';
            if (status === APPLICATION_STATUS.APPLICATION_SUBMITTED || status === APPLICATION_STATUS.REGISTERED || status === 'Application Submitted' || status === 'Registered') pending++;
            else if ([APPLICATION_STATUS.SHORTLISTED, APPLICATION_STATUS.ASSESSMENT_PENDING, APPLICATION_STATUS.ASSESSMENT_SUBMITTED, 'Shortlisted', 'Assessment Pending', 'Assessment Submitted'].includes(status)) shortlisted++;
          });
          setCounts({ total: apps.length, pending, shortlisted, assessed: results.length });
        }
      } catch (_) {
        if (!cancelled) setCounts(getCountsMem());
      }
    }
    load();
    return () => { cancelled = true; };
  }, [isLoggedIn]);

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

  const confirmLogout = () => {
    logout();
    navigate('/admin/login');
    setShowDropdown(false);
    setShowLogoutModal(false);
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
    setShowDropdown(false);
  };

  const handleAdminClick = (e) => {
    e.stopPropagation();
    if (isLoggedIn) {
      setShowDropdown(!showDropdown);
    }
  };

  const adminName = user?.name || 'Admin';
  const adminEmail = user?.email || '—';

  return (
    <div className="admin-layout">
      {showLogoutModal && (
        <div className="admin-modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-modal-title">Confirm Logout</h3>
            <p className="admin-modal-message">Are you sure you want to logout?</p>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-btn admin-modal-btn-cancel"
                onClick={() => setShowLogoutModal(false)}
              >
                No
              </button>
              <button
                type="button"
                className="admin-modal-btn admin-modal-btn-confirm"
                onClick={confirmLogout}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
      <header className="admin-topbar">
        <div className="admin-brand">Prayas Admin</div>
        <nav className="admin-flow">
          <span className="admin-flow-label">Admin Flow • 4 Screens</span>
          {isLoggedIn && (
            <div className="admin-flow-steps">
              {STEPS.filter((s) => {
                // Remove Admin Login tab when logged in
                return !(s.num === 1 && isLoggedIn);
              }).map((s) => (
                <Link
                  key={s.num}
                  to={s.path}
                  className={`admin-flow-step ${s.num === activeStep ? 'active' : ''}`}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          )}
        </nav>
        <div className="admin-badge-wrapper" ref={dropdownRef}>
          {isLoggedIn ? (
            <>
              <div
                className="admin-badge"
                onClick={handleAdminClick}
                onKeyDown={(e) => e.key === 'Enter' && handleAdminClick(e)}
                role="button"
                tabIndex={0}
              >
                <span className="admin-badge-icon">🛡</span> Admin
              </div>
              {showDropdown && (
                <div className="admin-dropdown">
                  <div className="admin-dropdown-header">
                    <div className="admin-dropdown-name">{adminName}</div>
                    <div className="admin-dropdown-email">{adminEmail}</div>
                  </div>
                  <div className="admin-dropdown-divider"></div>
                  <button
                    type="button"
                    className="admin-dropdown-logout"
                    onClick={handleLogoutClick}
                  >
                    Logout
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="admin-badge">
              <span className="admin-badge-icon">🛡</span> Admin
            </div>
          )}
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
              <Link to="/admin/questions" className={`admin-nav-item ${activeStep === 3 ? 'active' : ''}`}>
                <span className="admin-nav-icon">?</span> MCQ Manager
              </Link>
              <Link to="/admin/results" className={`admin-nav-item ${activeStep === 4 ? 'active' : ''}`}>
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
              <button type="button" className="admin-nav-item admin-nav-logout" onClick={handleLogoutClick}>
                <span className="admin-nav-icon">🚪</span> Logout
              </button>
            </div>
          </nav>
        </aside>

        <main className={`admin-main ${title ? 'admin-main-with-header' : 'admin-main-centered'}`}>
          {title && (
            <div className="admin-header-wrapper">
              <div className="admin-page-header">
                <span className="admin-page-num">{String(activeStep).padStart(2, '0')}</span>
                <div>
                  <h1 className="admin-page-title">{title}</h1>
                  {subtitle && <p className="admin-page-subtitle">{subtitle}</p>}
                </div>
              </div>
            </div>
          )}
          <div className={title ? 'admin-content' : 'admin-content-centered'}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
