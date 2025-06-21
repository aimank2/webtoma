import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/routes/routes";
import { useMutation } from "@tanstack/react-query"; // Import useMutation
import api from "@/lib/api"; // Import the api instance

function SignUp() {
  const [name, setName] = useState(""); // Added name state
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
    onSuccess: (response) => { // Changed 'data' to 'response' to match typical axios structure
      // The server now sends { message: string, email: string } on success
      const responseData = response.data; // Assuming 'api' is an axios instance
      console.log("Signup successful:", responseData);
      
      // IMPORTANT: Redirect to verification page with email as query param
      if (responseData.email) {
        // alert(responseData.message); // Optional: show success message
        navigate(`${ROUTES.VERIFY_EMAIL}?email=${responseData.email}`); // e.g., navigate('/verify?email=user@example.com')
      } else {
        // Fallback if email is not in response, though it should be
        // alert(responseData.message || "Signup successful! Please check your email.");
        navigate(ROUTES.AUTH); // Or a generic success page
      }
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "An unknown error occurred during signup.";
      console.error("Signup error:", errorMessage);
      // alert(errorMessage); // Display error to user
    },
  });

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      // Handle password mismatch locally before calling mutation
      // You might want to set a local error state to display this in the UI
      signUpMutation.reset(); // Clear previous mutation state if any
      // For example, set a local error state:
      // setFormError("Passwords do not match."); 
      alert("Passwords do not match."); // Simple alert for now
      return;
    }
    // Clear any local form error before submitting
    // setFormError(""); 
    signUpMutation.mutate({ name, email, password });
  };

  return (
    <div className="flex flex-col items-center justify-center size-ful p-4">
      <div className="w-full max-w-md p-8 space-y-6 rounded-lg ">
        <h1 className="text-2xl font-bold text-center ">Create Account</h1>
        <form onSubmit={handleSignUp} className="space-y-6">
          <div>
            <label
              htmlFor="name" // Added name input field
              className="block text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="p-3 border border-gray-950 rounded-2xl w-full text-sm"
            />
          </div>

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
              className="p-3 border border-gray-950 rounded-2xl w-full text-sm"
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
              className="p-3 border border-gray-950 rounded-2xl w-full text-sm"
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
              className="p-3 border border-gray-950 rounded-2xl w-full text-sm"
            />
          </div>

          {signUpMutation.isError && (
            <p className="text-sm text-red-600">
              {/* Ensure you handle the password mismatch error display if not using alert */}
              {password !== confirmPassword
                ? "Passwords do not match."
                : signUpMutation.error.response?.data?.message ||
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
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignUp;
