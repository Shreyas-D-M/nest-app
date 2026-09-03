import {
  API_PREFIX,
  AUTHORIZATION_HEADER,
  BEARER_PREFIX,
  normalizePhoneNumber,
  type Address,
  type AuthSession,
  type CatalogResponse,
  type CreateAddressInput,
  type CurrentUser,
  type CustomerBookingView,
  type LivenessResponse,
  type OtpRequestResult,
  type PublicProfessional,
  type ProfessionalAvailabilityResponse,
  type ServiceRequestView,
  type UpdateAddressInput,
} from '@nest/types';
import { clearSession, getStoredSession, isAccessTokenExpired, saveSession, type StoredAuthSession } from './auth-store';

/** EXPO_PUBLIC_* variables are inlined into the bundle and are therefore public. */
export const apiBaseUrl = process.env['EXPO_PUBLIC_API_BASE_URL'] ?? 'http://localhost:3000';
export const apiUrl = `${apiBaseUrl}${API_PREFIX}`;

const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
const ACCESS_TOKEN_REFRESH_SKEW_MS = 60_000;

let refreshInFlight: Promise<StoredAuthSession | null> | null = null;

export type ApiEnvelope<T> = { data: T; total?: number };

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export async function checkApiLiveness(): Promise<LivenessResponse> {
  return apiFetch<LivenessResponse>(`${API_PREFIX}/health`, { method: 'GET' });
}

export async function requestOtp(phoneNumber: string): Promise<OtpRequestResult> {
  const normalized = normalizePhoneNumber(phoneNumber);
  return apiFetch<OtpRequestResult>(`${API_PREFIX}/auth/otp/request`, {
    method: 'POST',
    body: JSON.stringify({ phoneNumber: normalized }),
  });
}

export async function verifyOtp(phoneNumber: string, code: string): Promise<AuthSession> {
  const normalized = normalizePhoneNumber(phoneNumber);
  const session = await apiFetch<AuthSession>(`${API_PREFIX}/auth/otp/verify`, {
    method: 'POST',
    body: JSON.stringify({ phoneNumber: normalized, code }),
  });
  await saveSession(session);
  return session;
}

