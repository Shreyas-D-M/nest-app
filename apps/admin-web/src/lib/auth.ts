import type { AuthSession, CurrentUser } from '@nest/types';

const SESSION_KEY = 'nest.admin.session';

export type StoredSession = AuthSession & { expiresAt: number };

export function getStoredSession(): StoredSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredSession;
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
