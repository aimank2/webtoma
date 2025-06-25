/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
}

const GoogleSignIn = () => {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const router = useRouter();

  const handleSuccess = async (credentialResponse: any) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URI}/api/auth/google`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: credentialResponse.credential,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Authentication failed");
      }

      const data = await response.json();
      localStorage.setItem("jwt", data.token);
      router.push("/dashboard");
    } catch (error) {
      console.error("Authentication error:", error);
    }
  };

  const handleError = () => {
    console.error("Login Failed");
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap={false}
      />
    </div>
  );
};

export default GoogleSignIn;