export async function logout(): Promise<void> {
  const session = await getStoredSession();
  if (session?.tokens.refreshToken) {
    try {
      await fetch(`${apiBaseUrl}${API_PREFIX}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AUTHORIZATION_HEADER]: `${BEARER_PREFIX} ${session.tokens.accessToken}`,
        },
        body: JSON.stringify({ refreshToken: session.tokens.refreshToken }),
      });
    } catch {
      // Ignore network failures on logout so the local session is always wiped
    }
  }
  await clearSession();
}

export { logout as logoutApi };

async function refreshStoredSession(): Promise<StoredAuthSession | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const current = await getStoredSession();
    if (!current?.tokens.refreshToken) {
      await clearSession();
      return null;
    }
    try {
      const response = await fetch(`${apiBaseUrl}${API_PREFIX}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: current.tokens.refreshToken }),
      });
      if (!response.ok) {
        await clearSession();
        return null;
      }
      const session = (await response.json()) as AuthSession;
      await saveSession(session);
      return getStoredSession();
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function getAuthenticatedSession(): Promise<StoredAuthSession | null> {
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

export async function transcribeAudio(
  uri: string,
  signal?: AbortSignal,
): Promise<{ transcript: string }> {
  const formData = new FormData();
  const ext = uri.split('.').pop()?.toLowerCase() || 'm4a';
  const mimeType =
    ext === 'caf' ? 'audio/x-caf' : ext === 'wav' ? 'audio/wav' : ext === 'mp4' ? 'audio/mp4' : 'audio/m4a';
  const fileName = `nest-voice-${Date.now()}.${ext === 'caf' ? 'm4a' : ext}`;

  // Ensure file URI is properly handled on iOS and Android
  formData.append('audio', {
    uri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);

  const payload = await apiFetch<{ transcript?: string }>(
    `${API_PREFIX}/service-requests/transcribe`,
    {
      method: 'POST',
      body: formData,
      signal,
      timeoutMs: 60_000,
    },
  );

  const transcript = typeof payload?.transcript === 'string' ? payload.transcript.trim() : '';
  if (!transcript) {
    throw new ApiRequestError("We couldn't transcribe that recording. Please speak clearly and try again.");
  }

  return { transcript };
}

export async function uploadServiceRequestAttachment(
  requestId: string,
  uri: string,
  kind: 'image' | 'audio' = 'image',
): Promise<ServiceRequestView> {
  if (kind === 'audio') {
    throw new Error('Audio attachments are not supported');
  }

  const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const fileName = `nest-photo-${Date.now()}.${ext === 'png' ? 'png' : ext === 'webp' ? 'webp' : 'jpg'}`;

  const formData = new FormData();
  formData.append('file', {
    uri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);

  return apiFetch<ServiceRequestView>(
    `${API_PREFIX}/service-requests/${requestId}/attachments`,
    {
      method: 'POST',
      body: formData,
      timeoutMs: 60_000,
    },
  );
}

export async function getServiceRequest(id: string): Promise<ServiceRequestView> {
  return apiFetch<ServiceRequestView>(`${API_PREFIX}/service-requests/${id}`);
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

// ---------------------------------------------------------------------------
// Address Management APIs
// ---------------------------------------------------------------------------

export async function listAddresses(): Promise<Address[]> {
  return apiFetch<Address[]>(`${API_PREFIX}/me/addresses`);
}

export async function createAddress(input: CreateAddressInput): Promise<Address> {
  return apiFetch<Address>(`${API_PREFIX}/me/addresses`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateAddress(id: string, input: UpdateAddressInput): Promise<Address> {
  return apiFetch<Address>(`${API_PREFIX}/me/addresses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteAddress(id: string): Promise<void> {
  return apiFetch<void>(`${API_PREFIX}/me/addresses/${id}`, {
    method: 'DELETE',
  });
}

// ---------------------------------------------------------------------------
// Home & Asset APIs
// ---------------------------------------------------------------------------

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
    }>;
    total: number;
  }>(`${API_PREFIX}/support/tickets`);
}

export async function listFavorites(): Promise<
  Array<{
    id: string;
    professional: {
      id: string;
      businessName: string;
      bio: string | null;
    };
    createdAt: string;
  }>
> {
  return apiFetch<
    Array<{
      id: string;
      professional: {
        id: string;
        businessName: string;
        bio: string | null;
      };
      createdAt: string;
    }>
  >(`${API_PREFIX}/favorites`);
}

export async function listNotifications(): Promise<{
  notifications: Array<{
    id: string;
    type: string;
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
      type: string;
      title: string;
      body: string;
      readAt: string | null;
      createdAt: string;
    }>;
    total: number;
    unreadCount: number;
  }>(`${API_PREFIX}/notifications`);
}

export async function apiFetch<T>(
  endpoint: string,
  init: ApiFetchOptions = {},
  retriedAfterRefresh = false,
): Promise<T> {
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

  const timeoutMs = init.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const abortFromCaller = () => controller.abort();
  init.signal?.addEventListener('abort', abortFromCaller, { once: true });

  try {
    const response = await fetch(`${apiBaseUrl}${endpoint}`, {
      ...init,
      headers,
      signal: controller.signal,
    });

    const isEmpty = response.status === 204 || response.headers?.get('content-length') === '0';
    const payload = isEmpty ? null : await response.json().catch(() => null);

    if (!response.ok) {
      const code = payload?.error?.code as string | undefined;
      const retryAfterSeconds = payload?.error?.details?.retryAfterSeconds as number | undefined;
      let message = payload?.error?.message ?? `Request failed (${response.status})`;
      if (code === 'RATE_LIMITED' && typeof retryAfterSeconds === 'number') {
        message = `Please wait ${retryAfterSeconds}s before requesting another code.`;
      }
      if (response.status === 401 && !isPublic && !retriedAfterRefresh) {
        const refreshed = await refreshStoredSession();
        if (refreshed) return apiFetch<T>(endpoint, init, true);
      }
      if (response.status === 401) {
        await clearSession();
        throw new ApiRequestError('Your session has expired. Please sign in again.', response.status, code);
      }
      throw new ApiRequestError(message, response.status, code, retryAfterSeconds);
    }

    return (payload ?? (undefined as T)) as T;
  } finally {
    clearTimeout(timeoutId);
    init.signal?.removeEventListener('abort', abortFromCaller);
  }
}
