import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import '../styles/Home.css';

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  const hero = (
    <div className="home-page">
      <div className="home-hero card">
        {isAuthenticated && user?.role === 'candidate' && (
          <>
            <h1>Assessment Platform</h1>
            <p>Welcome, {user.name}. Manage your application and assessment from the dashboard.</p>
            <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
          </>
        )}
        {isAuthenticated && user?.role === 'admin' && (
          <>
            <h1>Admin Portal</h1>
            <p>Manage candidates, questions, and view results.</p>
            <Link to="/admin" className="btn btn-primary">Go to Admin</Link>
          </>
        )}
        {!isAuthenticated && (
          <>
            <h1>Assessment Platform</h1>
            <p className="home-intro">Candidates: register, submit your application, and take the assessment if shortlisted.</p>

            <section className="home-section">
              <h2 className="home-section-title">Candidates</h2>
              <div className="home-actions">
                <Link to="/register" className="btn btn-primary">Register</Link>
                <Link to="/login" className="btn btn-secondary">Login</Link>
              </div>
            </section>

            <section className="home-section home-section-admin">
              <h2 className="home-section-title">Admin</h2>
              <p className="home-section-desc">Admin access is by invitation only. Use your credentials to sign in.</p>
              <div className="home-actions">
                <Link to="/admin/login" className="btn btn-primary">Admin Login</Link>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );

  if (isAuthenticated) return <Layout title="">{hero}</Layout>;
  return hero;
}
