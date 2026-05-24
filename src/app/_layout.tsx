import "../../global.css";

import { useEffect } from "react";
import { PortalHost } from "@rn-primitives/portal";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

import { AuthProvider, useAuth } from "@/features/auth/auth-context";

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session } = useAuth();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    "Geist-Regular": require("../../assets/fonts/Geist-Regular.ttf"),
    "Geist-Medium": require("../../assets/fonts/Geist-Medium.ttf"),
    "Geist-SemiBold": require("../../assets/fonts/Geist-SemiBold.ttf"),
    "Geist-Bold": require("../../assets/fonts/Geist-Bold.ttf"),
    "GeistMono-Regular": require("../../assets/fonts/GeistMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
        <PortalHost />
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
