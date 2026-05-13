# Auth Login/Register Design

## Goal

Implement an initial authentication flow for JetPass that lets a pilot register or log in against the backend described in `docs/openapi_backend.json`, persists the session, and then shows the main home screen as an empty authenticated landing page.

## Decisions

- Visual direction: minimal clear layout.
- Target runtime for development: Android Emulator.
- Backend base URL for development: `http://10.0.2.2:8000`.
- UI system: existing React Native Reusables components with NativeWind classes.
- Session model: persistent session with `access_token`, `refresh_token`, and `user` stored securely on native platforms.
- Scope: authentication shell only; detailed home/dashboard design is intentionally deferred.

## Backend Contract

Use the existing auth endpoints from the OpenAPI spec:

- `POST /auth/login` with `email`, `password`, optional `device_name`.
- `POST /auth/register/pilot` with `email`, `password`, `first_name`, `last_name`, optional `phone`, optional `device_name`.
- `GET /auth/me` with bearer access token.
- `POST /auth/logout` with `refresh_token`.

Successful login and register responses return `access_token`, `refresh_token`, `expires_in`, `token_type`, and `user`.

## Architecture

Add a small API/auth layer rather than putting fetch calls directly in screens.

- `src/lib/api.ts`: centralizes `API_BASE_URL`, JSON request handling, auth headers, and backend error extraction.
- `src/features/auth/types.ts`: TypeScript types matching the relevant OpenAPI schemas.
- `src/features/auth/session-storage.ts`: reads, writes, and clears the persisted auth session.
- `src/features/auth/auth-context.tsx`: owns auth state, initial session restore, `login`, `register`, `logout`, and authenticated user state.
- `src/screens/auth/index.tsx`: minimal login/register screen.
- `src/screens/home/index.tsx`: authenticated placeholder home.

The root layout should wrap the app with `AuthProvider`. The index route should render a loading state while restoring session, then render `AuthScreen` when unauthenticated or `HomeScreen` when authenticated.

## Session Persistence

Use `expo-secure-store` for Android/iOS token persistence. If web support is needed during development, use `localStorage` as a non-secure fallback, following Expo's documented pattern.

On app start:

1. Read persisted session.
2. If missing, show auth screen.
3. If present, call `GET /auth/me` with the access token.
4. If valid, update the stored user and show home.
5. If invalid or unreachable due to auth failure, clear session and show auth screen.

Refresh-token rotation is out of scope for this first implementation. The refresh token is still stored and passed to logout so the server can revoke it.

## UI Design

The auth screen uses a single centered card:

- Brand title: `JetPass`.
- Short subtitle focused on pilot access.
- Toggle between `Iniciar sesion` and `Crear cuenta`.
- Login fields: `email`, `password`.
- Register fields: `first_name`, `last_name`, `email`, `password`, optional `phone`.
- Primary submit button with loading state.
- Inline error message inside the card.

Use existing React Native Reusables components where available: `Button`, `Card`, and `Text`. Add React Native Reusables-style `Input` and optionally `Label` components if they are not already present. Styling should stay in NativeWind `className` utilities.

The home screen should be intentionally simple after auth: a blank or minimal authenticated landing state with the user's name/email and a logout button. Full home design is deferred.

## Validation And Errors

Client-side validation should stay minimal:

- Login requires non-empty email and password.
- Register requires first name, last name, email, and password.
- Register password must be at least 8 characters to match backend constraints.

Backend validation errors should be shown as a readable inline message. Unknown failures should show a generic message without exposing raw implementation details.

## Verification

Run `npm run lint` after implementation. Manual verification should cover:

- Fresh app launch shows auth screen.
- Register succeeds and enters home.
- Logout clears session and returns to auth.
- Login succeeds and enters home.
- Restarting the app restores the persisted session.
- Invalid credentials show an inline error.

## Out Of Scope

- Final visual polish for the product dashboard.
- Full token refresh scheduling/interceptor logic.
- Password reset, email verification, MFA, or social login.
- Role-based navigation beyond accepting the returned user object.
