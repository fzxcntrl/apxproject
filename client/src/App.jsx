import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Tasks from './pages/Tasks';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated ? "/tasks" : "/login"} replace />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/tasks" replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/tasks" replace /> : <Register />} />
      <Route 
        path="/tasks" 
        element={
          <ProtectedRoute>
            <Tasks />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;
