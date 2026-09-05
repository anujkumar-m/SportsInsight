import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authAPI from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('accessToken');
  });

  const initAuth = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      setIsAuthenticated(false);
      setUser(null);
      return;
    }
    try {
      const res = await authAPI.getProfile();
      const userObj = res?.data?.user || res?.user || (res?.data && !res?.data?.success ? res.data : null);
      if (userObj && userObj.id) {
        setUser(userObj);
        localStorage.setItem('user', JSON.stringify(userObj));
        setIsAuthenticated(true);
      } else {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
        }
      }
    } catch {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (identifier, password) => {
    try {
      const res = await authAPI.login(identifier, password);
      const payload = res?.data || res;
      const token = payload?.accessToken || payload?.token;
      const refreshToken = payload?.refreshToken;
      const userObj = payload?.user;

      if (token && userObj) {
        localStorage.setItem('accessToken', token);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userObj));
        setUser(userObj);
        setIsAuthenticated(true);
        return userObj;
      }

      throw new Error('Invalid response received from authentication server.');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Invalid credentials or server connection failed.';
      throw new Error(msg);
    }
  };

  const googleLogin = async (credential) => {
    const res = await authAPI.googleLogin(credential);
    const payload = res?.data || res;
    const token = payload?.accessToken || payload?.token;
    const refreshToken = payload?.refreshToken;
    const userObj = payload?.user;

    if (!token || !userObj) {
      throw new Error('Invalid Google login response from server.');
    }

    localStorage.setItem('accessToken', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userObj));
    setUser(userObj);
    setIsAuthenticated(true);
    return userObj;
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await authAPI.logout(refreshToken);
    } catch {
      // Ignore errors during logout
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    googleLogin,
    logout,
    updateUser,
    role: user?.role || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
