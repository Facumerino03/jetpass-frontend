import * as React from "react";

import {
  getCurrentUser,
  loginPilot,
  logoutPilot,
  registerPilot,
} from "./auth-api";
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
} from "./session-storage";
import type { AuthSession, PilotRegisterRequest, UserPublic } from "./types";

type AuthContextValue = {
  isLoading: boolean;
  session: AuthSession | null;
  user: UserPublic | null;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: Omit<PilotRegisterRequest, "device_name">) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [session, setSession] = React.useState<AuthSession | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const storedSession = await readStoredSession();

      if (!isMounted) {
        return;
      }

      if (!storedSession) {
        setIsLoading(false);
        return;
      }

      try {
        const user = await getCurrentUser(storedSession.access_token);
        const nextSession = { ...storedSession, user };
        await writeStoredSession(nextSession);

        if (isMounted) {
          setSession(nextSession);
        }
      } catch {
        await clearStoredSession();
        if (isMounted) {
          setSession(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = React.useCallback(
    async (input: { email: string; password: string }) => {
      const nextSession = await loginPilot(input);
      await writeStoredSession(nextSession);
      setSession(nextSession);
    },
    [],
  );

  const register = React.useCallback(
    async (input: Omit<PilotRegisterRequest, "device_name">) => {
      const nextSession = await registerPilot(input);
      await writeStoredSession(nextSession);
      setSession(nextSession);
    },
    [],
  );

  const logout = React.useCallback(async () => {
    const refreshToken = session?.refresh_token;

    setSession(null);
    await clearStoredSession();

    if (!refreshToken) {
      return;
    }

    try {
      await logoutPilot(refreshToken);
    } catch {
      // Local logout must succeed even if the revoke request fails.
    }
  }, [session?.refresh_token]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      isLoading,
      session,
      user: session?.user ?? null,
      login,
      register,
      logout,
    }),
    [isLoading, login, logout, register, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
