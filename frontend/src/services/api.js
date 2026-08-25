import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    // Can add auth tokens or loading states here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    toast.error(message);
    return Promise.reject(error);
  }
);

export default api;
