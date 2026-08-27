import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AppContext = createContext();
export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('auth_user');
        if (stored) setUser(JSON.parse(stored));
      } catch {}
      setLoading(false);
    })();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    if (!res.data?.success) throw new Error(res.data?.error || 'Invalid credentials');
    const u = res.data.user;
    setUser(u);
    await AsyncStorage.setItem('auth_user', JSON.stringify(u));
    return u;
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('auth_user');
  };

  const updateProfile = async (fields) => {
    const updated = { ...user, ...fields };
    setUser(updated);
    await AsyncStorage.setItem('auth_user', JSON.stringify(updated));
  };

  return (
    <AppContext.Provider value={{ user, login, logout, updateProfile, loading }}>
      {children}
    </AppContext.Provider>
  );
};
