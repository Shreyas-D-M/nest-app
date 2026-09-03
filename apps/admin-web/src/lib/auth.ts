import type { AuthSession, CurrentUser } from '@nest/types';

const SESSION_KEY = 'nest.admin.session';
export const DEFAULT_ADMIN_PHONE = '+919999999999';

export type StoredSession = AuthSession & { expiresAt: number };

export function getStoredSession(): StoredSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredSession;
    if (parsed.expiresAt && Date.now() >= parsed.expiresAt) {
      window.localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession): void {
  if (typeof window === 'undefined') return;

  const payload: StoredSession = {
    ...session,
    expiresAt: Date.now() + session.tokens.expiresInSeconds * 1000,
  };

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): CurrentUser | null {
  return getStoredSession()?.user ?? null;
}

export async function ensureAdminSession(): Promise<StoredSession | null> {
  const existing = getStoredSession();
  if (existing) {
    return existing;
  }

  // In development, automatically authenticate with the seeded admin operator
  try {
    const apiBase = process.env['NEXT_PUBLIC_API_BASE_URL'] ?? 'http://localhost:3000';
    const otpRes = await fetch(`${apiBase}/api/v1/auth/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: DEFAULT_ADMIN_PHONE }),
    });

    if (!otpRes.ok) return null;
    const otpData = (await otpRes.json()) as { devOtp?: string };
    const code = otpData.devOtp ?? '123456';

    const verifyRes = await fetch(`${apiBase}/api/v1/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: DEFAULT_ADMIN_PHONE, code }),
    });

    if (!verifyRes.ok) return null;
    const session = (await verifyRes.json()) as AuthSession;
    saveSession(session);
    return getStoredSession();
  } catch {
    return null;
  }
}

