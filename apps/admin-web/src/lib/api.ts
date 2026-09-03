import {
  API_PREFIX,
  AUTHORIZATION_HEADER,
  BEARER_PREFIX,
  type AuthSession,
  type CatalogResponse,
} from '@nest/types';
import { clearSession, ensureAdminSession, getStoredSession } from './auth';

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
    pendingCount?: number;
    failedCount?: number;
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

export interface AdminBookingItem {
  id: string;
  status: string;
  scheduledStart: string;
  scheduledEnd: string;
  estimatedAmountMinor: number;
  finalAmountMinor: number | null;
  customer?: {
    id?: string;
    name?: string | null;
    phone?: string;
  };
  professional?: {
    id?: string;
    professional?: {
      businessName?: string | null;
    };
  };
  service?: {
    id?: string;
    name?: string;
    categoryName?: string;
  };
  address?: {
    locality?: string;
    city?: string;
    addressLine?: string;
  };
}

export interface AdminPaymentItem {
  id: string;
  bookingId: string;
  amountMinor: number;
  status: string;
  provider: string;
  providerPaymentId?: string | null;
  createdAt: string;
  booking?: {
    service?: { name?: string };
    customer?: { name?: string };
  };
}

export interface AdminAuditItem {
  id: string;
  action: string;
  actorType: string;
  actorId?: string | null;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface AdminSupportTicketItem {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  customer?: { name?: string; phone?: string };
}

async function apiFetch<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  let session = getStoredSession();
  if (!session?.tokens.accessToken) {
    session = await ensureAdminSession();
  }

  const headers = new Headers(init.headers ?? {});

  if (!headers.has('Content-Type') && init.body !== undefined && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (session?.tokens.accessToken) {
    headers.set(AUTHORIZATION_HEADER, `${BEARER_PREFIX} ${session.tokens.accessToken}`);
  }

  let response = await fetch(`${apiBaseUrl}${endpoint}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  // If 401 occurs, clear token and retry with refreshed session
  if (response.status === 401) {
    clearSession();
    session = await ensureAdminSession();
    if (session?.tokens.accessToken) {
      headers.set(AUTHORIZATION_HEADER, `${BEARER_PREFIX} ${session.tokens.accessToken}`);
      response = await fetch(`${apiBaseUrl}${endpoint}`, {
        ...init,
        headers,
        cache: 'no-store',
      });
    }
  }

  const isEmpty = response.status === 204 || response.headers.get('content-length') === '0';
  const payload = isEmpty ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.error?.message ?? `Request failed (${response.status})`;
    throw new Error(message);
  }

  return (payload ?? (undefined as T)) as T;
}

// ---------------------------------------------------------------------------
// Stats & Overview
// ---------------------------------------------------------------------------

export async function getAdminStats(): Promise<AdminStatsResponse> {
  return apiFetch<AdminStatsResponse>(`${API_PREFIX}/admin/stats`);
}

// ---------------------------------------------------------------------------
// Professionals & Verification
// ---------------------------------------------------------------------------

export async function listAdminProfessionals(status?: string): Promise<AdminProfessionalsResponse> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiFetch<AdminProfessionalsResponse>(`${API_PREFIX}/admin/professionals${query}`);
}

export async function getAdminProfessional(id: string): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>(`${API_PREFIX}/admin/professionals/${id}`);
}

export async function approveProfessional(id: string, notes?: string): Promise<unknown> {
  return apiFetch(`${API_PREFIX}/admin/professionals/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ notes: notes ?? 'Verification approved by Operations' }),
  });
}

export async function rejectProfessional(id: string, reason: string): Promise<unknown> {
  return apiFetch(`${API_PREFIX}/admin/professionals/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function requestChangesProfessional(id: string, reason: string): Promise<unknown> {
  return apiFetch(`${API_PREFIX}/admin/professionals/${id}/request-changes`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function getProfessionalDocuments(id: string): Promise<Record<string, string>> {
  return apiFetch<Record<string, string>>(`${API_PREFIX}/admin/professionals/${id}/documents`);
}

// ---------------------------------------------------------------------------
// Bookings Management
// ---------------------------------------------------------------------------

export async function listAdminBookings(status?: string): Promise<{ items: AdminBookingItem[]; total: number }> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiFetch<{ items: AdminBookingItem[]; total: number }>(`${API_PREFIX}/admin/bookings${query}`);
}

export async function cancelAdminBooking(id: string, reason: string): Promise<unknown> {
  return apiFetch(`${API_PREFIX}/admin/bookings/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

// ---------------------------------------------------------------------------
// Catalog & Services
// ---------------------------------------------------------------------------

export async function getServices(): Promise<CatalogResponse> {
  return apiFetch<CatalogResponse>(`${API_PREFIX}/services`);
}

export async function listAdminServices(): Promise<unknown[]> {
  return apiFetch<unknown[]>(`${API_PREFIX}/admin/services`);
}

export async function createAdminService(input: {
  name: string;
  categoryId: string;
  description?: string;
  basePriceMinor: number;
}): Promise<unknown> {
  return apiFetch(`${API_PREFIX}/admin/services`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateAdminService(
  id: string,
  input: Partial<{ name: string; description: string; basePriceMinor: number; active: boolean }>,
): Promise<unknown> {
  return apiFetch(`${API_PREFIX}/admin/services/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

// ---------------------------------------------------------------------------
// Payments & Refunds
// ---------------------------------------------------------------------------

export async function listAdminPayments(status?: string): Promise<{ items: AdminPaymentItem[]; total: number }> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiFetch<{ items: AdminPaymentItem[]; total: number }>(`${API_PREFIX}/admin/payments${query}`);
}

export async function refundAdminPayment(
  id: string,
  body: { amountMinor?: number; reason: string },
): Promise<unknown> {
  return apiFetch(`${API_PREFIX}/admin/payments/${id}/refund`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Support & Audit Logs
// ---------------------------------------------------------------------------

export async function listAdminSupportTickets(): Promise<{ data: AdminSupportTicketItem[]; total: number }> {
  return apiFetch<{ data: AdminSupportTicketItem[]; total: number }>(`${API_PREFIX}/support/admin/tickets`);
}

export async function getAdminSupportStats(): Promise<{
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  avgResolutionTimeHours: number | null;
  ticketsByCategory: Record<string, number>;
  ticketsByPriority: Record<string, number>;
}> {
  return apiFetch(`${API_PREFIX}/support/admin/stats`);
}

export async function listAdminAuditLogs(): Promise<{ items: AdminAuditItem[]; total: number }> {
  return apiFetch<{ items: AdminAuditItem[]; total: number }>(`${API_PREFIX}/admin/audit-logs`);
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
