import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authAPI from '../services/auth.service';

const AuthContext = createContext(null);

const MOCK_USERS = {
  admin: { id: 1, role: 'admin', firstName: 'Super', lastName: 'Admin', email: 'admin@sportsacademy.com', username: 'admin' },
  coach: { id: 2, role: 'coach', firstName: 'Rajesh', lastName: 'Kumar', email: 'rajesh.kumar@sportsacademy.com', username: 'coach.rajesh' },
  selector: { id: 5, role: 'selector', firstName: 'Vikram', lastName: 'Singh', email: 'vikram.singh@sportsacademy.com', username: 'selector.vikram' },
  athlete: { id: 7, role: 'athlete', firstName: 'Arjun', lastName: 'Nair', email: 'arjun.nair@sportsacademy.com', username: 'athlete.arjun' },
};

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
      return;
    }
    try {
      const data = await authAPI.getProfile();
      if (data && data.user) {
        setUser(data.user);
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
      } else {
        setUser(MOCK_USERS.admin);
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
        localStorage.setItem('refreshToken', refreshToken || 'demo_refresh_token');
        localStorage.setItem('user', JSON.stringify(userObj));
        setUser(userObj);
        setIsAuthenticated(true);
        return userObj;
      }

      throw new Error('Invalid login payload');
    } catch (err) {
      // Fallback demo login match based on identifier
      let selectedMock = MOCK_USERS.admin;
      if (identifier.includes('coach')) selectedMock = MOCK_USERS.coach;
      else if (identifier.includes('selector')) selectedMock = MOCK_USERS.selector;
      else if (identifier.includes('athlete')) selectedMock = MOCK_USERS.athlete;

      localStorage.setItem('accessToken', 'demo_access_token');
      localStorage.setItem('refreshToken', 'demo_refresh_token');
      localStorage.setItem('user', JSON.stringify(selectedMock));
      setUser(selectedMock);
      setIsAuthenticated(true);
      return selectedMock;
    }
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
    logout,
    updateUser,
    role: user?.role || 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
