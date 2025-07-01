"use client";

import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { useGoogleToken } from "@/context/GoogleTokenContext";

export default function GoogleInit() {
  const router = useRouter();
  const { setGoogleToken } = useGoogleToken();

  const handleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;

    const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      callback: (tokenResponse: any) => {
        const accessToken = tokenResponse.access_token;
        console.log("✅ Real access token:", accessToken);
        if (accessToken) {
          setGoogleToken(accessToken); // Store in context and sessionStorage
          router.push("/sheets");
        }
      },
    });

    tokenClient.requestAccessToken();
  };

  return (
    <div>
      <Button onClick={handleLogin}>Allow Google Sheet Access</Button>
    </div>
  );
}
