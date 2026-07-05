import api from './axios';

export const getTasks = async (params = {}) => {
  const response = await api.get('/tasks', { params });
  return response.data;
};

export const createTask = async (data) => {
  const response = await api.post('/tasks', data);
  return response.data;
};

export const updateTask = async (id, data) => {
  const response = await api.put(`/tasks/${id}`, data);
  return response.data;
};

export const deleteTask = async (id) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};

export const restoreTask = async (id) => {
  const response = await api.patch(`/tasks/${id}/restore`);
  return response.data;
};
