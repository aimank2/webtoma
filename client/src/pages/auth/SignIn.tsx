import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/routes/routes";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query"; // Import useMutation
import api from "@/lib/api"; // Import the api instance

// Remove the local storage helper, AuthProvider handles it now
// const storage = { ... };

function SignIn() {
  // Renamed to AuthPage
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authIsLoading } = useAuth(); // Use login from context

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // loginError will now be handled by useMutation's error state
  // const [loginError, setLoginError] = useState("");
  // loadingLogin will be handled by useMutation's isLoading state
  // const [loadingLogin, setLoadingLogin] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !authIsLoading) {
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [isAuthenticated, authIsLoading, navigate]);

  const loginMutation = useMutation({
    mutationFn: (credentials: any) => api.post("/auth/login", credentials),
    onSuccess: (data) => {
      // Assuming data.data contains token and user from your axios response interceptor
      // If your api.ts already processes the response to return { token, user }, then data directly has it.
      // Adjust based on your actual api response structure after interceptors.
      const { token, user } = data.data; // Or simply data if interceptor returns the core data
      login(token, user);
      // Navigation is handled by useEffect, or you can navigate here explicitly if preferred
      // navigate(ROUTES.HOME);
    },
    onError: (error: any) => {
      // error.response.data.message should contain the error message from backend
      // Or adjust based on how your api errors are structured
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "An unknown error occurred during login.";
      // You might want to set this to a state to display in the UI
      console.error("Login error:", errorMessage);
      // For displaying the error, you'll need a state variable if you remove loginError
      // For now, logging it. Consider adding a state for UI feedback.
    },
  });

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  if (authIsLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Checking authentication...
      </div>
    );
  }

  // If already authenticated (e.g. due to fast redirect not completing), don't show form
  if (isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-screen">
        Redirecting...
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center size-full ">
      <div className="w-full  flex flex-col flex-center">
        <div className="text-center mb-8">
          <div className="text-4xl font-bold bg-clip-text bg-gradient-to-r from-orange-500 to-purple-400 text-transparent">
            {/* <TextAnimate
              animation="fadeIn"
              by="character"
              key="WEBTOMA-title-layout"
              delay={0.2}
              duration={1}
            > */}
            WEBTOMA
            {/* </TextAnimate> */}
          </div>
          <p className="text-lg text-gray-600">
            Your Smart Web <br />
            Companion⚡
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="p-3 border border-gray-950 rounded-2xl w-full text-sm"
            disabled={loginMutation.isPending} // Use mutation's loading state
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="p-3 border border-gray-950 rounded-2xl w-full text-sm"
            disabled={loginMutation.isPending} // Use mutation's loading state
          />
          {loginMutation.isError && (
            <p className="text-red-500 text-xs text-center">
              {loginMutation.error.response?.data?.message ||
                loginMutation.error.message ||
                "Login failed"}
            </p>
          )}
          <Button
            type="submit"
            disabled={loginMutation.isPending || authIsLoading} // Use mutation's loading state
            className="w-full py-3 text-base"
          >
            {loginMutation.isPending ? "Logging In..." : "Login"}{" "}
            {/* Use mutation's loading state */}
          </Button>
        </form>
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              to={ROUTES.SIGNUP}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
