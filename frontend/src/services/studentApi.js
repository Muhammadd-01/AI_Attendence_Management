import api from './api';

export const getStudents = (params) => api.get('/students', { params });
export const getStudent = (id) => api.get(`/students/${id}`);
export const createStudent = (data) => api.post('/students', data);
export const updateStudent = (id, data) => api.put(`/students/${id}`, data);
export const deleteStudent = (id) => api.delete(`/students/${id}`);
export const capturefaces = (id) => api.post(`/students/${id}/faces/capture`);
export const getStudentFaces = (id) => api.get(`/students/${id}/faces`);
export const trainStudent = (id) => api.post(`/students/${id}/train`);
