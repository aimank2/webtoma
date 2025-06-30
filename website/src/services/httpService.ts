import axios from "axios";
import { getToken } from "../utils/token";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

axiosInstance.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  get: axiosInstance.get,
  post: axiosInstance.post,
};
