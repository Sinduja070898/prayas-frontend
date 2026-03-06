import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword } from '../utils/validation';
import CandidateLayout from '../components/CandidateLayout';
import '../styles/CandidateAuth.css';

export default function CandidateAuth() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'create'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const { login, register, logout, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated && user?.role === 'candidate') navigate(from, { replace: true });
  }, [isAuthenticated, user, navigate, from]);

  // If user opened candidate login while logged in as admin, clear session so candidate login gets a fresh token
  useEffect(() => {
    if (user?.role === 'admin') logout();
  }, [user?.role, logout]);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab === 'create') setMode('create');
  }, [location.search]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    const err = {};
    if (!validateEmail(email)) err.email = 'Enter a valid email';
    if (!validatePassword(password)) err.password = 'Password must be at least 6 characters';
    setErrors(err);
    if (Object.keys(err).length > 0) return;
    const result = await login(email.trim(), password, 'candidate');
    if (!result.success) {
      setErrors({ form: result.error });
      return;
    }
    navigate(from, { replace: true });
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    const err = {};
    if (!name || name.trim().length < 2) err.name = 'Name is required (min 2 characters)';
    if (!validateEmail(email)) err.email = 'Enter a valid email';
    if (!validatePassword(password)) err.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) err.confirmPassword = 'Passwords do not match';
    setErrors(err);
    if (Object.keys(err).length > 0) return;
    const result = await register(name.trim(), email.trim(), password);
    if (!result.success) {
      setErrors({ form: result.error });
      return;
    }
    navigate('/dashboard', { replace: true });
  };

  return (
    <CandidateLayout activeStep={1} title="Login & Register" subtitle="Entry point for all candidates.">
      <div className="candidate-auth-page">
        <div className="candidate-url-bar">
          <div className="candidate-url-dots">
            <span className="red" /><span className="yellow" /><span className="green" />
          </div>
          <span>prayas.in/login</span>
        </div>
        <div className="candidate-auth-card card">
          <div className="candidate-auth-brand">
            <span className="candidate-auth-logo">Prayas</span>
            <span className="candidate-auth-tagline">Punjab Fellowship Programme · 2025</span>
          </div>
          {location.state?.message && (
            <div className="candidate-auth-message" role="alert">
              {location.state.message}
            </div>
          )}
          <div className="candidate-auth-tabs">
            <button
              type="button"
              className={`candidate-auth-tab ${mode === 'signin' ? 'active' : ''}`}
              onClick={() => setMode('signin')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`candidate-auth-tab ${mode === 'create' ? 'active' : ''}`}
              onClick={() => setMode('create')}
            >
              Create Account
            </button>
          </div>
          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="candidate-auth-form">
              {errors.form && <div className="form-error form-error-block">{errors.form}</div>}
              <div className="form-group">
                <label htmlFor="auth-email">Email Address</label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="arjun@example.com"
                  autoComplete="email"
                />
                {errors.email && <div className="form-error">{errors.email}</div>}
              </div>
              <div className="form-group">
                <label htmlFor="auth-password">Password</label>
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                {errors.password && <div className="form-error">{errors.password}</div>}
              </div>
              <button type="submit" className="btn btn-signin-prayas">Sign In to Prayas</button>
            </form>
          ) : (
            <form onSubmit={handleCreateAccount} className="candidate-auth-form">
              {errors.form && <div className="form-error form-error-block">{errors.form}</div>}
              <div className="form-group">
                <label htmlFor="create-name">Full Name</label>
                <input
                  id="create-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                />
                {errors.name && <div className="form-error">{errors.name}</div>}
              </div>
              <div className="form-group">
                <label htmlFor="create-email">Email Address</label>
                <input
                  id="create-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="arjun@example.com"
                  autoComplete="email"
                />
                {errors.email && <div className="form-error">{errors.email}</div>}
              </div>
              <div className="form-group">
                <label htmlFor="create-password">Password</label>
                <input
                  id="create-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  autoComplete="new-password"
                />
                {errors.password && <div className="form-error">{errors.password}</div>}
              </div>
              <div className="form-group">
                <label htmlFor="create-confirm">Confirm Password</label>
                <input
                  id="create-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
              </div>
              <button type="submit" className="btn btn-signin-prayas">Create Account</button>
            </form>
          )}
          {mode === 'signin' && (
            <>
              <div className="candidate-auth-divider">or continue with</div>
              <button type="button" className="btn btn-google" disabled>
                <span className="btn-google-icon">G</span> Continue with Google
              </button>
            </>
          )}
          <p className="candidate-auth-switch">
            {mode === 'signin' ? (
              <>Don&apos;t have an account? <button type="button" className="link-button" onClick={() => setMode('create')}>Create one →</button></>
            ) : (
              <>Already have an account? <button type="button" className="link-button" onClick={() => setMode('signin')}>Sign In</button></>
            )}
          </p>
        </div>
      </div>
    </CandidateLayout>
  );
}
