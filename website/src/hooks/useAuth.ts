import { useMutation } from "@tanstack/react-query";
import { login, signup } from "../services/authService";
import { setToken } from "../utils/token";
import { loginWithGoogle } from "@/services/authService";

export const useLogin = () =>
  useMutation({
    mutationFn: login,
    onSuccess: (data) => {
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

export const useGoogleLoginMutation = () =>
  useMutation({
    mutationFn: async (idToken: string) => {
      return await loginWithGoogle(idToken);
    },
  });
