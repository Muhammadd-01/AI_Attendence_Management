import axios from 'axios';

// Replace this with your laptop's Local IP Address (e.g. 192.168.1.5)
// Do NOT use 'localhost' or '127.0.0.1' because the mobile app runs on a physical device / emulator
// and localhost refers to the phone itself, not the laptop!
const BASE_URL = 'http://192.168.100.173:5001'; 

const api = axios.create({
  baseURL: BASE_URL,
});

export const triggerAutoTrain = async (personId, role, imageUrls) => {
  const endpoint = role === 'teacher' ? `/api/teachers/${personId}/train` : `/api/students/${personId}/train`;
  const response = await api.post(endpoint, {
    image_urls: imageUrls,
  });
  return response.data;
};

export const scanFrame = async (base64Image) => {
  const response = await api.post('/api/recognition/scan-frame', {
    image: base64Image,
  });
  return response.data;
};

export const getStudents = async () => {
  const response = await api.get('/api/students');
  return response.data;
};

export const getTeachers = async () => {
  const response = await api.get('/api/teachers');
  return response.data;
};

export default api;
