import api from './api';

export const getStats = (role, assignedClass) => api.get(`/dashboard/stats?role=${role || ''}&class=${assignedClass || ''}`);
export const getRecentActivity = (role, assignedClass) => api.get(`/dashboard/recent?role=${role || ''}&class=${assignedClass || ''}`);
export const getWeeklyTrend = (role, assignedClass) => api.get(`/dashboard/weekly-trend?role=${role || ''}&class=${assignedClass || ''}`);
export const getMonthlyTrend = (role, assignedClass) => api.get(`/dashboard/monthly-trend?role=${role || ''}&class=${assignedClass || ''}`);
