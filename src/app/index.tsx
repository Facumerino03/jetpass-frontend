import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";

import { Text } from "@/components/ui/text";
import { useAuth } from "@/features/auth/auth-context";
import { AuthScreen } from "@/screens/auth";

export default function IndexRoute() {
  const { isLoading, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && session) {
      router.replace("/(tabs)");
    }
  }, [isLoading, session, router]);

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

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator />
    </View>
  );
}
