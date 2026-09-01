import {
  API_PREFIX,
  AUTHORIZATION_HEADER,
  BEARER_PREFIX,
  type AuthSession,
  type CatalogResponse,
  type CurrentUser,
  type CustomerBookingView,
  type LivenessResponse,
  type PublicProfessional,
  type ProfessionalAvailabilityResponse,
  type ServiceRequestView,
} from '@nest/types';
import { clearSession, getStoredSession, isAccessTokenExpired, saveSession, type StoredAuthSession } from './auth-store';

/** EXPO_PUBLIC_* variables are inlined into the bundle and are therefore public. */
export const apiBaseUrl = process.env['EXPO_PUBLIC_API_BASE_URL'] ?? 'http://localhost:3000';
export const apiUrl = `${apiBaseUrl}${API_PREFIX}`;

const REQUEST_TIMEOUT_MS = 10_000;
const ACCESS_TOKEN_REFRESH_SKEW_MS = 60_000;

let refreshInFlight: Promise<StoredAuthSession | null> | null = null;

export type ApiEnvelope<T> = { data: T; total?: number };

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

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
  const session = await apiFetch<AuthSession>(`${API_PREFIX}/auth/otp/verify`, {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
  await saveSession(session);
  return session;
}

async function refreshStoredSession(): Promise<StoredAuthSession | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const session = await getStoredSession();
    if (!session) return null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${apiBaseUrl}${API_PREFIX}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.tokens.refreshToken }),
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.tokens?.accessToken) {
        await clearSession();
        return null;
      }
      await saveSession(payload as AuthSession);
      return getStoredSession();
    } catch {
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

async function getAuthenticatedSession(): Promise<StoredAuthSession | null> {
  const session = await getStoredSession();
  if (!session) return null;
  if (!isAccessTokenExpired(session, Date.now() + ACCESS_TOKEN_REFRESH_SKEW_MS)) return session;
  return refreshStoredSession();
}

export async function getCurrentSessionUser(): Promise<CurrentUser | null> {
  const session = await getStoredSession();
  return session?.user ?? null;
}

export async function getServices(): Promise<CatalogResponse> {
  return apiFetch<CatalogResponse>(`${API_PREFIX}/services`);
}

export async function transcribeAudio(uri: string, signal?: AbortSignal): Promise<{ transcript: string }> {
  const formData = new FormData();
  // React Native's FormData understands this native file descriptor. Fetching
  // the URI into a browser Blob is unreliable on physical Expo devices.
  formData.append('audio', {
    uri,
    name: `voice-${Date.now()}.m4a`,
    type: 'audio/m4a',
  } as unknown as Blob);

  const payload = await apiFetch<{ transcript?: string }>(`${API_PREFIX}/service-requests/transcribe`, {
    method: 'POST',
    body: formData,
    signal,
  });

  const transcript = typeof payload?.transcript === 'string' ? payload.transcript.trim() : '';
  if (!transcript) {
    throw new ApiRequestError("We couldn't understand that recording. Please try again.");
  }

  return { transcript };
}

export async function uploadServiceRequestAttachment(
  requestId: string,
  uri: string,
  kind: 'image' | 'audio',
): Promise<void> {
  if (kind === 'audio') {
    return;
  }

  const fileName = `nest-photo-${Date.now()}.jpg`;

  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Unable to read the selected ${kind}.`);
  }

  const blob = await response.blob();
  const formData = new FormData();
  formData.append('file', blob, fileName);

  const session = await getStoredSession();
  const headers = new Headers();
  if (session?.tokens.accessToken) {
    headers.set(AUTHORIZATION_HEADER, `${BEARER_PREFIX} ${session.tokens.accessToken}`);
  }

  const uploadResponse = await fetch(`${apiBaseUrl}${API_PREFIX}/service-requests/${requestId}/attachments`, {
    method: 'POST',
    body: formData,
    headers,
  });

  if (!uploadResponse.ok) {
    const payload = await uploadResponse.json().catch(() => null);
    throw new Error(payload?.error?.message ?? `Unable to upload the ${kind}.`);
  }
}

export async function getProfessional(id: string): Promise<PublicProfessional> {
  return apiFetch<PublicProfessional>(`${API_PREFIX}/professionals/${id}`);
}

export async function getAvailability(id: string): Promise<ProfessionalAvailabilityResponse> {
  return apiFetch<ProfessionalAvailabilityResponse>(
    `${API_PREFIX}/professionals/${id}/availability`,
  );
}

export async function createServiceRequest(input: {
  rawText: string;
  addressId?: string | null;
  voiceUrl?: string | null;
  media?: string[] | null;
}): Promise<ServiceRequestView> {
  return apiFetch<ServiceRequestView>(`${API_PREFIX}/service-requests`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function listCustomerBookings(): Promise<{
  data: CustomerBookingView[];
  total: number;
}> {
  return apiFetch<{ data: CustomerBookingView[]; total: number }>(`${API_PREFIX}/bookings`);
}

export async function listHomes(): Promise<
  Array<{
    id: string;
    name: string;
    addressId: string | null;
    createdAt: string;
    updatedAt: string;
  }>
> {
  return apiFetch<
    Array<{
      id: string;
      name: string;
      addressId: string | null;
      createdAt: string;
      updatedAt: string;
    }>
  >(`${API_PREFIX}/homes`);
}

export async function listHomeAssets(homeId: string): Promise<
  Array<{
    id: string;
    assetType: string;
    brand: string | null;
    model: string | null;
    serialNumber: string | null;
    warrantyEnd: string | null;
    notes: string | null;
    imageUrl: string | null;
  }>
> {
  return apiFetch<
    Array<{
      id: string;
      assetType: string;
      brand: string | null;
      model: string | null;
      serialNumber: string | null;
      warrantyEnd: string | null;
      notes: string | null;
      imageUrl: string | null;
    }>
  >(`${API_PREFIX}/homes/${homeId}/assets`);
}

export async function listSupportTickets(): Promise<{
  data: Array<{
    id: string;
    subject: string;
    status: string;
    priority: string;
    createdAt: string;
    description?: string;
    customer?: { name?: string | null };
  }>;
  total: number;
}> {
  return apiFetch<{
    data: Array<{
      id: string;
      subject: string;
      status: string;
      priority: string;
      createdAt: string;
      description?: string;
      customer?: { name?: string | null };
    }>;
    total: number;
  }>(`${API_PREFIX}/support/tickets`);
}

export async function listFavorites(): Promise<
  Array<{ id: string; professional: { id: string; businessName: string; bio: string | null } }>
> {
  return apiFetch<
    Array<{ id: string; professional: { id: string; businessName: string; bio: string | null } }>
  >(`${API_PREFIX}/favorites`);
}

export async function listNotifications(): Promise<{
  notifications: Array<{
    id: string;
    title: string;
    body: string;
    readAt: string | null;
    createdAt: string;
  }>;
  total: number;
  unreadCount: number;
}> {
  return apiFetch<{
    notifications: Array<{
      id: string;
      title: string;
      body: string;
      readAt: string | null;
      createdAt: string;
    }>;
    total: number;
    unreadCount: number;
  }>(`${API_PREFIX}/notifications`);
}

export async function apiFetch<T>(endpoint: string, init: RequestInit = {}, retriedAfterRefresh = false): Promise<T> {
  const isPublic = endpoint.startsWith(`${API_PREFIX}/auth/`) || endpoint === `${API_PREFIX}/health`;
  const session = isPublic ? null : await getAuthenticatedSession();
  if (!session && !isPublic) {
    throw new ApiRequestError('Your session has expired. Please sign in again.', 401);
  }
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

  try {
    const response = await fetch(`${apiBaseUrl}${endpoint}`, {
      ...init,
      headers,
      signal: controller.signal,
    });

    const isEmpty = response.status === 204 || response.headers.get('content-length') === '0';
    const payload = isEmpty ? null : await response.json().catch(() => null);

    if (!response.ok) {
      const message = payload?.error?.message ?? `Request failed (${response.status})`;
      if (response.status === 401 && !isPublic && !retriedAfterRefresh) {
        const refreshed = await refreshStoredSession();
        if (refreshed) return apiFetch<T>(endpoint, init, true);
      }
      if (response.status === 401) {
        await clearSession();
        throw new ApiRequestError('Your session has expired. Please sign in again.', response.status);
      }
      throw new ApiRequestError(message, response.status);
    }

    return (payload ?? (undefined as T)) as T;
  } finally {
    clearTimeout(timeoutId);
    init.signal?.removeEventListener('abort', abortFromCaller);
  }
}
