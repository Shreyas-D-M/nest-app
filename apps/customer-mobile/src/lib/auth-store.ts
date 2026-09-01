import type { AuthSession, CurrentUser } from '@nest/types';

const SESSION_KEY = 'nest.customer.session';
const memoryStore = new Map<string, string>();

async function getStorage(): Promise<{
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
} | null> {
  try {
    const expoSecureStore = await import('expo-secure-store');
    const getItemAsync = expoSecureStore.getItemAsync as ((key: string) => Promise<string | null>) | undefined;
    const setItemAsync = expoSecureStore.setItemAsync as ((key: string, value: string) => Promise<void>) | undefined;
    const deleteItemAsync = expoSecureStore.deleteItemAsync as ((key: string) => Promise<void>) | undefined;

    if (typeof getItemAsync === 'function' && typeof setItemAsync === 'function' && typeof deleteItemAsync === 'function') {
      return {
        getItem: (key: string) => getItemAsync(key),
        setItem: (key: string, value: string) => setItemAsync(key, value),
        removeItem: (key: string) => deleteItemAsync(key),
      };
    }
  } catch {
    // no-op: falls back to in-memory storage
  }

  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
    const storage = globalThis.localStorage;
    return {
      getItem: async (key: string) => storage.getItem(key),
      setItem: async (key: string, value: string) => {
        storage.setItem(key, value);
      },
      removeItem: async (key: string) => {
        storage.removeItem(key);
      },
    };
  }

  return {
    getItem: async (key: string) => memoryStore.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      memoryStore.set(key, value);
    },
    removeItem: async (key: string) => {
      memoryStore.delete(key);
    },
  };
}

export type StoredAuthSession = AuthSession & {
  /** Backwards-compatible alias for accessTokenExpiresAt. */
  expiresAt: number;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
};

export async function getStoredSession(): Promise<StoredAuthSession | null> {
  const storage = await getStorage();
  const raw = await storage?.getItem(SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredAuthSession>;
    if (!parsed?.tokens?.accessToken || !parsed.tokens.refreshToken || !parsed.user) {
      return null;
    }
    // Older persisted sessions only recorded the access-token expiry. Derive
    // the refresh expiry from the token TTLs issued together by the API.
    const accessTokenExpiresAt = parsed.accessTokenExpiresAt ?? parsed.expiresAt;
    const refreshTokenExpiresAt = parsed.refreshTokenExpiresAt
      ?? (typeof accessTokenExpiresAt === 'number'
        ? accessTokenExpiresAt + (parsed.tokens.refreshExpiresInSeconds - parsed.tokens.expiresInSeconds) * 1000
        : Number.NaN);
    if (!Number.isFinite(accessTokenExpiresAt) || !Number.isFinite(refreshTokenExpiresAt) || refreshTokenExpiresAt <= Date.now()) {
      await storage?.removeItem(SESSION_KEY);
      return null;
    }
    return {
      ...parsed,
      expiresAt: accessTokenExpiresAt,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    } as StoredAuthSession;
  } catch {
    return null;
  }
}

export async function saveSession(session: AuthSession): Promise<void> {
  const storage = await getStorage();
  const issuedAt = Date.now();
  const accessTokenExpiresAt = issuedAt + session.tokens.expiresInSeconds * 1000;
  const payload: StoredAuthSession = {
    ...session,
    expiresAt: accessTokenExpiresAt,
    accessTokenExpiresAt,
    refreshTokenExpiresAt: issuedAt + session.tokens.refreshExpiresInSeconds * 1000,
  };
  await storage?.setItem(SESSION_KEY, JSON.stringify(payload));
}

export function isAccessTokenExpired(session: StoredAuthSession, now = Date.now()): boolean {
  return session.accessTokenExpiresAt <= now;
}

export async function clearSession(): Promise<void> {
  const storage = await getStorage();
  await storage?.removeItem(SESSION_KEY);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getStoredSession();
  return session?.user ?? null;
}
