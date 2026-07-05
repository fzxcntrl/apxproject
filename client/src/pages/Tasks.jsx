import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTasks, createTask, updateTask, deleteTask } from '../api/tasks';
import { Plus, Trash2, Edit2, CheckCircle2, Circle, X } from 'lucide-react';

const Tasks = () => {
  const { logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
  const [error, setError] = useState('');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await getTasks();
      if (res.success) setTasks(res.data);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleToggleStatus = async (task) => {
    try {
      const newStatus = task.status === 'PENDING' ? 'COMPLETED' : 'PENDING';
      // Optimistic update
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
      await updateTask(task.id, { status: newStatus });
    } catch (err) {
      console.error("Failed to update status", err);
      // Revert on failure
      fetchTasks();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      // Optimistic update
      setTasks(tasks.filter(t => t.id !== id));
      await deleteTask(id);
    } catch (err) {
      console.error("Failed to delete task", err);
      fetchTasks();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createTask({
        ...formData,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
      });
      if (res.success) {
        setTasks([res.data, ...tasks]);
        setIsModalOpen(false);
        setFormData({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityColors = {
    HIGH: 'bg-red-100 text-red-700',
    MEDIUM: 'bg-amber-100 text-amber-700',
    LOW: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold tracking-tight text-indigo-600">Task Manager</h1>
        <button 
          onClick={logout}
          className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          Logout
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Your Tasks</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>New Task</span>
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white h-40 rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-6"></div>
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
                  <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center bg-white border border-slate-200 border-dashed rounded-2xl py-20 px-4 text-center">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No tasks yet</h3>
            <p className="text-slate-500 mb-6 max-w-sm">Get started by creating your first task to stay organized and productive.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-5 py-2.5 rounded-lg font-medium transition-colors"
            >
              Create first task
            </button>
          </div>
        ) : (
          /* Task Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map(task => (
              <div 
                key={task.id} 
                className={`bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow relative group ${
                  task.status === 'COMPLETED' ? 'opacity-70' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <button 
                    onClick={() => handleToggleStatus(task)}
                    className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors flex-shrink-0"
                  >
                    {task.status === 'COMPLETED' ? (
                      <CheckCircle2 className="text-emerald-500" size={22} />
                    ) : (
                      <Circle size={22} />
                    )}
                  </button>
                  <h3 className={`font-semibold flex-1 ${task.status === 'COMPLETED' ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                    {task.title}
                  </h3>
                  
                  {/* Actions (visible on hover or always on touch) */}
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleDelete(task.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {task.description && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2 pl-8">
                    {task.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pl-8 mt-4">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${priorityColors[task.priority] || priorityColors.MEDIUM}`}>
                    {task.priority}
                  </span>
                  
                  {task.status === 'COMPLETED' && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      Done
                    </span>
                  )}
                  
                  {task.dueDate && task.status !== 'COMPLETED' && (
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold">Create New Task</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="What needs to be done?"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                    placeholder="Add details..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={e => setFormData({...formData, priority: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={e => setFormData({...formData, dueDate: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 text-white font-medium rounded-lg transition-colors ${
                    isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isSubmitting ? 'Saving...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
