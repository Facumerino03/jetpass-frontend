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
  try {
    await setStorageItem(AUTH_SESSION_KEY, null);
  } catch (error) {
    console.error("[Auth] Error clearing session:", error);
    throw error;
  }
}
