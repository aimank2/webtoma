"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

type SheetContextType = {
  sheetId: string | null;
  title: string | null;
  setSheet: (sheetId: string, title: string) => void;
  clearSheet: () => void;
};

const SheetContext = createContext<SheetContextType | undefined>(undefined);

export function SheetProvider({ children }: { children: ReactNode }) {
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);

  const setSheet = (id: string, title: string) => {
    setSheetId(id);
    setTitle(title);
  };

  const clearSheet = () => {
    setSheetId(null);
    setTitle(null);
  };

  return (
    <SheetContext.Provider value={{ sheetId, title, setSheet, clearSheet }}>
      {children}
    </SheetContext.Provider>
  );
}

export function useSheetContext() {
  const ctx = useContext(SheetContext);
  if (!ctx)
    throw new Error("useSheetContext must be used within SheetProvider");
  return ctx;
}
