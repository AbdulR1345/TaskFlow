import { createContext, useState, useEffect } from 'react';
import API from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');

  // Dark Mode Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Load user from token
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await API.get('/auth/me'); 
          setUser(res.data.user);
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const register = async (userData) => {
  const res = await API.post('/auth/register', userData);
  // Do NOT save token or set user yet
  // Because email is not verified
  return res.data;
};

  const login = async (userData) => {
    const res = await API.post('/auth/login', userData);
    localStorage.setItem('token', res.data.token);
    setUser({
      ...res.data.user,
      avatarUrl: res.data.user.avatarUrl || '',
      avatarPublicId: res.data.user.avatarPublicId || null
    });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser((prevUser) => ({
      ...(prevUser || {}),
      ...(updatedUser || {})
    }));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      register, 
      login, 
      logout,
      updateUser,
      darkMode,
      setDarkMode 
    }}>
      {children}
    </AuthContext.Provider>
  );
};