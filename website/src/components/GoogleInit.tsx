/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { Button } from "./ui/button";
import { useGoogleToken } from "@/context/GoogleTokenContext";
import { Sparkle } from "lucide-react";

export default function GoogleInit() {
  const { setGoogleToken, clearGoogleToken } = useGoogleToken();

  const handleLogin = () => {
    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
      if (!clientId) throw new Error("Missing Google Client ID");

      const tokenClient = (
        window as any
      ).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/spreadsheets",
        callback: (tokenResponse: any) => {
          const accessToken = tokenResponse.access_token;
          console.log("✅ Real access token:", accessToken);

          if (accessToken) {
            setGoogleToken(accessToken); // Store in context and sessionStorage
          } else {
            console.error("❌ Failed to retrieve access token.");
          }
        },
      });

      tokenClient.requestAccessToken();
    } catch (e) {
      clearGoogleToken();
    }
  };

  return (
    <div>
      <Button onClick={handleLogin} variant={"default"}>
        <Sparkle /> Allow Access
      </Button>
    </div>
  );
}
