import * as React from "react";
import { View, FlatList, RefreshControl, Pressable, StyleSheet } from "react-native";
import { router, type Href } from "expo-router";
import { Image } from "expo-image";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import Header from "@/components/header";
import { useAuth } from "@/features/auth/auth-context";
import { listAircraft, deleteAircraft } from "@/features/aircraft/aircraft-api";
import type { AircraftPublic } from "@/features/aircraft/types";
import { getErrorMessage } from "@/lib/api";
import { Plane, ArrowUpRight, Heart, Hash, Wind } from "lucide-react-native";
import { Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function AircraftCard({
  aircraft,
  onPress,
}: {
  aircraft: AircraftPublic;
  onPress: () => void;
}) {
  const hasImage = !!aircraft.image_url;

  return (
    <Pressable onPress={onPress} className="active:opacity-95">
      <View style={styles.card}>
        {/* Top Content Area */}
        <View className="p-5 pb-7 pt-6">
          {/* Header: Title + Arrow Button */}
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-3">
              {/* Title Row with inline tag */}
              <View className="flex-row items-baseline gap-2">
                <Text className="text-2xl font-bold text-zinc-900" numberOfLines={1}>
                  {aircraft.alias ?? aircraft.identification}
                </Text>
                <Text className="text-sm text-zinc-500" numberOfLines={1}>
                  {aircraft.icao_type_designator}
                </Text>
              </View>
            </View>

            {/* Black Arrow Button */}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onPress();
              }}
              className="h-11 w-11 bg-zinc-900 rounded-full items-center justify-center active:bg-zinc-700"
            >
              <ArrowUpRight size={20} color="#ffffff" />
            </Pressable>
          </View>

          {/* Pills Row */}
          <View className="flex-row flex-wrap gap-2">
            {/* Identification Pill - Amber */}
            <View className="bg-amber-50 rounded-full px-2.5 py-1.5 flex-row items-center gap-1 border border-amber-100">
              <Hash size={12} color="#f59e0b" />
              <Text className="text-xs font-medium text-amber-700">
                {aircraft.identification}
              </Text>
            </View>
            {/* ICAO Type Pill - Sky */}
            <View className="bg-sky-50 rounded-full px-2.5 py-1.5 flex-row items-center gap-1 border border-sky-100">
              <Plane size={12} color="#0ea5e9" />
              <Text className="text-xs font-medium text-sky-700">
                {aircraft.icao_type_designator}
              </Text>
            </View>
            {/* Wake Turbulence Pill - Emerald */}
            <View className="bg-emerald-50 rounded-full px-2.5 py-1.5 flex-row items-center gap-1 border border-emerald-100">
              <Wind size={12} color="#10b981" />
              <Text className="text-xs font-medium text-emerald-700">
                {aircraft.wake_turbulence_category}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Image Area */}
        <View className="px-0 pb-0">
          <View style={styles.imageWrapper}>
            {hasImage ? (
              <Image
                source={{ uri: aircraft.image_url! }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={300}
              />
            ) : (
              <View className="flex-1 items-center justify-center bg-zinc-100">
                <Plane size={48} color="#a1a1aa" strokeWidth={1.5} />
              </View>
            )}

            {/* Favorite Badge - Bottom Left of Image */}
            <View className="absolute bottom-3 left-3 h-8 w-8 items-center justify-center rounded-full bg-white/90">
              <Heart size={16} color="#ef4444" fill="#ef4444" />
            </View>
          </View>
        </View>
      </View>
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
          contentContainerClassName="gap-4 px-4 py-4"
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
          }
          renderItem={({ item }) => (
            <AircraftCard
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  imageWrapper: {
    height: 220,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    position: "relative",
  },
});
