// src/services/api.js
// Axios client for API calls

import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
});

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
