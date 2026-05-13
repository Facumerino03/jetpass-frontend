# Auth Login/Register Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal login/register flow that authenticates against the JetPass backend, persists the session, and shows a simple authenticated home screen.

**Architecture:** Add a focused auth feature with typed API calls, persistent session storage, and an `AuthProvider` that gates the existing index route. Keep UI minimal and built from React Native Reusables-style components plus NativeWind classes.

**Tech Stack:** Expo SDK 55, Expo Router, React Native 0.83, React 19, TypeScript, NativeWind v4, React Native Reusables components, `expo-secure-store`, backend at `http://10.0.2.2:8000`.

---

## File Structure

- Create `src/components/ui/input.tsx`: React Native Reusables-style input component wrapping `TextInput` with NativeWind classes.
- Create `src/components/ui/label.tsx`: small React Native Reusables-style label component for form fields.
- Create `src/lib/api.ts`: shared JSON HTTP client with base URL, bearer header support, and readable API error messages.
- Create `src/features/auth/types.ts`: auth request/response/session/user types from `docs/openapi_backend.json`.
- Create `src/features/auth/session-storage.ts`: persistent session read/write/clear using `expo-secure-store` on native and `localStorage` on web.
- Create `src/features/auth/auth-api.ts`: auth endpoint functions for login, register, me, and logout.
- Create `src/features/auth/auth-context.tsx`: provider and hook for auth state, session restore, login, register, and logout.
- Create `src/screens/auth/index.tsx`: minimal clear login/register UI.
- Modify `src/app/_layout.tsx`: wrap the Stack with `AuthProvider`.
- Modify `src/app/index.tsx`: gate between loading, auth, and home states.
- Modify `src/screens/home/index.tsx`: replace starter card with minimal authenticated home and logout.
- Modify `package.json`: add `expo-secure-store` dependency.
- Modify `app.json` if needed after `npx expo install expo-secure-store` changes native plugin metadata. If Expo does not change it, leave it untouched.

---

### Task 1: Install Secure Session Dependency

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install `expo-secure-store` with Expo-compatible version**

Run:

```bash
npx expo install expo-secure-store
```

Expected: `expo-secure-store` is added to `dependencies` in `package.json` and `package-lock.json` is updated.

- [ ] **Step 2: Verify dependency entry**

Check that `package.json` includes an entry similar to:

```json
"expo-secure-store": "~15.0.7"
```

The exact patch version may differ because Expo selects the compatible SDK 55 version.

- [ ] **Step 3: Commit**

Run only if the user requested commits for this implementation session:

```bash
git add package.json package-lock.json
git commit -m "chore: add secure store dependency"
```

---

### Task 2: Add Reusable Form UI Components

**Files:**

- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/label.tsx`

- [ ] **Step 1: Create `Input` component**

Create `src/components/ui/input.tsx` with:

```tsx
import { cn } from "@/lib/utils";
import * as React from "react";
import { Platform, TextInput } from "react-native";

function Input({
  className,
  placeholderTextColor,
  ...props
}: React.ComponentProps<typeof TextInput> & React.RefAttributes<TextInput>) {
  return (
    <TextInput
      className={cn(
        "border-input bg-background text-foreground h-12 rounded-md border px-3 text-base",
        "placeholder:text-muted-foreground",
        props.editable === false && "opacity-50",
        Platform.select({
          web: "focus-visible:border-ring focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]",
        }),
        className,
      )}
      placeholderTextColor={placeholderTextColor ?? "hsl(240 3.8% 46.1%)"}
      {...props}
    />
  );
}

export { Input };
```

- [ ] **Step 2: Create `Label` component**

Create `src/components/ui/label.tsx` with:

```tsx
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import * as React from "react";

