import api from './api';

export const getDailyReport = (date) => api.get('/reports/daily', { params: { date } });
export const getMonthlyReport = (month, year) => api.get('/reports/monthly', { params: { month, year } });
export const getStudentReport = (id) => api.get(`/reports/student/${id}`);
export const exportCSV = (params) => api.get('/reports/export', { params, responseType: 'blob' });
