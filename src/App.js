import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Home from './pages/Home';
import CandidateAuth from './pages/CandidateAuth';
import AdminLogin from './pages/AdminLogin';
import CandidateDashboard from './pages/CandidateDashboard';
import ApplicationForm from './pages/ApplicationForm';
import Assessment from './pages/Assessment';
import AssessmentConfirmation from './pages/AssessmentConfirmation';
import AdminCandidates from './pages/AdminCandidates';
import AdminCandidateDetail from './pages/AdminCandidateDetail';
import AdminQuestions from './pages/AdminQuestions';
import AdminResults from './pages/AdminResults';
import './styles/App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<CandidateAuth />} />
          <Route path="/register" element={<Navigate to="/login?tab=create" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireRole="candidate">
                <CandidateDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/apply" element={<ProtectedRoute requireRole="candidate"><ApplicationForm /></ProtectedRoute>} />
          <Route path="/application" element={<Navigate to="/apply" replace />} />
          <Route
            path="/assessment"
            element={
              <ProtectedRoute requireRole="candidate">
                <Assessment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessment/confirmation"
            element={
              <ProtectedRoute requireRole="candidate">
                <AssessmentConfirmation />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireRole="admin">
                <AdminCandidates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/candidates/:id"
            element={
              <ProtectedRoute requireRole="admin">
                <AdminCandidateDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/questions"
            element={
              <ProtectedRoute requireRole="admin">
                <AdminQuestions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/results"
            element={
              <ProtectedRoute requireRole="admin">
                <AdminResults />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
