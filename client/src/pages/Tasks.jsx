import React from 'react';
import { useAuth } from '../context/AuthContext';

const Tasks = () => {
  const { logout } = useAuth();

  return (
    <div className="flex flex-col items-center p-8 min-h-screen bg-gray-50">
      <h1 className="text-4xl font-bold text-indigo-600 mb-4">Tasks Page</h1>
      <p className="text-gray-600 mb-8">This is a placeholder for the Tasks page.</p>
      <button 
        onClick={logout}
        className="text-indigo-500 hover:underline"
      >
        Logout
      </button>
    </div>
  );
};

export default Tasks;
