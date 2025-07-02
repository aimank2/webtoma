// lib/http.ts
import axios, { AxiosInstance, AxiosError } from "axios";
import { getToken } from "@/utils/token";

// Initialize instance
const http: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  withCredentials: false,
});

// Request interceptor
http.interceptors.request.use(
  (config: any) => {
    const token = getToken();

    if (token && typeof window !== "undefined") {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token invalid or expired
      localStorage.removeItem("jwt");
      window.location.href = "/login";
    }

    // Optional: log or report other errors here
    return Promise.reject(error);
  }
);

export default http;
