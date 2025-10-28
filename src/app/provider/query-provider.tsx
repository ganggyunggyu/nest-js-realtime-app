"use client";

import React from "react";
import {
  QueryClient,
  QueryClientProvider,
  type QueryClientConfig,
} from "@tanstack/react-query";

const createQueryClient = (config?: QueryClientConfig) =>
  new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
    ...config,
  });

interface QueryProviderProps {
  children: React.ReactNode;
  queryClientConfig?: QueryClientConfig;
}

export const QueryProvider = ({
  children,
  queryClientConfig,
}: QueryProviderProps) => {
  const queryClientRef = React.useRef<QueryClient>();

  if (!queryClientRef.current) {
    queryClientRef.current = createQueryClient(queryClientConfig);
  }

  return (
    <React.Fragment>
      <QueryClientProvider client={queryClientRef.current}>
        {children}
      </QueryClientProvider>
    </React.Fragment>
  );
};
