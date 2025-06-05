import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import {
  clearToken,
  getRefreshToken,
  getToken,
  storeRefreshToken,
  storeToken,
} from "./auth-utils";

const API_BASE_URL = "http://localhost:3001/api"; // Replace with your actual API base URL

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    // Pragma and Cache-control might not be as effective in extensions or could be managed by server
  },
  timeout: 20000,
});

// Function to handle redirecting to login, adapted for extension context
// In an extension, direct window.location.href changes might not be ideal.
// Consider using a state management solution to trigger a view change to the login page.
// For now, we'll keep it simple, but this might need refinement.
const goToLogin = () => {
  // This assumes your AuthProvider or a similar mechanism will pick up the cleared token
  // and redirect to the login page (ROUTES.AUTH) via React Router's Navigate component.
  clearToken();
  // Potentially, you might need to communicate with a background script or use a global state
  // to force navigation if the current view isn't reactive to auth changes immediately.
  console.warn("Token cleared, user should be redirected to login.");
  // window.location.hash = ROUTES.AUTH; // If using HashRouter and it's reliable
};

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null = null
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const refreshAccessToken = async () => {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    goToLogin();
    throw new Error("No refresh token available.");
  }

  try {
    // Ensure this endpoint matches your server's refresh token route
    const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
      token: refreshToken,
    });
    const newAccessToken = response.data.accessToken;
    const newRefreshToken = response.data.refreshToken; // Assuming your server sends a new refresh token

    await storeToken(newAccessToken);
    if (newRefreshToken) {
      await storeRefreshToken(newRefreshToken);
    }
    return newAccessToken;
  } catch (error) {
    console.error("Failed to refresh access token:", error);
    goToLogin(); // Clear tokens and redirect
    throw error;
  }
};

api.interceptors.response.use(
  (response) => {
    // If your server sends a new token in headers upon expiration (not standard OAuth2 practice for access tokens)
    // const newAccessToken = response.headers["x-new-access-token"];
    // if (newAccessToken) {
    //   await storeToken(newAccessToken);
    // }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Check if it's a 401 error, not a retry, and not the login/refresh paths themselves
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url &&
      !originalRequest.url.includes("/auth/login") && // Adjust if your login path is different
      !originalRequest.url.includes("/auth/refresh-token")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(async (token) => {
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest); // Retry with the new token
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await refreshAccessToken();
        processQueue(null, newAccessToken);

        if (newAccessToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest); // Retry the original request with the new token
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
