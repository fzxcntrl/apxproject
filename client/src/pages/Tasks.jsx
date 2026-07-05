import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTasks, createTask, updateTask, deleteTask, restoreTask } from '../api/tasks';
import { Plus, Trash2, Edit2, CheckCircle2, Circle, X, Search, ArrowUp, ArrowDown } from 'lucide-react';

const Tasks = () => {
  const { logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
  const [error, setError] = useState('');

  // Toast state for undo
  const [toast, setToast] = useState({ visible: false, task: null, timeoutId: null });

  // Filter & Sort state
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (sortBy) params.sortBy = sortBy;
      if (order) params.order = order;

      const res = await getTasks(params);
      if (res.success) setTasks(res.data);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter, priorityFilter, sortBy, order]);

  const handleToggleStatus = async (task) => {
    try {
      const newStatus = task.status === 'PENDING' ? 'COMPLETED' : 'PENDING';
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
      await updateTask(task.id, { status: newStatus });
      // If we are filtering by status, we should technically refetch to remove it from the list
      if (statusFilter !== 'ALL') {
        fetchTasks();
      }
    } catch (err) {
      console.error("Failed to update status", err);
      fetchTasks();
    }
  };

  const handleEdit = (task) => {
    setEditingTaskId(task.id);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (task) => {
    if (toast.timeoutId) clearTimeout(toast.timeoutId);
    
    setTasks(tasks.filter(t => t.id !== task.id));
    
    try {
      await deleteTask(task.id);
      
      const timeoutId = setTimeout(() => {
        setToast({ visible: false, task: null, timeoutId: null });
      }, 5000);
      
      setToast({ visible: true, task, timeoutId });
    } catch (err) {
      console.error("Failed to delete task", err);
      fetchTasks();
    }
  };

  const handleUndo = async () => {
    if (!toast.task) return;
    const taskToRestore = toast.task;
    
    if (toast.timeoutId) clearTimeout(toast.timeoutId);
    setToast({ visible: false, task: null, timeoutId: null });
    
    // We could do an optimistic update here, but a full refetch respects the active filters/sorting perfectly
    try {
      await restoreTask(taskToRestore.id);
      fetchTasks();
    } catch (err) {
      console.error("Failed to restore task", err);
      fetchTasks();
    }
  };

  const openNewTaskModal = () => {
    setEditingTaskId(null);
    setFormData({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
    setIsModalOpen(true);
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
      const payload = {
        ...formData,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
      };

      if (editingTaskId) {
        const res = await updateTask(editingTaskId, payload);
        if (res.success) {
          setIsModalOpen(false);
          fetchTasks(); // Refetch to respect current sort/filters
        }
      } else {
        const res = await createTask(payload);
        if (res.success) {
          setIsModalOpen(false);
          fetchTasks(); // Refetch to respect current sort/filters
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${editingTaskId ? 'update' : 'create'} task`);
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative">
      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <span className="text-sm font-medium">Task deleted.</span>
          <button 
            onClick={handleUndo}
            className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors text-sm uppercase tracking-wide"
          >
            Undo
          </button>
          <button 
            onClick={() => setToast({ ...toast, visible: false })}
            className="text-slate-400 hover:text-slate-200 ml-2"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <h1 className="text-xl font-bold tracking-tight text-indigo-600">Task Manager</h1>
        <button 
          onClick={logout}
          className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          Logout
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h2 className="text-2xl font-bold">Your Tasks</h2>
          <button 
            onClick={openNewTaskModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus size={18} />
            <span>New Task</span>
          </button>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 sticky top-[65px] z-10 flex flex-col gap-4">
          
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:max-w-xs flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search tasks..." 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <span className="text-sm text-slate-500 hidden sm:inline">Sort by:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="createdAt">Created Date</option>
                <option value="dueDate">Due Date</option>
              </select>
              <button 
                onClick={() => setOrder(order === 'desc' ? 'asc' : 'desc')}
                className="p-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                title={`Sort ${order === 'desc' ? 'Descending' : 'Ascending'}`}
              >
                {order === 'desc' ? <ArrowDown size={18} /> : <ArrowUp size={18} />}
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-100 w-full hidden md:block"></div>

          <div className="flex flex-col md:flex-row gap-4 md:gap-8 overflow-x-auto pb-2 md:pb-0">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 whitespace-nowrap">Status:</span>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                {['ALL', 'PENDING', 'COMPLETED'].map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap ${
                      statusFilter === s ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {s.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 whitespace-nowrap">Priority:</span>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(p)}
                    className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap ${
                      priorityFilter === p ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white h-40 rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-6"></div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center bg-white border border-slate-200 border-dashed rounded-2xl py-20 px-4 text-center">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No tasks found</h3>
            <p className="text-slate-500 mb-6 max-w-sm">
              {(statusFilter !== 'ALL' || priorityFilter !== 'ALL' || debouncedSearch) 
                ? "Try adjusting your filters or search query." 
                : "Get started by creating your first task to stay organized and productive."}
            </p>
            {!(statusFilter !== 'ALL' || priorityFilter !== 'ALL' || debouncedSearch) && (
              <button 
                onClick={openNewTaskModal}
                className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-5 py-2.5 rounded-lg font-medium transition-colors"
              >
                Create first task
              </button>
            )}
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
                    <button 
                      onClick={() => handleEdit(task)} 
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(task)} 
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
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

      {/* New/Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold">{editingTaskId ? 'Edit Task' : 'Create New Task'}</h3>
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
                  {isSubmitting ? 'Saving...' : editingTaskId ? 'Save Changes' : 'Create Task'}
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
