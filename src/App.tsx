import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import EmployeeDetail from './components/EmployeeDetail';
import ContributionMatrix from './components/ContributionMatrix';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppRoutes() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={token ? <Navigate to="/" /> : <Login />} 
      />
      <Route 
        path="/" 
        element={token ? <Dashboard /> : <Navigate to="/login" />} 
      />
      <Route 
        path="/employee/:id" 
        element={token ? <EmployeeDetail /> : <Navigate to="/login" />} 
      />
      <Route 
        path="/matrix" 
        element={token ? <ContributionMatrix /> : <Navigate to="/login" />} 
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;