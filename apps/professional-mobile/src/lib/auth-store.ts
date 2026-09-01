import type { AuthSession, CurrentUser } from '@nest/types';

const SESSION_KEY = 'nest.professional.session';
const memoryStore = new Map<string, string>();

async function getStorage(): Promise<{
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
} | null> {
  try {
    const { getItemAsync, setItemAsync, deleteItemAsync } = await import('expo-secure-store');
    if (typeof getItemAsync === 'function') {
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

export type StoredAuthSession = AuthSession & { expiresAt: number };

export async function getStoredSession(): Promise<StoredAuthSession | null> {
  const storage = await getStorage();
  const raw = await storage?.getItem(SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredAuthSession;
    if (!parsed?.tokens?.accessToken || !parsed.user) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveSession(session: AuthSession): Promise<void> {
  const storage = await getStorage();
  const payload: StoredAuthSession = {
    ...session,
    expiresAt: Date.now() + session.tokens.expiresInSeconds * 1000,
  };
  await storage?.setItem(SESSION_KEY, JSON.stringify(payload));
}

export async function clearSession(): Promise<void> {
  const storage = await getStorage();
  await storage?.removeItem(SESSION_KEY);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getStoredSession();
  return session?.user ?? null;
}
