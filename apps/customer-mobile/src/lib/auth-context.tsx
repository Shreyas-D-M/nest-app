import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { logoutApi } from './api';
import { clearSession, getStoredSession, type StoredAuthSession } from './auth-store';

type AuthContextValue = {
  isReady: boolean;
  session: StoredAuthSession | null;
  completeSignIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children, onSignOut }: { children: ReactNode; onSignOut: () => void }): ReactNode {
  const [session, setSession] = useState<StoredAuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);
  const operationRef = useRef(0);

  useEffect(() => {
    const operation = ++operationRef.current;
    void getStoredSession().then((stored) => {
      if (operation === operationRef.current) {
        setSession(stored);
        setIsReady(true);
      }
    });
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    isReady,
    session,
    completeSignIn: async () => {
      operationRef.current += 1;
      const stored = await getStoredSession();
      setSession(stored);
      setIsReady(true);
    },
    signOut: async () => {
      operationRef.current += 1;
      try {
        await logoutApi();
      } catch {
        await clearSession();
      }
      setSession(null);
      setIsReady(true);
      onSignOut();
    },
  }), [isReady, onSignOut, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
