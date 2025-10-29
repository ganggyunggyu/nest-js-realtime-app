declare module "@tanstack/react-query" {
  import type React from "react";

  export interface QueryClientConfig {
    defaultOptions?: Record<string, unknown>;
    logger?: Record<string, unknown>;
  }

  export class QueryClient {
    constructor(config?: QueryClientConfig);
  }

  export const QueryClientProvider: React.FC<{
    client: QueryClient;
    children?: React.ReactNode;
  }>;

  export interface UseMutationResult<TData = unknown, TError = unknown, TVariables = void, TContext = unknown> {
    mutate: (variables: TVariables) => void;
    mutateAsync: (variables: TVariables) => Promise<TData>;
    isPending: boolean;
    data?: TData;
    error?: TError;
    context?: TContext;
  }

  export function useMutation<TData = unknown, TError = unknown, TVariables = void, TContext = unknown>(options: Record<string, unknown>): UseMutationResult<TData, TError, TVariables, TContext>;
}
