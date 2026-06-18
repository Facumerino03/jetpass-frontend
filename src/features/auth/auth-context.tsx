import * as React from "react";

import {
  getCurrentUser,
  loginPilot,
  logoutPilot,
  refreshAuthSession,
  registerPilot,
} from "./auth-api";
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
} from "./session-storage";
import type { AuthSession, PilotRegisterRequest, UserPublic } from "./types";

const REFRESH_BUFFER_MS = 30_000;

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

function toAuthSession(response: Omit<AuthSession, "expires_at">): AuthSession {
  return {
    ...response,
    expires_at: Date.now() + response.expires_in * 1000,
  };
}

function getRefreshDelay(session: AuthSession) {
  const expiresInMs = session.expires_in * 1000;
  const buffer = Math.min(REFRESH_BUFFER_MS, Math.max(1_000, expiresInMs / 2));

  return Math.max(1_000, session.expires_at - Date.now() - buffer);
}

function shouldRefreshSession(session: AuthSession) {
  return session.expires_at - Date.now() <= REFRESH_BUFFER_MS;
}

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
          let validSession = storedSession;

          if (!validSession.expires_at || shouldRefreshSession(validSession)) {
            const refreshedSession = await refreshAuthSession({
              refresh_token: validSession.refresh_token,
            });
            validSession = toAuthSession(refreshedSession);
          }

          const user = await getCurrentUser(validSession.access_token);
          const nextSession = { ...validSession, user };
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
      const nextSession = toAuthSession(await loginPilot(input));
      await writeStoredSession(nextSession);
      setSession(nextSession);
    },
    [],
  );

  const register = React.useCallback(
    async (input: Omit<PilotRegisterRequest, "device_name">) => {
      const nextSession = toAuthSession(await registerPilot(input));
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

  React.useEffect(() => {
    if (!session?.refresh_token) return;

    const timeout = setTimeout(async () => {
      try {
        console.log("[Auth] Refreshing access token...");
        const refreshedSession = toAuthSession(
          await refreshAuthSession({ refresh_token: session.refresh_token }),
        );
        await writeStoredSession(refreshedSession);
        setSession(refreshedSession);
        console.log("[Auth] Access token refreshed");
      } catch (error) {
        console.log("[Auth] Token refresh failed, clearing session:", error);
        await clearStoredSession();
        setSession(null);
      }
    }, getRefreshDelay(session));

    return () => clearTimeout(timeout);
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
