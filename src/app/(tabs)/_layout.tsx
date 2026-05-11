import { Tabs } from "expo-router";
import FloatingNavbar from "@/components/ui/floating-navbar";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <FloatingNavbar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="aircraft" />
      <Tabs.Screen name="create-fpl" />
      <Tabs.Screen name="plans" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
