import http from "./httpService";

export const login = async (credentials: {
  email: string;
  password: string;
}) => {
  const res = await http.post("/auth/login", credentials);
  return res.data;
};

export const signup = async (data: {
  name: string;
  email: string;
  password: string;
}) => {
  const res = await http.post("/auth/signup", data);
  return res.data;
};
