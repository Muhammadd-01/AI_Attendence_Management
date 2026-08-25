import api from './api';

export const getStats = () => api.get('/dashboard/stats');
export const getRecentActivity = () => api.get('/dashboard/recent');
export const getWeeklyTrend = () => api.get('/dashboard/weekly-trend');
export const getMonthlyTrend = () => api.get('/dashboard/monthly-trend');
