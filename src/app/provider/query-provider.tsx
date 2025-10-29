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
  const queryClient = React.useMemo(
    () => createQueryClient(queryClientConfig),
    [queryClientConfig],
  );

  return (
    <React.Fragment>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </React.Fragment>
  );
};