function Label({
  className,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<typeof Text>) {
  return (
    <Text
      className={cn("text-sm font-medium leading-none", className)}
      {...props}
    />
  );
}

export { Label };
```

- [ ] **Step 3: Run lint for new components**

Run:

```bash
npm run lint
```

Expected: lint passes or only reports pre-existing unrelated issues. If lint reports import style issues in the new files, fix those files before continuing.

- [ ] **Step 4: Commit**

Run only if the user requested commits for this implementation session:

```bash
git add src/components/ui/input.tsx src/components/ui/label.tsx
git commit -m "feat: add reusable form inputs"
```

---

### Task 3: Add Typed API Client

**Files:**

- Create: `src/lib/api.ts`

- [ ] **Step 1: Create shared API helpers**

Create `src/lib/api.ts` with:

```ts
export const API_BASE_URL = "http://10.0.2.2:8000";

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  accessToken?: string;
};

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function getValidationMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const detail = "detail" in payload ? payload.detail : null;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    const firstMessage = detail
      .map((item) => {
        if (
          item &&
          typeof item === "object" &&
          "msg" in item &&
          typeof item.msg === "string"
        ) {
          return item.msg;
        }
        return null;
      })
      .find(Boolean);

    return firstMessage ?? null;
  }

  if ("message" in payload && typeof payload.message === "string") {
    return payload.message;
  }

  return null;
}

export function getErrorMessage(
  error: unknown,
  fallback = "Ocurrio un error. Intentalo nuevamente.",
) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(
      getValidationMessage(payload) ?? "No se pudo completar la solicitud.",
      response.status,
      payload,
    );
  }

  return payload as T;
}
```

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: lint passes or only reports pre-existing unrelated issues. If lint flags `payload.detail` access, keep the guarded `'detail' in payload` pattern from the code above.

- [ ] **Step 3: Commit**

Run only if the user requested commits for this implementation session:

```bash
git add src/lib/api.ts
git commit -m "feat: add backend api client"
```

---

### Task 4: Add Auth Types And Endpoint Functions

**Files:**

- Create: `src/features/auth/types.ts`
- Create: `src/features/auth/auth-api.ts`

- [ ] **Step 1: Create auth types**

Create `src/features/auth/types.ts` with:

```ts
export type UserPublic = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type LoginRequest = {
  email: string;
  password: string;
  device_name?: string | null;
};

export type PilotRegisterRequest = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  device_name?: string | null;
};

export type AuthTokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: UserPublic;
};

export type AuthSession = AuthTokenResponse;
```

- [ ] **Step 2: Create endpoint functions**

Create `src/features/auth/auth-api.ts` with:

```ts
import { apiRequest } from "@/lib/api";

import type {
  AuthTokenResponse,
  LoginRequest,
  PilotRegisterRequest,
  UserPublic,
} from "./types";

const DEVICE_NAME = "JetPass Android Emulator";

export function loginPilot(input: Omit<LoginRequest, "device_name">) {
  return apiRequest<AuthTokenResponse>("/auth/login", {
    method: "POST",
    body: {
      ...input,
      device_name: DEVICE_NAME,
    },
  });
}

export function registerPilot(
  input: Omit<PilotRegisterRequest, "device_name">,
) {
  return apiRequest<AuthTokenResponse>("/auth/register/pilot", {
    method: "POST",
    body: {
      ...input,
      device_name: DEVICE_NAME,
    },
  });
}

export function getCurrentUser(accessToken: string) {
  return apiRequest<UserPublic>("/auth/me", {
    accessToken,
  });
}

export function logoutPilot(refreshToken: string) {
  return apiRequest<{ message?: string }>("/auth/logout", {
    method: "POST",
    body: {
      refresh_token: refreshToken,
    },
  });
}
```

- [ ] **Step 3: Run lint**

Run:

```bash
npm run lint
```

Expected: lint passes or only reports pre-existing unrelated issues.

- [ ] **Step 4: Commit**

Run only if the user requested commits for this implementation session:

```bash
git add src/features/auth/types.ts src/features/auth/auth-api.ts
git commit -m "feat: add auth api types"
```

---

### Task 5: Add Persistent Session Storage

**Files:**

- Create: `src/features/auth/session-storage.ts`

- [ ] **Step 1: Create session storage module**

Create `src/features/auth/session-storage.ts` with:

```ts
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { AuthSession } from "./types";

