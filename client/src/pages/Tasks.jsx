import React from 'react';
import { Link } from 'react-router-dom';

const Tasks = () => {
  return (
    <div className="flex flex-col items-center p-8 min-h-screen bg-gray-50">
      <h1 className="text-4xl font-bold text-indigo-600 mb-4">Tasks Page</h1>
      <p className="text-gray-600 mb-8">This is a placeholder for the Tasks page.</p>
      <Link to="/login" className="text-indigo-500 hover:underline">Logout (simulate)</Link>
    </div>
  );
};

export default Tasks;
