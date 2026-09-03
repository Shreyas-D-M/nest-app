import {
  API_PREFIX,
  AUTHORIZATION_HEADER,
  BEARER_PREFIX,
  type AuthSession,
  type CurrentUser,
  type LivenessResponse,
  type ProfessionalJobView,
  type AvailabilityWindow,
  type ProfessionalServiceOffering,
  type ProfessionalProfile,
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
): Promise<{ expiresInSeconds: number; retryAfterSeconds: number; devOtp?: string }> {
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

// ---------------------------------------------------------------------------
// Job Management
// ---------------------------------------------------------------------------

export async function listProfessionalJobs(status?: string): Promise<{
  data: ProfessionalJobView[];
  total: number;
}> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiFetch<{ data: ProfessionalJobView[]; total: number }>(
    `${API_PREFIX}/bookings/professional/jobs${query}`,
  );
}

export async function getProfessionalJob(id: string): Promise<ProfessionalJobView> {
  return apiFetch<ProfessionalJobView>(`${API_PREFIX}/bookings/professional/jobs/${id}`);
}

export async function acceptJob(id: string, estimatedMinutes?: number): Promise<ProfessionalJobView> {
  return apiFetch<ProfessionalJobView>(`${API_PREFIX}/bookings/professional/jobs/${id}/accept`, {
    method: 'POST',
    body: JSON.stringify({ estimatedMinutes }),
  });
}

export async function declineJob(id: string, reason?: string): Promise<ProfessionalJobView> {
  return apiFetch<ProfessionalJobView>(`${API_PREFIX}/bookings/professional/jobs/${id}/decline`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason ?? 'Unavailable for this time slot' }),
  });
}

export async function markJobArrived(id: string): Promise<ProfessionalJobView> {
  return apiFetch<ProfessionalJobView>(`${API_PREFIX}/bookings/professional/jobs/${id}/arrived`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function startJob(id: string): Promise<ProfessionalJobView> {
  return apiFetch<ProfessionalJobView>(`${API_PREFIX}/bookings/professional/jobs/${id}/start`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function proposeExtraWork(
  id: string,
  dto: { description: string; amountMinor: number; evidenceUrls?: string[] },
): Promise<ProfessionalJobView> {
  return apiFetch<ProfessionalJobView>(`${API_PREFIX}/bookings/professional/jobs/${id}/extra-work`, {
    method: 'POST',
    body: JSON.stringify({
      description: dto.description,
      amountMinor: dto.amountMinor,
      evidenceUrls: dto.evidenceUrls ?? [],
    }),
  });
}

export async function completeJob(id: string): Promise<ProfessionalJobView> {
  return apiFetch<ProfessionalJobView>(`${API_PREFIX}/bookings/professional/jobs/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

// ---------------------------------------------------------------------------
// Storefront & Availability
// ---------------------------------------------------------------------------

export async function getProfessionalProfile(): Promise<ProfessionalProfile> {
  return apiFetch<ProfessionalProfile>(`${API_PREFIX}/professional/profile`);
}

export async function updateProfessionalProfile(dto: {
  businessName?: string;
  bio?: string;
  yearsExperience?: number;
}): Promise<ProfessionalProfile> {
  return apiFetch<ProfessionalProfile>(`${API_PREFIX}/professional/profile`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export async function setProfessionalStatus(
  onlineStatus: 'ONLINE' | 'OFFLINE',
): Promise<ProfessionalProfile> {
  return apiFetch<ProfessionalProfile>(`${API_PREFIX}/professional/status`, {
    method: 'POST',
    body: JSON.stringify({ onlineStatus }),
  });
}

export async function listProfessionalServices(): Promise<ProfessionalServiceOffering[]> {
  return apiFetch<ProfessionalServiceOffering[]>(`${API_PREFIX}/professional/services`);
}

export async function replaceProfessionalServices(
  services: Array<{ serviceId: string; basePriceMinor: number; pricingType: string }>,
): Promise<ProfessionalServiceOffering[]> {
  return apiFetch<ProfessionalServiceOffering[]>(`${API_PREFIX}/professional/services`, {
    method: 'PUT',
    body: JSON.stringify({ services }),
  });
}

export async function getProfessionalAvailability(): Promise<AvailabilityWindow[]> {
  return apiFetch<AvailabilityWindow[]>(`${API_PREFIX}/professional/availability`);
}

export async function replaceProfessionalAvailability(
  windows: AvailabilityWindow[],
): Promise<AvailabilityWindow[]> {
  return apiFetch<AvailabilityWindow[]>(`${API_PREFIX}/professional/availability`, {
    method: 'PUT',
    body: JSON.stringify({ windows }),
  });
}

// ---------------------------------------------------------------------------
// Core HTTP Fetch Wrapper
// ---------------------------------------------------------------------------

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
