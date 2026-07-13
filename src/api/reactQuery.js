// src/api/queryClient.js
import { QueryClient } from "@tanstack/react-query";

export const reactQuery = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // data stays fresh 5 min — no refetch on remount
      gcTime: 1000 * 60 * 30, // cache kept in memory 30 min after last use
      retry: 2,
      refetchOnWindowFocus: false, // monday data doesn't change that fast
    },
  },
});
window.__TANSTACK_QUERY_CLIENT__ = reactQuery;
