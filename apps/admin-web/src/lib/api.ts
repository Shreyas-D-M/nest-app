import {
  API_PREFIX,
  AUTHORIZATION_HEADER,
  BEARER_PREFIX,
  type AuthSession,
  type CatalogResponse,
} from '@nest/types';
import { getStoredSession } from './auth';

export const apiBaseUrl = process.env['NEXT_PUBLIC_API_BASE_URL'] ?? 'http://localhost:3000';

export type AdminStatsResponse = {
  users: {
    totalCustomers: number;
    totalProfessionals: number;
    professionalsByStatus: Record<string, number>;
  };
  bookings: {
    total: number;
    completed: number;
    cancelled: number;
    byStatus: Record<string, number>;
  };
  payments: {
    totalRevenueMinor: number;
    pending: number;
    failed: number;
  };
  support: {
    openTickets: number;
  };
};

export type AdminProfessionalSummary = {
  id: string;
  businessName: string;
  verificationStatus: string;
  onlineStatus: string;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminProfessionalsResponse = {
  items: AdminProfessionalSummary[];
  total: number;
  limit: number;
  offset: number;
};

async function apiFetch<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const session = getStoredSession();
  const headers = new Headers(init.headers ?? {});

  if (!headers.has('Content-Type') && init.body !== undefined && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (session?.tokens.accessToken) {
    headers.set(AUTHORIZATION_HEADER, `${BEARER_PREFIX} ${session.tokens.accessToken}`);
  }

  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  const isEmpty = response.status === 204 || response.headers.get('content-length') === '0';
  const payload = isEmpty ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.error?.message ?? `Request failed (${response.status})`;
    throw new Error(message);
  }

  return (payload ?? (undefined as T)) as T;
}

export async function getServices(): Promise<CatalogResponse> {
  return apiFetch<CatalogResponse>(`${API_PREFIX}/services`);
}

export async function getAdminStats(): Promise<AdminStatsResponse> {
  return apiFetch<AdminStatsResponse>(`${API_PREFIX}/admin/stats`);
}

export async function listAdminProfessionals(): Promise<AdminProfessionalsResponse> {
  return apiFetch<AdminProfessionalsResponse>(`${API_PREFIX}/admin/professionals`);
}

export async function listAdminBookings(): Promise<{ items: unknown[]; total: number }> {
  return apiFetch<{ items: unknown[]; total: number }>(`${API_PREFIX}/admin/bookings`);
}

export async function listAdminPayments(): Promise<{ items: unknown[]; total: number }> {
  return apiFetch<{ items: unknown[]; total: number }>(`${API_PREFIX}/admin/payments`);
}

export async function listAdminSupportTickets(): Promise<{ data: unknown[]; total: number }> {
  return apiFetch<{ data: unknown[]; total: number }>(`${API_PREFIX}/support/admin/tickets`);
}

export async function getAdminSupportStats(): Promise<{
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  avgResolutionTimeHours: number | null;
  ticketsByCategory: Record<string, number>;
  ticketsByPriority: Record<string, number>;
}> {
  return apiFetch<{
    openTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
    avgResolutionTimeHours: number | null;
    ticketsByCategory: Record<string, number>;
    ticketsByPriority: Record<string, number>;
  }>(`${API_PREFIX}/support/admin/stats`);
}

export async function listAdminAuditLogs(): Promise<{ items: unknown[]; total: number }> {
  return apiFetch<{ items: unknown[]; total: number }>(`${API_PREFIX}/admin/audit-logs`);
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
