/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter } from "next/navigation";

export default function GoogleInit() {
  const router = useRouter();

  const handleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;

    const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      callback: (tokenResponse: any) => {
        const accessToken = tokenResponse.access_token;
        console.log("✅ Real access token:", accessToken);
        if (accessToken) {
          localStorage.setItem("google_access_token", accessToken);
          router.push("/sheets");
        }
      },
    });

    tokenClient.requestAccessToken();
  };

  return (
    <div>
      <button onClick={handleLogin}>Login with Google & Continue</button>
    </div>
  );
}
