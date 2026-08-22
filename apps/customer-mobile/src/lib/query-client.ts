import { QueryClient } from '@tanstack/react-query';

/**
 * TanStack Query is the single owner of server state.
 *
 * 07_ARCHITECTURE.md is explicit that server state must not be duplicated into a
 * global store, so anything fetched from the API stays in this cache and local
 * state is reserved for UI concerns.
 *
 * Defaults chosen for a mobile network:
 *   staleTime  — avoids refetching on every screen focus over a slow connection.
 *   retry      — two retries absorbs a transient drop without hanging the UI.
 *   Mutations are NOT retried by default: replaying a booking or payment command
 *   is exactly the failure mode idempotency keys exist to prevent, so retries
 *   must be opted into per mutation once those endpoints exist.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 2,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
