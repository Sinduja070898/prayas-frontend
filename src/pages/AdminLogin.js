import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { validateEmail, validatePassword } from '../utils/validation';
import '../styles/AdminLogin.css';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin';

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') navigate(from, { replace: true });
  }, [isAuthenticated, user, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = {};
    if (!validateEmail(email)) err.email = 'Enter a valid email';
    if (!validatePassword(password)) err.password = 'Password must be at least 6 characters';
    setErrors(err);
    if (Object.keys(err).length > 0) return;
    const result = await login(email, password, 'admin');
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setErrors({ form: result.error || 'Login failed.' });
    }
  };

  return (
    <AdminLayout activeStep={1}>
      <div className="admin-login-page">
        <div className="admin-url-bar">
          <div className="admin-url-dots">
            <span className="red" /><span className="yellow" /><span className="green" />
          </div>
          <span>prayas.in/admin/login</span>
        </div>
        <div className="admin-login-card card">
          <h2 className="admin-login-screen-title">01 Admin Login</h2>
          <p className="admin-login-subtitle">Secure admin-only entry point.</p>
          <div className="admin-login-portal-title">Prayas Administration Portal</div>
          <div className="admin-access-badge">
            <span className="admin-access-icon">🛡</span> Admin Access Only
          </div>
          <form onSubmit={handleSubmit} className="admin-login-form">
            {errors.form && <div className="form-error form-error-block">{errors.form}</div>}
            <div className="form-group">
              <label htmlFor="admin-email">Admin Email</label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gmail.com"
                autoComplete="email"
              />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              {errors.password && <div className="form-error">{errors.password}</div>}
            </div>
            <button type="submit" className="btn btn-admin-signin">Sign In to Admin Panel</button>
          </form>
          <p className="admin-login-warning">
            This portal is restricted to authorized administrators. Unauthorized access attempts are logged.
          </p>
        </div>
        <p className="admin-login-back">
          <a href="/">← Back to candidate portal</a>
        </p>
      </div>
    </AdminLayout>
  );
}