const AUTH_SESSION_KEY = "jetpass.auth.session";

async function setStorageItem(key: string, value: string | null) {
  if (Platform.OS === "web") {
    if (typeof localStorage === "undefined") {
      return;
    }

    if (value === null) {
      localStorage.removeItem(key);
      return;
    }

    localStorage.setItem(key, value);
    return;
  }

  if (value === null) {
    await SecureStore.deleteItemAsync(key);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function getStorageItem(key: string) {
  if (Platform.OS === "web") {
    if (typeof localStorage === "undefined") {
      return null;
    }

    return localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

export async function readStoredSession() {
  const value = await getStorageItem(AUTH_SESSION_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as AuthSession;
  } catch {
    await clearStoredSession();
    return null;
  }
}

export async function writeStoredSession(session: AuthSession) {
  await setStorageItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export async function clearStoredSession() {
  await setStorageItem(AUTH_SESSION_KEY, null);
}
```

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: lint passes or only reports pre-existing unrelated issues.

- [ ] **Step 3: Commit**

Run only if the user requested commits for this implementation session:

```bash
git add src/features/auth/session-storage.ts
git commit -m "feat: persist auth session"
```

---

### Task 6: Add Auth Context And Session Restore

**Files:**

- Create: `src/features/auth/auth-context.tsx`

- [ ] **Step 1: Create `AuthProvider` and `useAuth`**

Create `src/features/auth/auth-context.tsx` with:

```tsx
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
```

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: lint passes or only reports pre-existing unrelated issues.

- [ ] **Step 3: Commit**

Run only if the user requested commits for this implementation session:

```bash
git add src/features/auth/auth-context.tsx
git commit -m "feat: add auth provider"
```

---

### Task 7: Wire Auth Provider Into Router

**Files:**

- Modify: `src/app/_layout.tsx`
- Modify: `src/app/index.tsx`

- [ ] **Step 1: Wrap root layout with `AuthProvider`**

Replace `src/app/_layout.tsx` with:

```tsx
import "../../global.css";

import { PortalHost } from "@rn-primitives/portal";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AuthProvider } from "@/features/auth/auth-context";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{ headerShown: false, title: "JetPass" }}
        />
      </Stack>
      <PortalHost />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
```

- [ ] **Step 2: Gate index route by auth state**

Replace `src/app/index.tsx` with:

```tsx
import { ActivityIndicator, View } from "react-native";

import { Text } from "@/components/ui/text";
import { useAuth } from "@/features/auth/auth-context";
import { AuthScreen } from "@/screens/auth";
import { HomeScreen } from "@/screens/home";

export default function IndexRoute() {
  const { isLoading, session } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background px-6">
        <ActivityIndicator />
        <Text variant="muted">Cargando sesion...</Text>
      </View>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return <HomeScreen />;
}
```

- [ ] **Step 3: Run lint**

Run:

```bash
npm run lint
```

Expected: lint fails only because `@/screens/auth` does not exist yet. If it fails for other changed-file issues, fix them before continuing.

- [ ] **Step 4: Commit**

Run only if the user requested commits for this implementation session:

```bash
git add src/app/_layout.tsx src/app/index.tsx
git commit -m "feat: gate app by auth state"
```

---

### Task 8: Build Minimal Login/Register Screen

**Files:**

- Create: `src/screens/auth/index.tsx`

- [ ] **Step 1: Create auth screen**

Create `src/screens/auth/index.tsx` with:

```tsx
import * as React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/features/auth/auth-context";
import { getErrorMessage } from "@/lib/api";

type AuthMode = "login" | "register";

const INITIAL_FORM = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
};

function validateForm(mode: AuthMode, form: typeof INITIAL_FORM) {
  if (!form.email.trim() || !form.password) {
    return "Ingresa email y contrasena.";
  }

  if (mode === "register") {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      return "Ingresa nombre y apellido.";
    }

    if (form.password.length < 8) {
      return "La contrasena debe tener al menos 8 caracteres.";
    }
  }

  return null;
}

export function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = React.useState<AuthMode>("login");
  const [form, setForm] = React.useState(INITIAL_FORM);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isRegister = mode === "register";

  function updateField(field: keyof typeof INITIAL_FORM, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
  }

  async function handleSubmit() {
    const validationError = validateForm(mode, form);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isRegister) {
        await register({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          phone: form.phone.trim() || null,
        });
      } else {
        await login({
          email: form.email.trim().toLowerCase(),
          password: form.password,
        });
      }
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="min-h-full justify-center px-6 py-10"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mx-auto w-full max-w-sm gap-6">
          <View className="gap-2">
            <Text variant="h1" className="text-left text-4xl">
              JetPass
            </Text>
            <Text variant="lead" className="text-base">
              Acceso simple para pilotos.
            </Text>
          </View>

          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle>
                {isRegister ? "Crear cuenta" : "Iniciar sesion"}
              </CardTitle>
              <CardDescription>
                {isRegister
                  ? "Registra tu cuenta piloto para continuar."
                  : "Ingresa con tu cuenta para continuar."}
              </CardDescription>
            </CardHeader>

            <CardContent className="gap-4">
              <View className="flex-row rounded-lg bg-muted p-1">
                <Button
                  className="flex-1"
                  size="sm"
                  variant={!isRegister ? "default" : "ghost"}
                  onPress={() => switchMode("login")}
                >
                  <Text>Login</Text>
                </Button>
                <Button
                  className="flex-1"
                  size="sm"
                  variant={isRegister ? "default" : "ghost"}
                  onPress={() => switchMode("register")}
                >
                  <Text>Register</Text>
                </Button>
              </View>

              {isRegister ? (
                <View className="gap-2">
                  <Label>Nombre</Label>
                  <Input
                    value={form.firstName}
                    onChangeText={(value) => updateField("firstName", value)}
                    autoCapitalize="words"
                    autoComplete="given-name"
                  />
                </View>
              ) : null}

              {isRegister ? (
                <View className="gap-2">
                  <Label>Apellido</Label>
                  <Input
                    value={form.lastName}
                    onChangeText={(value) => updateField("lastName", value)}
                    autoCapitalize="words"
                    autoComplete="family-name"
                  />
                </View>
              ) : null}

              <View className="gap-2">
                <Label>Email</Label>
                <Input
                  value={form.email}
                  onChangeText={(value) => updateField("email", value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholder="piloto@jetpass.com"
                />
              </View>

              <View className="gap-2">
                <Label>Contrasena</Label>
                <Input
                  value={form.password}
                  onChangeText={(value) => updateField("password", value)}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete={isRegister ? "new-password" : "password"}
                  placeholder={
                    isRegister ? "Minimo 8 caracteres" : "Tu contrasena"
                  }
                />
              </View>

              {isRegister ? (
                <View className="gap-2">
                  <Label>Telefono opcional</Label>
                  <Input
                    value={form.phone}
                    onChangeText={(value) => updateField("phone", value)}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                  />
                </View>
              ) : null}

              {error ? (
                <Text className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </Text>
              ) : null}
            </CardContent>

            <CardFooter className="flex-col gap-3">
              <Button
                className="w-full"
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text>
                  {isSubmitting
                    ? "Enviando..."
                    : isRegister
                      ? "Crear cuenta"
                      : "Ingresar"}
                </Text>
              </Button>
            </CardFooter>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
```

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: lint passes or only reports pre-existing unrelated issues. If lint flags long JSX lines, split the affected props across multiple lines.

- [ ] **Step 3: Commit**

Run only if the user requested commits for this implementation session:

```bash
git add src/screens/auth/index.tsx
git commit -m "feat: add auth screen"
```

---

### Task 9: Replace Starter Home With Authenticated Placeholder

**Files:**

- Modify: `src/screens/home/index.tsx`

- [ ] **Step 1: Replace home screen**

Replace `src/screens/home/index.tsx` with:

```tsx
import { ScrollView, View } from "react-native";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/features/auth/auth-context";

export function HomeScreen() {
  const { logout, user } = useAuth();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="min-h-full justify-center gap-6 px-6 py-10"
      contentInsetAdjustmentBehavior="automatic"
    >
      <View className="gap-2">
        <Text variant="h1" className="text-left text-4xl">
          JetPass
        </Text>
        <Text variant="lead" className="text-base">
          Home principal
        </Text>
      </View>

      <Card className="border-primary/10 bg-card">
        <CardHeader>
          <CardTitle>Sesion activa</CardTitle>
          <CardDescription>
            {user
              ? `${user.first_name} ${user.last_name}`
              : "Usuario autenticado"}
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-2">
          <Text variant="muted">
            {user?.email ?? "El contenido principal se disenara despues."}
          </Text>
          <Text className="rounded-md bg-secondary px-3 py-2 text-secondary-foreground">
            El home queda vacio por ahora para trabajar el diseno mas adelante.
          </Text>
        </CardContent>
        <CardFooter>
          <Button className="w-full" variant="outline" onPress={logout}>
            <Text>Cerrar sesion</Text>
          </Button>
        </CardFooter>
      </Card>
    </ScrollView>
  );
}
```

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: lint passes or only reports pre-existing unrelated issues.

- [ ] **Step 3: Commit**

Run only if the user requested commits for this implementation session:

```bash
git add src/screens/home/index.tsx
git commit -m "feat: add authenticated home placeholder"
```

---

### Task 10: Verify End-To-End Behavior

**Files:**

- No planned edits unless verification reveals defects.

- [ ] **Step 1: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 2: Start Expo for Android emulator**

Run:

```bash
npm run android
```

Expected: Expo starts and opens the app in the Android Emulator.

- [ ] **Step 3: Verify fresh auth screen**

Manual check:

- Fresh app launch shows the minimal JetPass auth card.
- The toggle switches between `Login` and `Register`.
- Empty submit shows inline validation.

- [ ] **Step 4: Verify register flow**

Manual check with backend running on the host machine at port `8000`:

- Submit register with `first_name`, `last_name`, valid `email`, and password length at least 8.
- App enters home.
- Home shows the returned user name or email.

- [ ] **Step 5: Verify logout flow**

Manual check:

- Tap `Cerrar sesion`.
- App returns to auth screen.
- Force close and reopen app.
- Auth screen remains visible.

- [ ] **Step 6: Verify login and restore flow**

Manual check:

- Submit login with valid credentials.
- App enters home.
- Force close and reopen app.
- App briefly shows loading and then restores home using the stored session and `/auth/me`.

- [ ] **Step 7: Verify invalid credentials**

Manual check:

- Submit login with invalid credentials.
- App stays on auth screen.
- Inline error message is visible inside the card.

- [ ] **Step 8: Fix any verification defects**

If verification reveals a defect, make the smallest targeted edit in the responsible file and rerun:

```bash
npm run lint
```

Expected: PASS after the fix.

- [ ] **Step 9: Commit**

Run only if the user requested commits for this implementation session:

```bash
git add src package.json package-lock.json
git commit -m "feat: implement persistent auth flow"
```

---

## Self-Review

- Spec coverage: the plan includes backend login/register/me/logout, persistent session storage, minimal RNR/NativeWind UI, auth-gated index route, placeholder home, validation, and verification.
- Placeholder scan: no `TBD`, `TODO`, or unspecified implementation steps remain. Each code-producing step includes concrete code.
- Type consistency: auth type names and property names match the OpenAPI schemas and are reused consistently across API, storage, context, and screens.
- Scope check: refresh-token rotation, password reset, email verification, MFA, and final dashboard design remain out of scope as specified.
