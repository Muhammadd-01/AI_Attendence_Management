import axios from 'axios';

// Replace with your laptop's Local IP Address
const BASE_URL = 'http://192.168.100.173:5001';

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

// ── Auth ──
export const loginUser = (email, password) => api.post('/api/auth/login', { email, password });

// ── Students ──
export const getStudents = async () => { const r = await api.get('/api/students'); return r.data?.data || r.data || []; };
export const addStudent = (data) => api.post('/api/students', data);
export const updateStudent = (id, data) => api.put(`/api/students/${id}`, data);
export const deleteStudent = (id) => api.delete(`/api/students/${id}`);

// ── Teachers ──
export const getTeachers = async () => { const r = await api.get('/api/teachers'); return r.data?.data || r.data || []; };
export const addTeacher = (data) => api.post('/api/teachers', data);
export const updateTeacher = (id, data) => api.put(`/api/teachers/${id}`, data);
export const deleteTeacher = (id) => api.delete(`/api/teachers/${id}`);

// ── Classes ──
export const getClasses = async () => { const r = await api.get('/api/students/classes'); return r.data?.data || r.data || []; };

// ── Attendance ──
export const recordCheckIn = (data) => api.post('/api/attendance/check-in', data);
export const recordCheckOut = (data) => api.post('/api/attendance/check-out', data);
export const getTodayAttendance = async (personType) => {
  const r = await api.get('/api/attendance/today', { params: { person_type: personType } });
  return r.data?.data || r.data || [];
};
export const getAttendanceByDate = async (date) => {
  const r = await api.get('/api/attendance/date', { params: { date } });
  return r.data?.data || r.data || [];
};

// ── Recognition / Scanner ──
export const scanFrame = async (base64Image, opts = {}) => {
  const r = await api.post('/api/recognition/scan-frame', {
    image: `data:image/jpeg;base64,${base64Image}`,
    ...opts,
  });
  return r.data;
};
export const startSession = () => api.post('/api/recognition/start');
export const stopSession = () => api.post('/api/recognition/stop');
export const triggerAutoTrain = async (personId, role, imageUrls) => {
  const endpoint = role === 'teacher' ? `/api/teachers/${personId}/train` : `/api/students/${personId}/train`;
  const r = await api.post(endpoint, { image_urls: imageUrls });
  return r.data;
};
export const syncAI = () => api.post('/api/recognition/sync');

// ── Dashboard ──
export const getDashboardStats = async () => {
  const r = await api.get('/api/dashboard/stats');
  return r.data?.data || r.data || {};
};

// ── Analytics ──
export const getAnalytics = async (params) => {
  const r = await api.get('/api/analytics', { params });
  return r.data?.data || r.data || {};
};

// ── Reports ──
export const getReports = async (params) => {
  const r = await api.get('/api/reports', { params });
  return r.data?.data || r.data || {};
};

// ── Settings ──
export const getSettings = async () => {
  const r = await api.get('/api/settings');
  return r.data?.data || r.data || {};
};
export const updateSettings = (data) => api.put('/api/settings', data);

// ── Student Portal ──
export const getStudentAttendance = async (studentId) => {
  const r = await api.get(`/api/attendance/student/${studentId}`);
  return r.data?.data || r.data || [];
};

export default api;
