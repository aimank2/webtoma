"use client";
import { GoogleTokenProvider } from "@/context/GoogleTokenContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <GoogleTokenProvider>
        <GoogleOAuthProvider
          clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}
        >
          {children}
        </GoogleOAuthProvider>
      </GoogleTokenProvider>
    </QueryClientProvider>
  );
}
