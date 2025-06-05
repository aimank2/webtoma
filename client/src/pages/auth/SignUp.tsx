import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/routes/routes";
import { useMutation } from "@tanstack/react-query"; // Import useMutation
import api from "@/lib/api"; // Import the api instance

function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // error will be handled by useMutation's error state
  // const [error, setError] = useState("");
  // loading will be handled by useMutation's isLoading state
  // const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const signUpMutation = useMutation({
    mutationFn: (newUser: any) => api.post("/auth/signup", newUser),
    onSuccess: (data) => {
      console.log("Signup successful:", data.data); // Assuming data.data from axios response
      // alert("Signup successful! Please log in.");
      navigate(ROUTES.AUTH); // Navigate to login page after signup
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "An unknown error occurred during signup.";
      console.error("Signup error:", errorMessage);
      // For displaying the error, you'll need a state variable if you remove error
      // For now, logging it. Consider adding a state for UI feedback.
      // alert(errorMessage); // Simple alert, replace with a proper UI notification
    },
  });

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // It's good practice to clear previous errors from mutation if you're not using a separate state
    // signUpMutation.reset(); // Optional: if you want to clear error on new submit attempt

    if (password !== confirmPassword) {
      // This local validation can remain, or be part of a more complex form validation strategy
      // alert("Passwords do not match."); // Replace with UI error state if preferred
      return;
    }
    signUpMutation.mutate({ email, password });
  };

  return (
    <div className="flex flex-col items-center justify-center size-ful p-4">
      <div className="w-full max-w-md p-8 space-y-6 rounded-lg ">
        <h1 className="text-2xl font-bold text-center ">Create Account</h1>
        <form onSubmit={handleSignUp} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-gray-700"
            >
              Confirm Password
            </label>
            <input
              id="confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {signUpMutation.isError && (
            <p className="text-sm text-red-600">
              {signUpMutation.error.response?.data?.message ||
                signUpMutation.error.message ||
                "Signup failed"}
            </p>
          )}

          <div>
            <Button
              type="submit"
              className="w-full"
              disabled={signUpMutation.isPending}
            >
              {" "}
              {/* Use mutation's loading state */}
              {signUpMutation.isPending ? "Signing Up..." : "Sign Up"}{" "}
              {/* Use mutation's loading state */}
            </Button>
          </div>
        </form>
        <p className="mt-4 text-sm text-center text-gray-600">
          Already have an account?{" "}
          <Link
            to={ROUTES.AUTH}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignUp;
