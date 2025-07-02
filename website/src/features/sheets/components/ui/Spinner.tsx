import { Loader2 } from "lucide-react";
import React from "react";

export function Spinner({ size = "sm", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = {
    sm: 16,
    md: 24,
    lg: 32,
  };
  return (
    <Loader2
      className={`animate-spin text-muted-foreground ${className}`}
      size={sizes[size] || 16}
      strokeWidth={2.5}
    />
  );
}