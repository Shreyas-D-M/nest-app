import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import type { AuthSession, CurrentUser } from '@nest/types';
import { clearSession, getStoredSession, saveSession } from './auth-store';

interface AuthContextValue {
  session: AuthSession | null;
  user: CurrentUser | null;
  isLoading: boolean;
  setSession: (session: AuthSession) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void getStoredSession()
      .then((stored) => {
        if (mounted) {
          setSessionState(stored);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const setSession = useCallback(async (newSession: AuthSession) => {
    await saveSession(newSession);
    setSessionState(newSession);
  }, []);

  const signOut = useCallback(async () => {
    await clearSession();
    setSessionState(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      setSession,
      signOut,
    }),
    [session, isLoading, setSession, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
