import axios from "axios";

// Get the base URL from environment or use default
const RAW_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";

// Ensure /api is appended if not already present
const BASE_URL = RAW_URL.endsWith("/api") ? RAW_URL : `${RAW_URL}/api`;

console.log("[AXIOS] Configuring with BASE_URL:", BASE_URL);

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // 🔑 needed for cookies
});

// Add request interceptor to include Authorization header
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("[AXIOS] Added Authorization header");
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Add response logging for debugging
axiosInstance.interceptors.response.use(
  (response) => {
    console.log("[AXIOS] Response:", response.config.url, response.status);
    return response;
  },
  (error) => {
    console.log("[AXIOS] Error:", error.config?.url, error.response?.status);
    return Promise.reject(error);
  },
);

export default axiosInstance;
