import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes cache freshness
      retry: 1, // retry once on failure
      refetchOnWindowFocus: true, // refresh when tab is focused
      refetchOnMount: "always", // always refresh in background on remount
    },
  },
});
