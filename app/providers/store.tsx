"use client";

import React from "react";
import { Provider as JotaiProvider } from "jotai";

export const StoreProvider = ({ children }: { children: React.ReactNode }) => (
  <JotaiProvider>{children}</JotaiProvider>
);

