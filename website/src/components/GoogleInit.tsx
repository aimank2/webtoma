"use client";

import { Button } from "./ui/button";
import { useGoogleToken } from "@/context/GoogleTokenContext";
import { Sparkle } from "lucide-react";

export default function GoogleInit() {
  const { setGoogleToken, clearGoogleToken } = useGoogleToken();

  const handleLogin = () => {
    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
      if (!clientId) throw new Error("❌ Missing Google Client ID");

      if (!(window as any).google?.accounts?.oauth2) {
        throw new Error("❌ Google OAuth2 not available on window.");
      }

      const tokenClient = (
        window as any
      ).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/spreadsheets",
        callback: (tokenResponse: any) => {
          const accessToken = tokenResponse?.access_token;

          if (accessToken) {
            console.log("✅ Access Token:", accessToken);
            setGoogleToken(accessToken); // Save to context & sessionStorage
          } else {
            console.error(
              "❌ Token response missing access_token",
              tokenResponse
            );
            clearGoogleToken();
          }
        },
      });

      tokenClient.requestAccessToken();
    } catch (error) {
      console.error("🛑 Google Auth error:", error);
      clearGoogleToken();
    }
  };

  return (
    <div>
      <Button onClick={handleLogin} variant={"default"}>
        <Sparkle className="mr-2 h-4 w-4" />
        Allow Access
      </Button>
    </div>
  );
}
