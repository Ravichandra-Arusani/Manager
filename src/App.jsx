// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginPage         from './pages/LoginPage';
import DashboardPage     from './pages/DashboardPage';
import SharedProjectPage from './pages/SharedProjectPage';
import AuthGuard         from './components/AuthGuard';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public share page — no auth required */}
        <Route path="/project/:id" element={<SharedProjectPage />} />

        {/* Auth routes */}
        <Route
          path="/"
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/dashboard"
          element={
            <AuthGuard user={user}>
              <DashboardPage />
            </AuthGuard>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
