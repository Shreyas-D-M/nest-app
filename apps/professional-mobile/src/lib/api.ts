import {
  API_PREFIX,
  AUTHORIZATION_HEADER,
  BEARER_PREFIX,
  type AuthSession,
  type CurrentUser,
  type LivenessResponse,
  type ProfessionalJobView,
} from '@nest/types';
import { getStoredSession } from './auth-store';

export const apiBaseUrl = process.env['EXPO_PUBLIC_API_BASE_URL'] ?? 'http://localhost:3000';
export const apiUrl = `${apiBaseUrl}${API_PREFIX}`;

const REQUEST_TIMEOUT_MS = 10_000;

export async function fetchApiLiveness(): Promise<LivenessResponse> {
  return apiFetch<LivenessResponse>(`${API_PREFIX}/health`, { method: 'GET' });
}

export async function requestOtp(
  phone: string,
): Promise<{ expiresInSeconds: number; retryAfterSeconds: number }> {
  return apiFetch(`${API_PREFIX}/auth/otp/request`, {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export async function verifyOtp(phone: string, code: string): Promise<AuthSession> {
  return apiFetch<AuthSession>(`${API_PREFIX}/auth/otp/verify`, {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
}

export async function getCurrentSessionUser(): Promise<CurrentUser | null> {
  const session = await getStoredSession();
  return session?.user ?? null;
}

export async function listProfessionalJobs(): Promise<{
  data: ProfessionalJobView[];
  total: number;
}> {
  return apiFetch<{ data: ProfessionalJobView[]; total: number }>(
    `${API_PREFIX}/bookings/professional/jobs`,
  );
}

export async function getProfessionalProfile(): Promise<{
  id: string;
  businessName: string;
  bio: string | null;
  yearsExperience: number;
  verificationStatus: string;
  onlineStatus: string;
  completedJobs: number;
  reviewNotes: string | null;
  reviewedAt: string | null;
  services: Array<{
    serviceId: string;
    serviceName: string;
    pricingType: string;
    basePriceMinor: number;
  }>;
  serviceAreas: Array<{ locality: string; pincode: string }>;
  availability: Array<{ weekday: number; startMinute: number; endMinute: number }>;
  documents: Array<{
    id: string;
    documentType: string;
    verificationStatus: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}> {
  return apiFetch(`${API_PREFIX}/professional/profile`);
}

export async function listProfessionalServices(): Promise<
  Array<{ serviceId: string; serviceName: string; pricingType: string; basePriceMinor: number }>
> {
  return apiFetch<
    Array<{ serviceId: string; serviceName: string; pricingType: string; basePriceMinor: number }>
  >(`${API_PREFIX}/professional/services`);
}

export async function apiFetch<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const session = await getStoredSession();
  const headers = new Headers(init.headers ?? {});

  if (!headers.has('Content-Type') && init.body !== undefined && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (session?.tokens.accessToken) {
    headers.set(AUTHORIZATION_HEADER, `${BEARER_PREFIX} ${session.tokens.accessToken}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const abortFromCaller = () => controller.abort();
  init.signal?.addEventListener('abort', abortFromCaller, { once: true });

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${endpoint}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
    init.signal?.removeEventListener('abort', abortFromCaller);
  }

  const isEmpty = response.status === 204 || response.headers.get('content-length') === '0';
  const payload = isEmpty ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.error?.message ?? `Request failed (${response.status})`;
    throw new Error(message);
  }

  return (payload ?? (undefined as T)) as T;
}
