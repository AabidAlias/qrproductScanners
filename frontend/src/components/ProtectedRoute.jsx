import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute() {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-slate-300">Loading...</div>;
  }

  return authenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
