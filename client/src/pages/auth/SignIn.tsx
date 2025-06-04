import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth"; // Import useAuth
import { ROUTES } from "@/routes/routes";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// Remove the local storage helper, AuthProvider handles it now
// const storage = { ... };

function SignIn() {
  // Renamed to AuthPage
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authIsLoading } = useAuth(); // Use login from context

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loadingLogin, setLoadingLogin] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authIsLoading) {
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [isAuthenticated, authIsLoading, navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError("");
    setLoadingLogin(true);
    try {
      const response = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Call login from AuthContext
      await login(data.token, data.user); // Assuming backend returns user object

      // Navigation will be handled by useEffect or can be explicit here
      // navigate(ROUTES.HOME); // This might be redundant due to useEffect
    } catch (err: any) {
      setLoginError(err.message || "An unknown error occurred during login.");
      console.error("Login error:", err);
    } finally {
      setLoadingLogin(false);
    }
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
    <div className="relative flex flex-col items-center justify-center size-full">
      <div className="w-full  flex flex-col flex-center">
        <div className="text-center mb-8">
          <div className="text-4xl font-bold bg-clip-text bg-gradient-to-r from-orange-500 to-purple-400 text-transparent">
            {/* <TextAnimate
              animation="fadeIn"
              by="character"
              key="TETRAI-title-layout"
              delay={0.2}
              duration={1}
            > */}
            TETRAI
            {/* </TextAnimate> */}
          </div>
          <p className="text-lg text-gray-600">
            Your Smart Form Filling Companion⚡
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
            disabled={loadingLogin}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="p-3 border border-gray-950 rounded-2xl w-full text-sm"
            disabled={loadingLogin}
          />
          {loginError && (
            <p className="text-red-500 text-xs text-center">{loginError}</p>
          )}
          <Button
            type="submit"
            disabled={loadingLogin || authIsLoading}
            className="w-full py-3 text-base"
          >
            {loadingLogin ? "Logging In..." : "Login"}
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
