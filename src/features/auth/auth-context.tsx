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

let globalLogoutInProgress = false;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [session, setSession] = React.useState<AuthSession | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const storedSession = await readStoredSession();

        if (!isMounted) return;

        if (!storedSession) {
          setIsLoading(false);
          return;
        }

        if (!storedSession.access_token) {
          await clearStoredSession();
          if (isMounted) setIsLoading(false);
          return;
        }

        try {
          const user = await getCurrentUser(storedSession.access_token);
          const nextSession = { ...storedSession, user };
          await writeStoredSession(nextSession);
          if (isMounted) setSession(nextSession);
        } catch (error) {
          console.log("[Auth] Session restore failed, clearing:", error);
          await clearStoredSession();
          if (isMounted) setSession(null);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      } catch (error) {
        console.error("[Auth] Unexpected error during restore:", error);
        if (isMounted) setIsLoading(false);
      }
    }

    restoreSession();
    return () => { isMounted = false; };
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
    if (globalLogoutInProgress) {
      console.log("[Auth] Logout already in progress, skipping");
      return;
    }

    globalLogoutInProgress = true;
    const currentSession = session;

    console.log("[Auth] Starting logout...");

    try {
      console.log("[Auth] Clearing storage...");
      await clearStoredSession();
      console.log("[Auth] Storage cleared, setting session to null...");

      setSession(null);

      if (currentSession?.refresh_token) {
        try {
          console.log("[Auth] Revoking token on backend...");
          await logoutPilot(currentSession.refresh_token);
          console.log("[Auth] Token revoked successfully");
        } catch (error) {
          console.log("[Auth] Backend logout failed (ignored):", error);
        }
      }

      console.log("[Auth] Logout complete");
    } catch (error) {
      console.error("[Auth] Logout error:", error);
      setSession(null);
    } finally {
      globalLogoutInProgress = false;
    }
  }, [session]);

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
