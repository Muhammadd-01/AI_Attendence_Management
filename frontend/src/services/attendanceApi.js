import api from './api';

export const getTodayAttendance = (params) => api.get('/attendance/today', { params });
export const getAttendanceHistory = (params) => api.get('/attendance', { params });
export const getStudentAttendance = (id, params) => api.get(`/attendance/student/${id}`, { params });
export const finalizeSession = () => api.post('/attendance/finalize');
export const recordCheckIn = (data) => api.post('/attendance/check-in', data);
export const recordCheckOut = (data) => api.post('/attendance/check-out', data);
