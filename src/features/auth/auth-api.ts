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
