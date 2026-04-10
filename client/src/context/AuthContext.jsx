import { createContext, useContext, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";

// Base URL for API requests; comes from Vite env in production, falls back to /api in dev
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure axios to send tokens in Authorization header
  const authorizedApi = useMemo(() => {
    const api = axios.create({
      baseURL: API_BASE_URL,
    });

    // Add request interceptor to attach token from localStorage
    api.interceptors.request.use((config) => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor to handle token refresh
    api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;
        const message = error.response?.data?.message;

        // If access token expired, try to refresh
        const isAccessTokenExpired =
          status === 401 &&
          typeof message === "string" &&
          message.toLowerCase().includes("expired");

        if (
          isAccessTokenExpired &&
          originalRequest &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem("refreshToken");
            const { data } = await axios.post(
              `${API_BASE_URL}/auth/refresh`,
              {},
              { 
                headers: { Cookie: `refreshToken=${refreshToken}` }, // fallback for cookie support
                withCredentials: true 
              }
            );

            const newAccessToken = data?.data?.accessToken;
            if (newAccessToken) {
              localStorage.setItem("accessToken", newAccessToken);
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            setUser(null);
            window.location.href = "/login";
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return api;
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data } = await authorizedApi.get("/auth/profile");
        const userFromProfile = data?.data?.user ?? null;
        setUser(userFromProfile);
      } catch (error) {
        console.error("Failed to fetch profile", error);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [authorizedApi]);

  const login = async (credentials) => {
    const { data } = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
    const profile = data?.data?.user;
    const accessToken = data?.data?.accessToken;
    const refreshToken = data?.data?.refreshToken;

    if (!profile || !accessToken) {
      throw new Error("Invalid login response. Please try again.");
    }

    localStorage.setItem("accessToken", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

    setUser(profile);
    return profile;
  };

  const register = async (payload) => {
    const { data } = await axios.post(`${API_BASE_URL}/auth/register`, payload);
    const profile = data?.data?.user;
    const accessToken = data?.data?.accessToken;
    const refreshToken = data?.data?.refreshToken;

    if (!profile || !accessToken) {
      throw new Error("Invalid registration response. Please try again.");
    }

    localStorage.setItem("accessToken", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

    setUser(profile);
    return profile;
  };

  const logout = async () => {
    try {
      await authorizedApi.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
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
      api: authorizedApi,
    }),
    [user, loading, authorizedApi]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
