import * as React from "react";
import { View, ScrollView, RefreshControl } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth-context";
import { getAircraft, updateAircraft, deleteAircraft } from "@/features/aircraft/aircraft-api";
import { AircraftForm } from "@/features/aircraft/aircraft-form";
import type { AircraftPublic, AircraftUpdate } from "@/features/aircraft/types";
import { getErrorMessage } from "@/lib/api";
import { ChevronLeft, Pencil, Trash2, Plane } from "lucide-react-native";
import { Alert } from "react-native";
import { Image } from "expo-image";

function DetailField({ label, value }: { label: string; value?: string | number | boolean | null }) {
  const displayValue =
    value === null || value === undefined || value === ""
      ? "—"
      : typeof value === "boolean"
        ? value
          ? "Sí"
          : "No"
        : String(value);

  return (
    <View className="gap-1">
      <Text className="text-muted-foreground text-sm">{label}</Text>
      <Text className="text-foreground text-base">{displayValue}</Text>
    </View>
  );
}

function DetailListField({ label, value }: { label: string; value?: string | null }) {
  const items = value
    ? value
        .split(/[,\s]+/)
        .map((v) => v.trim())
        .filter(Boolean)
    : [];

  if (items.length === 0) {
    return (
      <View className="gap-1">
        <Text className="text-muted-foreground text-sm">{label}</Text>
        <Text className="text-foreground text-base">—</Text>
      </View>
    );
  }

  return (
    <View className="gap-1.5">
      <Text className="text-muted-foreground text-sm">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {items.map((item, idx) => (
          <View
            key={`${item}-${idx}`}
            className="bg-primary/10 rounded-full px-2.5 py-1"
          >
            <Text className="text-primary text-sm font-medium">{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function AircraftDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const [aircraft, setAircraft] = React.useState<AircraftPublic | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAircraft = React.useCallback(async () => {
    if (!session || !id) return;

    try {
      setError(null);
      const data = await getAircraft(id, session.access_token);
      setAircraft(data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [session, id]);

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

  const handleUpdate = React.useCallback(
    async (data: AircraftUpdate) => {
      if (!session || !id) return;

      setIsSubmitting(true);
      try {
        const updated = await updateAircraft(id, data, session.access_token);
        setAircraft(updated);
        setIsEditing(false);
      } catch (err) {
        Alert.alert("Error al actualizar", getErrorMessage(err));
      } finally {
        setIsSubmitting(false);
      }
    },
    [session, id],
  );

  const handleDelete = React.useCallback(() => {
    if (!aircraft || !session) return;

    Alert.alert(
      "Eliminar aeronave",
      `¿Estás seguro de que querés eliminar "${aircraft.alias ?? aircraft.identification}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAircraft(aircraft.id, session.access_token);
              router.back();
            } catch (err) {
              Alert.alert("Error", getErrorMessage(err));
            }
          },
        },
      ],
    );
  }, [aircraft, session]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Cargando...</Text>
      </View>
    );
  }

  if (error || !aircraft) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8 gap-4">
        <Text className="text-destructive text-center">{error ?? "Aeronave no encontrada"}</Text>
        <Button onPress={load}>
          <Text className="text-primary-foreground font-semibold">Reintentar</Text>
        </Button>
      </View>
    );
  }

  if (isEditing) {
    return (
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <View className="flex-row items-center gap-2">
            <Button variant="ghost" size="icon" onPress={() => setIsEditing(false)}>
              <ChevronLeft className="text-foreground size-5" />
            </Button>
            <Text className="text-foreground text-lg font-semibold">Editar aeronave</Text>
          </View>
        </View>

        <AircraftForm
          initialData={{
            identification: aircraft.identification,
            icao_type_designator: aircraft.icao_type_designator,
            wake_turbulence_category: aircraft.wake_turbulence_category as import("@/features/aircraft/types").WakeTurbulenceCat,
            equipment_com_nav: aircraft.equipment_com_nav,
            equipment_surveillance: aircraft.equipment_surveillance,
            color_and_markings: aircraft.color_and_markings,
            alias: aircraft.alias ?? "",
            pbn_capabilities: aircraft.pbn_capabilities ?? "",
            emergency_radio: [
              aircraft.emergency_radio_uhf && "UHF",
              aircraft.emergency_radio_vhf && "VHF",
              aircraft.emergency_radio_elt && "ELT",
            ].filter(Boolean).join(", "),
            survival_equipment: [
              aircraft.survival_polar && "Polar",
              aircraft.survival_desert && "Desert",
              aircraft.survival_maritime && "Maritime",
              aircraft.survival_jungle && "Jungle",
            ].filter(Boolean).join(", "),
            life_jackets: [
              aircraft.life_jackets_lights && "Light",
              aircraft.life_jackets_fluorescein && "Fluorescent",
              aircraft.life_jackets_uhf && "UHF",
              aircraft.life_jackets_vhf && "VHF",
            ].filter(Boolean).join(", "),
            has_dinghies: aircraft.dinghies_present ?? false,
            dinghies_number: aircraft.dinghies_number?.toString() ?? "",
            dinghies_capacity: aircraft.dinghies_capacity?.toString() ?? "",
            dinghies_cover: aircraft.dinghies_cover_present ?? false,
            dinghies_color: aircraft.dinghies_color ?? "",
            image_url: aircraft.image_url ?? "",
          }}
          onSubmit={handleUpdate}
          submitLabel="Guardar cambios"
          isLoading={isSubmitting}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
        <View className="flex-row items-center gap-2">
          <Button variant="ghost" size="icon" onPress={() => router.back()}>
            <ChevronLeft className="text-foreground size-5" />
          </Button>
          <Text className="text-foreground text-lg font-semibold">Detalle de aeronave</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Button variant="ghost" size="icon" onPress={() => setIsEditing(true)}>
            <Pencil className="text-foreground size-4" />
          </Button>
          <Button variant="ghost" size="icon" onPress={handleDelete}>
            <Trash2 className="text-destructive size-4" />
          </Button>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 p-4 pb-8"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
      >
        <View className="items-center gap-3 py-4">
          {aircraft.image_url ? (
            <Image
              source={{ uri: aircraft.image_url }}
              style={{ width: 200, height: 120 }}
              contentFit="contain"
              transition={200}
            />
          ) : (
            <View className="bg-primary/10 h-20 w-20 items-center justify-center rounded-full">
              <Plane className="text-primary size-10" />
            </View>
          )}
          <Text className="text-foreground text-xl font-bold">
            {aircraft.alias ?? aircraft.identification}
          </Text>
          {aircraft.alias && (
            <Text className="text-muted-foreground">{aircraft.identification}</Text>
          )}
        </View>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información básica</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <DetailField label="Identificación" value={aircraft.identification} />
            <DetailField label="Designador ICAO" value={aircraft.icao_type_designator} />
            <DetailField label="Categoría de turbulencia" value={aircraft.wake_turbulence_category} />
            <DetailField label="Colores y marcas" value={aircraft.color_and_markings} />
            <DetailField label="URL de imagen" value={aircraft.image_url} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Equipamiento</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <DetailListField label="COM/NAV" value={aircraft.equipment_com_nav} />
            <DetailListField label="Vigilancia" value={aircraft.equipment_surveillance} />
            <DetailListField label="Capacidades PBN" value={aircraft.pbn_capabilities} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Equipamiento de emergencia</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <DetailListField
              label="Radio de emergencia"
              value={[
                aircraft.emergency_radio_uhf && "UHF",
                aircraft.emergency_radio_vhf && "VHF",
                aircraft.emergency_radio_elt && "ELT",
              ].filter(Boolean).join(", ") || null}
            />
            <DetailListField
              label="Equipo de supervivencia"
              value={[
                aircraft.survival_polar && "Polar",
                aircraft.survival_desert && "Desierto",
                aircraft.survival_maritime && "Marítimo",
                aircraft.survival_jungle && "Jungla",
              ].filter(Boolean).join(", ") || null}
            />
            <DetailListField
              label="Chalecos salvavidas"
              value={[
                aircraft.life_jackets_lights && "Luces",
                aircraft.life_jackets_fluorescein && "Fluorescína",
                aircraft.life_jackets_uhf && "UHF",
                aircraft.life_jackets_vhf && "VHF",
              ].filter(Boolean).join(", ") || null}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Botes salvavidas</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            {!aircraft.dinghies_present && !aircraft.dinghies_number && !aircraft.dinghies_capacity && !aircraft.dinghies_cover_present && !aircraft.dinghies_color ? (
              <Text className="text-muted-foreground text-base">No lleva botes a bordo</Text>
            ) : (
              <>
                <DetailField label="Cantidad" value={aircraft.dinghies_number} />
                <DetailField label="Capacidad" value={aircraft.dinghies_capacity} />
                <DetailField label="Cubierta" value={aircraft.dinghies_cover_present} />
                <DetailField label="Color" value={aircraft.dinghies_color} />
              </>
            )}
          </CardContent>
        </Card>
      </ScrollView>
    </View>
  );
}
