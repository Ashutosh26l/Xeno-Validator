// src/services/api.js
// Axios client with JWT interceptor per spec §16 services/api.js

import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
});

// Attach JWT to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Only redirect if not already on login/register
      if (
        !window.location.pathname.includes("/login") &&
        !window.location.pathname.includes("/register")
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const register       = (data)         => API.post("/auth/register", data);
export const login          = (data)         => API.post("/auth/login", data);
export const getMe          = ()             => API.get("/auth/me");

// Upload
export const uploadCSV      = (formData)     => API.post("/upload", formData);
export const confirmMapping = (id, mapping)  => API.post(`/upload/${id}/confirm-mapping`, { mapping });
export const validateUpload = (id)           => API.post(`/validate/${id}`);

// Reports
export const getReport      = (id)           => API.get(`/report/${id}`);
export const getErrors      = (id, params)   => API.get(`/errors/${id}`, { params });
export const getHistory     = ()             => API.get("/uploads");
export const getUpload      = (id)           => API.get(`/uploads/${id}`);

// Downloads (returns { downloadUrl } → open in new tab)
export const downloadZip     = (id) => API.get(`/download/zip/${id}`);
export const downloadClean   = (id) => API.get(`/download/clean/${id}`);
export const downloadInvalid = (id) => API.get(`/download/invalid/${id}`);
export const downloadErrors  = (id) => API.get(`/download/errors/${id}`);
export const downloadSummary = (id) => API.get(`/download/summary/${id}`);

export default API;
