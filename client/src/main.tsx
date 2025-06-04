import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { HashRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext"; // Import AuthProvider

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        {" "}
        {/* Wrap App with AuthProvider */}
        <App />
      </AuthProvider>
    </HashRouter>
  </StrictMode>
);
