import * as React from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/features/auth/auth-context";
import { createAircraft } from "@/features/aircraft/aircraft-api";
import { AircraftForm } from "@/features/aircraft/aircraft-form";
import type { AircraftCreate, AircraftUpdate } from "@/features/aircraft/types";
import { getErrorMessage } from "@/lib/api";
import { ChevronLeft } from "lucide-react-native";
import { Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable } from "react-native";

export default function CreateAircraftScreen() {
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = React.useCallback(
    async (data: AircraftCreate | AircraftUpdate) => {
      if (!session) {
        Alert.alert("Error", "No hay sesión activa");
        return;
      }

      setIsSubmitting(true);
      try {
        await createAircraft(data as AircraftCreate, session.access_token);
        router.back();
      } catch (err) {
        Alert.alert("Error al crear", getErrorMessage(err));
      } finally {
        setIsSubmitting(false);
      }
    },
    [session],
  );

  return (
    <View className="flex-1 bg-background">
      {/* Header integrado con safe area */}
      <View
        className="flex-row items-center gap-3 px-4 pb-3"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 active:bg-zinc-200"
        >
          <ChevronLeft size={20} color="#18181b" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-foreground text-xl font-bold">Nueva aeronave</Text>
          <Text className="text-muted-foreground text-sm">
            Registrá los datos para tus planes de vuelo
          </Text>
        </View>
      </View>

      <AircraftForm
        accessToken={session?.access_token ?? ""}
        onSubmit={handleSubmit}
        submitLabel="Crear aeronave"
        isLoading={isSubmitting}
      />
    </View>
  );
}
