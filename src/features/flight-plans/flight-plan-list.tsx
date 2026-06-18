import * as React from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { getErrorMessage } from "@/lib/api";
import { listFlightPlans } from "./flight-plan-api";
import type { FlightPlanPublic } from "./types";
import { FPL_STATUS_LABELS } from "./types";
import { Plane } from "lucide-react-native";

type FlightPlanListProps = { accessToken: string };

function formatFlightDateTime(flight_date: string, departure_time_utc: string): string {
  const time = departure_time_utc.length === 4
    ? `${departure_time_utc.slice(0, 2)}:${departure_time_utc.slice(2, 4)}`
    : departure_time_utc;
  return `${flight_date} ${time} UTC`;
}

export function FlightPlanList({ accessToken }: FlightPlanListProps) {
  const [plans, setPlans] = React.useState<FlightPlanPublic[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setError(null);
      setPlans(await listFlightPlans(accessToken));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [accessToken]);

  React.useEffect(() => {
    setIsLoading(true);
    load().finally(() => setIsLoading(false));
  }, [load]);

  const refresh = React.useCallback(() => {
    setIsRefreshing(true);
    load().finally(() => setIsRefreshing(false));
  }, [load]);

  if (isLoading) {
    return <View className="flex-1 items-center justify-center bg-background"><Text className="text-muted-foreground">Cargando planes...</Text></View>;
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background px-8">
        <Text className="text-center text-destructive">{error}</Text>
        <Button onPress={load}><Text className="font-semibold text-white">Reintentar</Text></Button>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background px-4" edges={["top"]}>
      <Text className="text-2xl font-bold text-foreground">Planes de vuelo</Text>
      <Text className="text-sm text-muted-foreground">{plans.length} planes registrados</Text>
      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-3 py-4 pb-28"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
        renderItem={({ item }) => (
          <View className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
            {/* Route header */}
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl font-black text-zinc-900">{item.departure_aerodrome_icao}</Text>
              <View className="flex-1 flex-row items-center justify-center px-4">
                <View className="h-px flex-1 bg-zinc-200" />
                <View className="mx-2 rounded-full bg-zinc-50 p-1.5">
                  <Plane size={18} color="#71717a" />
                </View>
                <View className="h-px flex-1 bg-zinc-200" />
              </View>
              <Text className="text-2xl font-black text-zinc-900">{item.destination_aerodrome_icao}</Text>
            </View>

            {/* Info row */}
            <View className="mt-4 flex-row items-end justify-between">
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-400">EOBT</Text>
                <Text className="text-base font-semibold text-zinc-700">{formatFlightDateTime(item.flight_date, item.departure_time_utc)}</Text>
              </View>
              <View
                className={
                  item.status === "draft"
                    ? "rounded-full bg-amber-50 px-3 py-1"
                    : item.status === "filed" || item.status === "pending_approval"
                      ? "rounded-full bg-blue-50 px-3 py-1"
                      : item.status === "accepted" || item.status === "active"
                        ? "rounded-full bg-emerald-50 px-3 py-1"
                        : item.status === "rejected" || item.status === "cancelled"
                          ? "rounded-full bg-red-50 px-3 py-1"
                          : "rounded-full bg-zinc-100 px-3 py-1"
                }
              >
                <Text
                  className={
                    item.status === "draft"
                      ? "text-xs font-bold text-amber-700"
                      : item.status === "filed" || item.status === "pending_approval"
                        ? "text-xs font-bold text-blue-700"
                        : item.status === "accepted" || item.status === "active"
                          ? "text-xs font-bold text-emerald-700"
                          : item.status === "rejected" || item.status === "cancelled"
                            ? "text-xs font-bold text-red-700"
                            : "text-xs font-bold text-zinc-700"
                  }
                >
                  {FPL_STATUS_LABELS[item.status]}
                </Text>
              </View>
            </View>

            {/* Aircraft */}
            <View className="mt-3 border-t border-zinc-100 pt-3">
              <Text className="text-sm text-zinc-500">
                Aeronave: <Text className="font-semibold text-zinc-700">{item.aircraft_identification_snapshot ?? "Sin seleccionar"}</Text>
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text className="py-12 text-center text-muted-foreground">Todavia no tenes planes de vuelo.</Text>}
      />
    </SafeAreaView>
  );
}
