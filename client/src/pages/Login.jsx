import React from 'react';
import { Link } from 'react-router-dom';

const Login = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">Login Page</h1>
      <p className="text-gray-600 mb-8">This is a placeholder for the Login page.</p>
      <Link to="/register" className="text-blue-500 hover:underline">Go to Register</Link>
    </div>
  );
};

export default Login;
