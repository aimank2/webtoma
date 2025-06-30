import { useMutation } from "@tanstack/react-query";
import { login, signup } from "../services/authService";
import { setToken } from "../utils/token";

export const useLogin = () =>
  useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      console.log(data);
      setToken(data.token);
    },
  });

export const useSignup = () =>
  useMutation({
    mutationFn: signup,
    onSuccess: (data) => {
      setToken(data.token);
    },
  });
