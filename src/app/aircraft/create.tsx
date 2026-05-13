import * as React from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { createAircraft } from "@/features/aircraft/aircraft-api";
import { AircraftForm } from "@/features/aircraft/aircraft-form";
import type { AircraftCreate, AircraftUpdate } from "@/features/aircraft/types";
import { getErrorMessage } from "@/lib/api";
import { ChevronLeft } from "lucide-react-native";
import { Alert } from "react-native";

export default function CreateAircraftScreen() {
  const { session } = useAuth();
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
      <View className="flex-row items-center gap-2 border-b border-border px-4 py-3">
        <Button variant="ghost" size="icon" onPress={() => router.back()}>
          <ChevronLeft className="text-foreground size-5" />
        </Button>
        <Text className="text-foreground text-lg font-semibold">Nueva aeronave</Text>
      </View>

      <AircraftForm
        onSubmit={handleSubmit}
        submitLabel="Crear aeronave"
        isLoading={isSubmitting}
      />
    </View>
  );
}
