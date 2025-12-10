import axios from "axios";

// Base URL from PDF/Postman
const BASE_URL = "http://13.210.33.250";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: "application/json",
  },
});

// Request Interceptor: Add Token and Company ID
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const companyId = localStorage.getItem("company_id") || "4"; // Defaulting to 4 based on Postman

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (companyId) {
    config.headers.company_id = companyId;
  }
  return config;
});

export default api;
