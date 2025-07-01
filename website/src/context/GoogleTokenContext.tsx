"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Type-safe token (string | null)
type GoogleTokenContextType = {
  googleToken: string | null;
  setGoogleToken: (token: string | null) => void;
  clearGoogleToken: () => void;
};

const GoogleTokenContext = createContext<GoogleTokenContextType | undefined>(undefined);

export function GoogleTokenProvider({ children }: { children: ReactNode }) {
  const [googleToken, setGoogleTokenState] = useState<string | null>(null);

  useEffect(() => {
    // On mount, check sessionStorage for previous token
    const token = sessionStorage.getItem("google_access_token");
    if (token) setGoogleTokenState(token);
  }, []);

  const setGoogleToken = (token: string | null) => {
    setGoogleTokenState(token);
    if (token) {
      sessionStorage.setItem("google_access_token", token);
    } else {
      sessionStorage.removeItem("google_access_token");
    }
  };

  const clearGoogleToken = () => setGoogleToken(null);

  return (
    <GoogleTokenContext.Provider value={{ googleToken, setGoogleToken, clearGoogleToken }}>
      {children}
    </GoogleTokenContext.Provider>
  );
}

export function useGoogleToken() {
  const ctx = useContext(GoogleTokenContext);
  if (!ctx) throw new Error("useGoogleToken must be used within GoogleTokenProvider");
  return ctx;
}