import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Tasks from './pages/Tasks';

function App() {
  const { token } = useContext(AuthContext);

  return (
    <Routes>
      <Route path="/" element={<Navigate to={token ? "/tasks" : "/login"} />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/tasks" element={token ? <Tasks /> : <Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
