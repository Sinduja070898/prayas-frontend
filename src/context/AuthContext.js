import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'prayas_token';
const USER_KEY = 'prayas_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (_) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
  }, []);

  const login = async (email, password, role = 'candidate') => {
    if (role === 'admin') {
      // Admin: validate against stored admins (no self-registration)
      try {
        const { getAdminByEmail } = require('../utils/mockStore');
        const admin = getAdminByEmail(email);
        if (!admin) {
          return { success: false, error: 'No admin account found with this email.' };
        }
        const mockToken = 'mock-jwt-admin-' + Date.now();
        const mockUser = { id: admin.id, email, role: 'admin', name: admin.name || email.split('@')[0] };
        setToken(mockToken);
        setUser(mockUser);
        localStorage.setItem(TOKEN_KEY, mockToken);
        localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
        return { success: true };
      } catch (_) {
        return { success: false, error: 'Login failed. Try again.' };
      }
    }
    // Candidate login: call API first; fall back to local store if API unreachable
    try {
      const data = await require('../api/client').apiLogin(email, password, 'candidate');
      const t = data.token;
      const u = data.user || {};
      const frontUser = { id: u.id || u._id, email: u.email, name: u.name || email.split('@')[0], role: 'candidate' };
      setToken(t);
      setUser(frontUser);
      localStorage.setItem(TOKEN_KEY, t);
      localStorage.setItem(USER_KEY, JSON.stringify(frontUser));
      return { success: true };
    } catch (apiErr) {
      if (apiErr?.status === 401 && apiErr?.message) {
        return { success: false, error: apiErr.message };
      }
      try {
        const { getCandidateByEmail } = require('../utils/mockStore');
        const existing = getCandidateByEmail(email);
        if (!existing) {
          return { success: false, error: 'No account found with this email. Please register first.' };
        }
        const storedPassword = existing.password;
        if (storedPassword !== undefined && storedPassword !== null && storedPassword !== '') {
          if (storedPassword !== password) {
            return { success: false, error: 'Incorrect password.' };
          }
        }
        const mockToken = 'mock-jwt-' + Date.now();
        const mockUser = { id: existing.id, email: existing.email, role: 'candidate', name: existing.name || email.split('@')[0] };
        setToken(mockToken);
        setUser(mockUser);
        localStorage.setItem(TOKEN_KEY, mockToken);
        localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
        return { success: true };
      } catch (_) {
        return { success: false, error: apiErr?.message || 'Login failed. Try again.' };
      }
    }
  };

  const register = async (name, email, password) => {
    try {
      const data = await require('../api/client').apiRegister(name, email, password);
      const t = data.token;
      const u = data.user || {};
      const frontUser = { id: u.id || u._id, email: u.email, name: u.name || email.split('@')[0], role: 'candidate' };
      setToken(t);
      setUser(frontUser);
      localStorage.setItem(TOKEN_KEY, t);
      localStorage.setItem(USER_KEY, JSON.stringify(frontUser));
      return { success: true };
    } catch (apiErr) {
      if (apiErr?.status === 400 && apiErr?.message) {
        return { success: false, error: apiErr.message };
      }
      try {
        const { getCandidateByEmail, addCandidate } = require('../utils/mockStore');
        if (getCandidateByEmail(email)) {
          return { success: false, error: 'An account with this email already exists. Sign in instead.' };
        }
        const newOne = addCandidate({ email: email.trim(), name: (name || '').trim(), password });
        const mockToken = 'mock-jwt-' + Date.now();
        const mockUser = { id: newOne.id, email: newOne.email, name: newOne.name || email.split('@')[0], role: 'candidate' };
        setToken(mockToken);
        setUser(mockUser);
        localStorage.setItem(TOKEN_KEY, mockToken);
        localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
        return { success: true };
      } catch (_) {
        return { success: false, error: apiErr?.message || 'Registration failed. Try again.' };
      }
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const value = { user, token, login, register, logout, isAuthenticated: !!token };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
