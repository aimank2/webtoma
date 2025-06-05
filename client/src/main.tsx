import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { HashRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // Import QueryClient and Provider

// Create a client
const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <QueryClientProvider client={queryClient}> {/* Wrap AuthProvider (and App) with QueryClientProvider */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </HashRouter>
  </StrictMode>
);
