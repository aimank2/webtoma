import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // Assuming React Router v6
// import { useAuth } from '../contexts/AuthContext'; // Assuming you have an AuthContext

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_APP_API_URL}`;

const VerifyEmailPage: React.FC = () => {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  // const { login } = useAuth(); // From AuthContext to update auth state
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const emailFromQuery = queryParams.get("email");
    if (emailFromQuery) {
      setEmail(emailFromQuery);
    }
  }, [location.search]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    if (!email || code.length !== 4) {
      setError(
        "Please enter a valid email and a 4-character verification code."
      );
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code: code.toUpperCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to verify email.");
      }

      setMessage(data.message || "Email verified successfully! Redirecting...");
      // Assuming the backend sends a token upon successful verification
      if (data.token) {
        // login(data.token, data.user); // Update auth state via context
        localStorage.setItem("authToken", data.token); // Or store token directly
        localStorage.setItem("authUser", JSON.stringify(data.user));
        console.log("User verified and token stored:", data.token);
      }
      setTimeout(() => {
        navigate("/home"); // Or your desired redirect path after login
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    }
    setIsLoading(false);
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || !email) {
      setError(
        email
          ? `Please wait ${resendCooldown}s before resending.`
          : "Email is required to resend code."
      );
      return;
    }
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend code.");
      }

      setMessage(
        data.message || "New verification code sent. Please check your email."
      );
      setResendCooldown(60); // Start 60-second cooldown
    } catch (err: any) {
      setError(err.message || "An error occurred while resending the code.");
    }
    setIsLoading(false);
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "50px auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h2>Verify Your Email</h2>
      <p>
        A verification code has been sent to{" "}
        <strong>{email || "your email address"}</strong>. Please enter it below.
      </p>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email (if not pre-filled):</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!!location.search} // Disable if email is from query param
            required
            style={{
              width: "100%",
              padding: "8px",
              margin: "8px 0",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div>
          <label htmlFor="code">Verification Code (4 characters):</label>
          <input
            type="text"
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={4}
            minLength={4}
            required
            style={{
              width: "100%",
              padding: "8px",
              margin: "8px 0",
              boxSizing: "border-box",
            }}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {isLoading ? "Verifying..." : "Verify Code"}
        </button>
      </form>
      <button
        onClick={handleResendCode}
        disabled={isLoading || resendCooldown > 0}
        style={{
          width: "100%",
          padding: "10px",
          marginTop: "10px",
          backgroundColor: resendCooldown > 0 ? "#ccc" : "#6c757d",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        {resendCooldown > 0
          ? `Resend Code (${resendCooldown}s)`
          : "Resend Code"}
      </button>
      {message && (
        <p style={{ color: "green", marginTop: "10px" }}>{message}</p>
      )}
      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
      <p style={{ marginTop: "10px" }}>
        Changed your mind? <a href="/signup">Sign up again</a> or{" "}
        <a href="/login">Login</a> if already verified.
      </p>
    </div>
  );
};

export default VerifyEmailPage;
