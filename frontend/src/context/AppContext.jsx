import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSettings } from '../services/settingsApi';
import { getStatus } from '../services/recognitionApi';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('ai_attendance_dark_mode');
    return saved !== null ? saved === 'true' : false;
  });
  
  // Auth State (mock)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (email, password, role, name) => {
    const newUser = { 
      email, 
      role, 
      name: name || (role === 'principal' ? 'Dr. Abdullah Khan' : 'Muhammad Affan'),
      phone: role === 'principal' ? '+92 300 1234567' : '+92 321 7654321',
      department: role === 'principal' ? 'Administration & Executive Office' : 'Department of Computer Science',
      title: role === 'principal' ? 'Head of Institution / Principal' : 'Senior Lecturer & AI Lab Incharge',
      joinedDate: 'Jan 2024'
    };
    setUser(newUser);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
  };

  const updateProfile = (updatedFields) => {
    setUser(prev => {
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('auth_user', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  useEffect(() => {
    localStorage.setItem('ai_attendance_dark_mode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await getSettings();
      setSettings(res?.data || res || {});
    } catch (error) {
      console.error('Failed to load settings', error);
    }
  }, []);

  const checkSession = useCallback(async () => {
    try {
      const res = await getStatus();
      const payload = res?.data || res;
      setSessionActive(payload?.is_active || payload?.session_active || false);
    } catch (error) {
      console.error('Failed to check session status', error);
    }
  }, []);

  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
      await Promise.all([refreshSettings(), checkSession()]);
      setLoading(false);
    };
    initApp();
  }, [refreshSettings, checkSession]);

  return (
    <AppContext.Provider value={{
      settings,
      refreshSettings,
      sessionActive,
      setSessionActive,
      loading,
      darkMode,
      setDarkMode,
      user,
      login,
      logout,
      updateProfile
    }}>
      {children}
    </AppContext.Provider>
  );
};
