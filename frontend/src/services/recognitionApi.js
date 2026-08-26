import api from './api';

export const startSession = (payload = {}) => api.post('/recognition/start', payload);
export const stopSession = () => api.post('/recognition/stop');
export const getStatus = () => api.get('/recognition/status');
export const getLatestResults = () => api.get('/recognition/latest');
