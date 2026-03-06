import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Layout.css';

export default function Layout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(user?.role === 'admin' ? '/admin/login' : '/login');
  };

  return (
    <div className="layout">
      <header className="layout-header">
        <div className="layout-brand">
          <Link to={user?.role === 'admin' ? '/admin' : '/'}>Assessment Platform</Link>
        </div>
        <nav className="layout-nav">
          {user?.role === 'candidate' && (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/application">Application</Link>
              <Link to="/assessment">Assessment</Link>
            </>
          )}
          {user?.role === 'admin' && (
            <>
              <Link to="/admin">Candidates</Link>
              <Link to="/admin/questions">MCQ Questions</Link>
              <Link to="/admin/results">Results</Link>
            </>
          )}
          {user && (
            <span className="layout-user">
              {user.name} ({user.role})
              <button type="button" className="btn-logout" onClick={handleLogout}>Logout</button>
            </span>
          )}
        </nav>
      </header>
      <main className="layout-main">
        {title && <h1 className="page-title">{title}</h1>}
        {children}
      </main>
    </div>
  );
}
