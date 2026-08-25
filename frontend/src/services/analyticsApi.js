import api from './api';

export const getAnalytics = () => api.get('/analytics');
export const getAnomalies = () => api.get('/analytics/anomalies');
export const getClassStats = () => api.get('/analytics/classes');
export const getDistribution = () => api.get('/analytics/distribution');
