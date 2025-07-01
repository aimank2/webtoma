import http from "./httpService";
import axios from "axios";

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

export const loginWithGoogle = async (idToken: string): Promise<{ token: string }> => {
  const res = await axios.post(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/google`,
    { id_token: idToken }
  );
  return res.data;
};
