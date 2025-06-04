import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext"; // Adjust path if necessary

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
