import "../../global.css";

import { PortalHost } from "@rn-primitives/portal";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ title: "JetPass" }} />
      </Stack>
      <PortalHost />
      <StatusBar style="auto" />
    </>
  );
}
