import api from './api';

export const getTodayAttendance = () => api.get('/attendance/today');
export const getAttendanceHistory = (params) => api.get('/attendance', { params });
export const getStudentAttendance = (id, params) => api.get(`/attendance/student/${id}`, { params });
export const finalizeSession = () => api.post('/attendance/finalize');
