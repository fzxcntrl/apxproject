import React from 'react';
import { Link } from 'react-router-dom';

const Register = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-green-600 mb-4">Register Page</h1>
      <p className="text-gray-600 mb-8">This is a placeholder for the Register page.</p>
      <Link to="/login" className="text-green-500 hover:underline">Go to Login</Link>
    </div>
  );
};

export default Register;
