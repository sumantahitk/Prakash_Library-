import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure axios defaults
  axios.defaults.baseURL = 'http://localhost:5000/api';

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
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
