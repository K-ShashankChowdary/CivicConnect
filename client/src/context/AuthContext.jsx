import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Configure axios to send cookies with requests
  const authorizedApi = useMemo(
    () => {
      const api = axios.create({
        baseURL: '/api',
        withCredentials: true // Send cookies with requests
      });

      // Add response interceptor to handle token refresh
      api.interceptors.response.use(
        (response) => response,
        async (error) => {
          const originalRequest = error.config;

          // If access token expired, try to refresh
          if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
              await axios.post('/api/auth/refresh', {}, { withCredentials: true });
              // Retry the original request
              return api(originalRequest);
            } catch (refreshError) {
              // Refresh failed, logout user
              setUser(null);
              window.location.href = '/login';
              return Promise.reject(refreshError);
            }
          }

          return Promise.reject(error);
        }
      );

      return api;
    },
    []
  );

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await authorizedApi.get('/auth/profile');
        setUser(data.data.user);
      } catch (error) {
        console.error('Failed to fetch profile', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [authorizedApi]);

  const login = async (credentials) => {
    const { data } = await axios.post('/api/auth/login', credentials, {
      withCredentials: true // Send cookies
    });
    const { user: profile } = data.data;
    setUser(profile);
    return profile;
  };

  const register = async (payload) => {
    const { data } = await axios.post('/api/auth/register', payload, {
      withCredentials: true // Send cookies
    });
    const { user: profile } = data.data;
    setUser(profile);
    return profile;
  };

  const logout = async () => {
    try {
      await authorizedApi.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      api: authorizedApi
    }),
    [user, loading, authorizedApi]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
