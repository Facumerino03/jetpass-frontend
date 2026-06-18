import * as React from "react";
import { View, FlatList, RefreshControl } from "react-native";
import { router, useFocusEffect, type Href } from "expo-router";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import Header from "@/components/header";
import { useAuth } from "@/features/auth/auth-context";
import { listAircraft, deleteAircraft } from "@/features/aircraft/aircraft-api";
import { AircraftListCard } from "@/features/aircraft/aircraft-list-card";
import type { AircraftPublic } from "@/features/aircraft/types";
import { getErrorMessage } from "@/lib/api";
import { Plane } from "lucide-react-native";
import { Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-8 gap-4">
      <View className="bg-muted h-16 w-16 items-center justify-center rounded-full">
        <Plane className="text-muted-foreground size-8" />
      </View>
      <Text className="text-center text-xl font-semibold text-foreground">
        No tenés aeronaves
      </Text>
      <Text className="text-center text-muted-foreground">
        Agregá tu primera aeronave para empezar a gestionar tus planes de vuelo.
      </Text>
    </View>
  );
}

export default function AircraftListScreen() {
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const [aircraft, setAircraft] = React.useState<AircraftPublic[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const hasInitialLoad = React.useRef(false);

  const fetchAircraft = React.useCallback(async () => {
    if (!session) return;

    try {
      setError(null);
      const data = await listAircraft(session.access_token);
      setAircraft(data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [session]);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    await fetchAircraft();
    setIsLoading(false);
  }, [fetchAircraft]);

  const refresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await fetchAircraft();
    setIsRefreshing(false);
  }, [fetchAircraft]);

  React.useEffect(() => {
    load().then(() => {
      hasInitialLoad.current = true;
    });
  }, [load]);

  useFocusEffect(
    React.useCallback(() => {
      if (hasInitialLoad.current) {
        void fetchAircraft();
      }
    }, [fetchAircraft]),
  );

  const handleDelete = React.useCallback(
    (aircraftItem: AircraftPublic) => {
      Alert.alert(
        "Eliminar aeronave",
        `¿Estás seguro de que querés eliminar "${aircraftItem.alias ?? aircraftItem.identification}"?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: async () => {
              if (!session) return;
              try {
                await deleteAircraft(aircraftItem.id, session.access_token);
                setAircraft((prev) => prev.filter((a) => a.id !== aircraftItem.id));
              } catch (err) {
                Alert.alert("Error", getErrorMessage(err));
              }
            },
          },
        ],
      );
    },
    [session],
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Cargando aeronaves...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8 gap-4">
        <Text className="text-destructive text-center">{error}</Text>
        <Button onPress={load}>
          <Text className="text-primary-foreground font-semibold">Reintentar</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Header />
      <View className="px-4 pt-4 pb-2">
        <Text className="text-foreground text-2xl font-bold">Mis aeronaves</Text>
        <Text className="text-muted-foreground text-sm">
          {aircraft.length} {aircraft.length === 1 ? "aeronave" : "aeronaves"} registradas
        </Text>
      </View>

      {aircraft.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={aircraft}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-4 px-4 py-4"
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
          }
          renderItem={({ item }) => (
            <AircraftListCard
              aircraft={item}
              onPress={() => router.push(`/aircraft/${item.id}` as Href)}
            />
          )}
        />
      )}

      {/* Espacio inferior para que el contenido no quede tapado por la navbar */}
      <View style={{ height: insets.bottom + 100 }} />
    </View>
  );
}

