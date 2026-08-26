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
    const local = localStorage.getItem('auth_user');
    if (local) return JSON.parse(local);
    const session = sessionStorage.getItem('auth_user');
    if (session) return JSON.parse(session);
    return null;
  });

  const login = async (email, password, remember = true) => {
    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Invalid credentials');
      }
      
      const newUser = data.user;
      setUser(newUser);
      
      if (remember) {
        localStorage.setItem('auth_user', JSON.stringify(newUser));
      } else {
        sessionStorage.setItem('auth_user', JSON.stringify(newUser));
      }
      
      return newUser;
    } catch (error) {
      throw error;
    }
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
    sessionStorage.removeItem('auth_user');
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
