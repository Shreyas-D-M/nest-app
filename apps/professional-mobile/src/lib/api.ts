import { API_PREFIX, type LivenessResponse } from '@nest/types';

/**
 * Minimal API access for the foundation build.
 *
 * Only the health endpoint is called — it is the one endpoint that exists. A
 * proper typed client (auth headers, error-envelope parsing, retry policy) will
 * be introduced as a shared package when there are real endpoints to consume;
 * building it now would mean guessing at contracts that are still unwritten.
 */

/** EXPO_PUBLIC_* variables are inlined into the bundle and are therefore public. */
export const apiBaseUrl = process.env['EXPO_PUBLIC_API_BASE_URL'] ?? 'http://localhost:3000';

export const apiUrl = `${apiBaseUrl}${API_PREFIX}`;

const REQUEST_TIMEOUT_MS = 5_000;

export async function fetchApiLiveness(): Promise<LivenessResponse> {
  const response = await fetch(`${apiUrl}/health`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return (await response.json()) as LivenessResponse;
}
