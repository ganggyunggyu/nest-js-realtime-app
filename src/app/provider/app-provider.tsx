"use client";

import React from "react";
import { Provider as JotaiProvider } from "jotai";
import { QueryProvider } from "@/app/provider/query-provider";

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <React.Fragment>
      <QueryProvider>
        <JotaiProvider>{children}</JotaiProvider>
      </QueryProvider>
    </React.Fragment>
  );
};
