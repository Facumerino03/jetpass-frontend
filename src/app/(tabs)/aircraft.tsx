import * as React from "react";
import { View, FlatList, RefreshControl, Pressable } from "react-native";
import { router, type Href } from "expo-router";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/header";
import { useAuth } from "@/features/auth/auth-context";
import { listAircraft, deleteAircraft } from "@/features/aircraft/aircraft-api";
import type { AircraftPublic } from "@/features/aircraft/types";
import { getErrorMessage } from "@/lib/api";
import { Plane, ChevronRight, Trash2 } from "lucide-react-native";
import { Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function AircraftCard({
  aircraft,
  onPress,
  onDelete,
}: {
  aircraft: AircraftPublic;
  onPress: () => void;
  onDelete: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="active:opacity-80">
      <Card className="flex-row items-center justify-between">
        <CardContent className="flex-1 flex-row items-center gap-3 py-4">
          <View className="bg-primary/10 h-10 w-10 items-center justify-center rounded-full">
            <Plane className="text-primary size-5" />
          </View>
          <View className="flex-1">
            <Text className="text-foreground font-semibold text-base">
              {aircraft.alias ?? aircraft.identification}
            </Text>
            <Text className="text-muted-foreground text-sm">
              {aircraft.identification} · {aircraft.icao_type_designator} · {aircraft.wake_turbulence_category}
            </Text>
          </View>
        </CardContent>
        <View className="flex-row items-center gap-2 pr-4">
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="h-8 w-8 items-center justify-center rounded-full active:bg-destructive/10"
            hitSlop={8}
          >
            <Trash2 className="text-destructive size-4" />
          </Pressable>
          <ChevronRight className="text-muted-foreground size-4" />
        </View>
      </Card>
    </Pressable>
  );
}

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
    load();
  }, [load]);

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
          contentContainerClassName="gap-3 px-4 py-4"
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
          }
          renderItem={({ item }) => (
            <AircraftCard
              aircraft={item}
              onPress={() => router.push(`/aircraft/${item.id}` as Href)}
              onDelete={() => handleDelete(item)}
            />
          )}
        />
      )}

      {/* Espacio inferior para que el contenido no quede tapado por la navbar */}
      <View style={{ height: insets.bottom + 100 }} />
    </View>
  );
}
