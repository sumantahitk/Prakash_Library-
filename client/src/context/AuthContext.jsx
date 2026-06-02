import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import LoadingScreen from '../components/LoadingScreen';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure axios defaults
  // In production (Render), frontend & backend are the same origin, so use relative path.
  // In local development, point to the local backend server.
  axios.defaults.baseURL = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    const storedUser = localStorage.getItem('prakashUser');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      axios.defaults.headers.common['Authorization'] = `Bearer ${parsed.token}`;
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/auth/login', { email, password });
      setUser(res.data);
      localStorage.setItem('prakashUser', JSON.stringify(res.data));
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      toast.success('Login Successful');
      return res.data;
    } catch (error) {
      if (error.response?.status === 429) {
        toast.error('Too many login attempts. Please try again later.');
      } else {
        const errorMsg = error.response?.data?.message 
          || (typeof error.response?.data === 'string' ? error.response.data : 'Login Failed');
        toast.error(errorMsg);
      }
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('prakashUser');
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
  };

  const updateUser = (newFields) => {
    const updated = { ...user, ...newFields };
    setUser(updated);
    localStorage.setItem('prakashUser', JSON.stringify(updated));
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
