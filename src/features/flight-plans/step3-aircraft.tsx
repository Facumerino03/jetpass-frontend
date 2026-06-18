import * as React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, Pencil, X } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { AircraftListCard } from "@/features/aircraft/aircraft-list-card";
import type { AircraftPublic } from "@/features/aircraft/types";
import type { FlightPlanPublic, FlightPlanUpdate } from "./types";

export type AircraftFplFields = {
  equipment_com_nav_snapshot: string;
  equipment_surveillance_snapshot: string;
  color_and_markings_snapshot: string;
  emergency_radio_uhf_snapshot: boolean;
  emergency_radio_vhf_snapshot: boolean;
  emergency_radio_elt_snapshot: boolean;
  survival_equipment_present_snapshot: boolean;
  survival_polar_snapshot: boolean;
  survival_desert_snapshot: boolean;
  survival_maritime_snapshot: boolean;
  survival_jungle_snapshot: boolean;
  life_jackets_present_snapshot: boolean;
  life_jackets_lights_snapshot: boolean;
  life_jackets_fluorescein_snapshot: boolean;
  life_jackets_uhf_snapshot: boolean;
  life_jackets_vhf_snapshot: boolean;
  dinghies_present_snapshot: boolean;
  dinghies_cover_present_snapshot: boolean;
};

export const EMPTY_AIRCRAFT_FPL_FIELDS: AircraftFplFields = {
  equipment_com_nav_snapshot: "",
  equipment_surveillance_snapshot: "",
  color_and_markings_snapshot: "",
  emergency_radio_uhf_snapshot: false,
  emergency_radio_vhf_snapshot: false,
  emergency_radio_elt_snapshot: false,
  survival_equipment_present_snapshot: false,
  survival_polar_snapshot: false,
  survival_desert_snapshot: false,
  survival_maritime_snapshot: false,
  survival_jungle_snapshot: false,
  life_jackets_present_snapshot: false,
  life_jackets_lights_snapshot: false,
  life_jackets_fluorescein_snapshot: false,
  life_jackets_uhf_snapshot: false,
  life_jackets_vhf_snapshot: false,
  dinghies_present_snapshot: false,
  dinghies_cover_present_snapshot: false,
};

const WAKE_LABELS: Record<string, string> = {
  L: "Ligero",
  M: "Medio",
  H: "Pesado",
  J: "Super",
};

export function flightPlanToAircraftFplFields(plan: FlightPlanPublic): AircraftFplFields {
  return {
    equipment_com_nav_snapshot: plan.equipment_com_nav_snapshot ?? "",
    equipment_surveillance_snapshot: plan.equipment_surveillance_snapshot ?? "",
    color_and_markings_snapshot: plan.color_and_markings_snapshot ?? "",
    emergency_radio_uhf_snapshot: plan.emergency_radio_uhf_snapshot,
    emergency_radio_vhf_snapshot: plan.emergency_radio_vhf_snapshot,
    emergency_radio_elt_snapshot: plan.emergency_radio_elt_snapshot,
    survival_equipment_present_snapshot: plan.survival_equipment_present_snapshot,
    survival_polar_snapshot: plan.survival_polar_snapshot,
    survival_desert_snapshot: plan.survival_desert_snapshot,
    survival_maritime_snapshot: plan.survival_maritime_snapshot,
    survival_jungle_snapshot: plan.survival_jungle_snapshot,
    life_jackets_present_snapshot: plan.life_jackets_present_snapshot,
    life_jackets_lights_snapshot: plan.life_jackets_lights_snapshot,
    life_jackets_fluorescein_snapshot: plan.life_jackets_fluorescein_snapshot,
    life_jackets_uhf_snapshot: plan.life_jackets_uhf_snapshot,
    life_jackets_vhf_snapshot: plan.life_jackets_vhf_snapshot,
    dinghies_present_snapshot: plan.dinghies_present_snapshot,
    dinghies_cover_present_snapshot: plan.dinghies_cover_present_snapshot,
  };
}

export function resolveAircraftFplFields(
  plan: FlightPlanPublic,
  aircraft?: AircraftPublic | null,
): AircraftFplFields {
  const fromPlan = flightPlanToAircraftFplFields(plan);
  if (!aircraft) return fromPlan;

  const alreadyConfirmed = !!plan.aircraft_snapshot_confirmed_at;

  return {
    equipment_com_nav_snapshot:
      fromPlan.equipment_com_nav_snapshot || aircraft.equipment_com_nav || "",
    equipment_surveillance_snapshot:
      fromPlan.equipment_surveillance_snapshot || aircraft.equipment_surveillance || "",
    color_and_markings_snapshot:
      fromPlan.color_and_markings_snapshot || aircraft.color_and_markings || "",
    emergency_radio_uhf_snapshot: alreadyConfirmed
      ? fromPlan.emergency_radio_uhf_snapshot
      : aircraft.emergency_radio_uhf,
    emergency_radio_vhf_snapshot: alreadyConfirmed
      ? fromPlan.emergency_radio_vhf_snapshot
      : aircraft.emergency_radio_vhf,
    emergency_radio_elt_snapshot: alreadyConfirmed
      ? fromPlan.emergency_radio_elt_snapshot
      : aircraft.emergency_radio_elt,
    survival_equipment_present_snapshot: alreadyConfirmed
      ? fromPlan.survival_equipment_present_snapshot
      : aircraft.survival_equipment_present,
    survival_polar_snapshot: alreadyConfirmed
      ? fromPlan.survival_polar_snapshot
      : aircraft.survival_polar,
    survival_desert_snapshot: alreadyConfirmed
      ? fromPlan.survival_desert_snapshot
      : aircraft.survival_desert,
    survival_maritime_snapshot: alreadyConfirmed
      ? fromPlan.survival_maritime_snapshot
      : aircraft.survival_maritime,
    survival_jungle_snapshot: alreadyConfirmed
      ? fromPlan.survival_jungle_snapshot
      : aircraft.survival_jungle,
    life_jackets_present_snapshot: alreadyConfirmed
      ? fromPlan.life_jackets_present_snapshot
      : aircraft.life_jackets_present,
    life_jackets_lights_snapshot: alreadyConfirmed
      ? fromPlan.life_jackets_lights_snapshot
      : aircraft.life_jackets_lights,
    life_jackets_fluorescein_snapshot: alreadyConfirmed
      ? fromPlan.life_jackets_fluorescein_snapshot
      : aircraft.life_jackets_fluorescein,
    life_jackets_uhf_snapshot: alreadyConfirmed
      ? fromPlan.life_jackets_uhf_snapshot
      : aircraft.life_jackets_uhf,
    life_jackets_vhf_snapshot: alreadyConfirmed
      ? fromPlan.life_jackets_vhf_snapshot
      : aircraft.life_jackets_vhf,
    dinghies_present_snapshot: alreadyConfirmed
      ? fromPlan.dinghies_present_snapshot
      : (aircraft.dinghies_present ?? false),
    dinghies_cover_present_snapshot: alreadyConfirmed
      ? fromPlan.dinghies_cover_present_snapshot
      : (aircraft.dinghies_cover_present ?? false),
  };
}

export function aircraftFplFieldsToUpdate(
  fields: AircraftFplFields,
): Pick<
  FlightPlanUpdate,
  | "equipment_com_nav_snapshot"
  | "equipment_surveillance_snapshot"
  | "color_and_markings_snapshot"
  | "emergency_radio_uhf_snapshot"
  | "emergency_radio_vhf_snapshot"
  | "emergency_radio_elt_snapshot"
  | "survival_equipment_present_snapshot"
  | "survival_polar_snapshot"
  | "survival_desert_snapshot"
  | "survival_maritime_snapshot"
  | "survival_jungle_snapshot"
  | "life_jackets_present_snapshot"
  | "life_jackets_lights_snapshot"
  | "life_jackets_fluorescein_snapshot"
  | "life_jackets_uhf_snapshot"
  | "life_jackets_vhf_snapshot"
  | "dinghies_present_snapshot"
  | "dinghies_cover_present_snapshot"
> {
  return {
    equipment_com_nav_snapshot: fields.equipment_com_nav_snapshot.trim() || null,
    equipment_surveillance_snapshot: fields.equipment_surveillance_snapshot.trim() || null,
    color_and_markings_snapshot: fields.color_and_markings_snapshot.trim() || null,
    emergency_radio_uhf_snapshot: fields.emergency_radio_uhf_snapshot,
    emergency_radio_vhf_snapshot: fields.emergency_radio_vhf_snapshot,
    emergency_radio_elt_snapshot: fields.emergency_radio_elt_snapshot,
    survival_equipment_present_snapshot: fields.survival_equipment_present_snapshot,
    survival_polar_snapshot: fields.survival_polar_snapshot,
    survival_desert_snapshot: fields.survival_desert_snapshot,
    survival_maritime_snapshot: fields.survival_maritime_snapshot,
    survival_jungle_snapshot: fields.survival_jungle_snapshot,
    life_jackets_present_snapshot: fields.life_jackets_present_snapshot,
    life_jackets_lights_snapshot: fields.life_jackets_lights_snapshot,
    life_jackets_fluorescein_snapshot: fields.life_jackets_fluorescein_snapshot,
    life_jackets_uhf_snapshot: fields.life_jackets_uhf_snapshot,
    life_jackets_vhf_snapshot: fields.life_jackets_vhf_snapshot,
    dinghies_present_snapshot: fields.dinghies_present_snapshot,
    dinghies_cover_present_snapshot: fields.dinghies_cover_present_snapshot,
  };
}

type FplFieldItem = {
  id: string;
  casilla: string;
  label: string;
  value: string;
  editable: boolean;
  fieldKey?: keyof AircraftFplFields;
  placeholder?: string;
};

type BoolOption = { label: string; fieldKey: keyof AircraftFplFields };

type FplBoolGroupItem = {
  id: string;
  casilla: string;
  label: string;
  options: BoolOption[];
};

type FplItem = FplFieldItem | (FplBoolGroupItem & { kind: "bool-group" });

function formatWakeLabel(code: string | null | undefined): string {
  if (!code) return "—";
  const name = WAKE_LABELS[code.toUpperCase()];
  return name ? `${code.toUpperCase()} — ${name}` : code.toUpperCase();
}

function formatBoolGroup(fields: AircraftFplFields, options: BoolOption[]): string {
  const active = options.filter((o) => fields[o.fieldKey] === true).map((o) => o.label);
  return active.length > 0 ? active.join(" · ") : "Ninguno";
}

function buildFplFieldItems(
  flightPlan: FlightPlanPublic,
  aircraft: AircraftPublic | null | undefined,
  fields: AircraftFplFields,
): FplItem[] {
  const type =
    flightPlan.aircraft_type_designator_snapshot ?? aircraft?.icao_type_designator ?? "—";
  const wakeCode =
    flightPlan.wake_turbulence_category_snapshot ?? aircraft?.wake_turbulence_category ?? "";
  const wake = formatWakeLabel(wakeCode);

  const dinghiesCount =
    flightPlan.dinghies_number_snapshot ?? aircraft?.dinghies_number ?? null;
  const dinghiesCapacity =
    flightPlan.dinghies_capacity_snapshot ?? aircraft?.dinghies_capacity ?? null;

  const emergencyOptions: BoolOption[] = [
    { label: "UHF", fieldKey: "emergency_radio_uhf_snapshot" },
    { label: "VHF", fieldKey: "emergency_radio_vhf_snapshot" },
    { label: "ELT", fieldKey: "emergency_radio_elt_snapshot" },
  ];
  const survivalOptions: BoolOption[] = [
    { label: "Polar", fieldKey: "survival_polar_snapshot" },
    { label: "Desierto", fieldKey: "survival_desert_snapshot" },
    { label: "Marítimo", fieldKey: "survival_maritime_snapshot" },
    { label: "Jungla", fieldKey: "survival_jungle_snapshot" },
  ];
  const lifeJacketOptions: BoolOption[] = [
    { label: "Luces", fieldKey: "life_jackets_lights_snapshot" },
    { label: "Fluorescína", fieldKey: "life_jackets_fluorescein_snapshot" },
    { label: "UHF", fieldKey: "life_jackets_uhf_snapshot" },
    { label: "VHF", fieldKey: "life_jackets_vhf_snapshot" },
  ];

  const items: FplItem[] = [
    {
      id: "identification",
      casilla: "C7",
      label: "Identificación (call sign)",
      value: flightPlan.aircraft_identification_snapshot ?? aircraft?.identification ?? "—",
      editable: false,
    },
    {
      id: "type_wake",
      casilla: "C9",
      label: "Tipo ICAO + categoría de estela",
      value: wakeCode ? `${type} · ${wake}` : type,
      editable: false,
    },
    {
      id: "com_nav",
      casilla: "C10",
      label: "Equipo COM/NAV",
      value: fields.equipment_com_nav_snapshot || "—",
      editable: true,
      fieldKey: "equipment_com_nav_snapshot",
      placeholder: "Ej. S / C",
    },
    {
      id: "surveillance",
      casilla: "C10",
      label: "Equipo de vigilancia",
      value: fields.equipment_surveillance_snapshot || "—",
      editable: true,
      fieldKey: "equipment_surveillance_snapshot",
      placeholder: "Ej. C",
    },
    {
      id: "emergency_radio",
      kind: "bool-group",
      casilla: "C18",
      label: `Radio de emergencia — ${formatBoolGroup(fields, emergencyOptions)}`,
      options: emergencyOptions,
    } as FplBoolGroupItem & { kind: "bool-group" },
    {
      id: "survival",
      kind: "bool-group",
      casilla: "C18",
      label: `Supervivencia${fields.survival_equipment_present_snapshot ? ` — ${formatBoolGroup(fields, survivalOptions)}` : " — No lleva"}`,
      options: [
        { label: "Presente", fieldKey: "survival_equipment_present_snapshot" },
        ...survivalOptions,
      ],
    } as FplBoolGroupItem & { kind: "bool-group" },
    {
      id: "life_jackets",
      kind: "bool-group",
      casilla: "C18",
      label: `Chalecos salvavidas${fields.life_jackets_present_snapshot ? ` — ${formatBoolGroup(fields, lifeJacketOptions)}` : " — No lleva"}`,
      options: [
        { label: "Presentes", fieldKey: "life_jackets_present_snapshot" },
        ...lifeJacketOptions,
      ],
    } as FplBoolGroupItem & { kind: "bool-group" },
    {
      id: "color",
      casilla: "C18",
      label: "Color y marcas",
      value: fields.color_and_markings_snapshot || "—",
      editable: true,
      fieldKey: "color_and_markings_snapshot",
      placeholder: "Ej. BLU WHT",
    },
  ];

  if (dinghiesCount != null) {
    items.push({
      id: "dinghies",
      casilla: "C18",
      label: "Botes salvavidas",
      value: `${dinghiesCount} bote${dinghiesCount === 1 ? "" : "s"}${
        dinghiesCapacity != null ? ` · cap. ${dinghiesCapacity}` : ""
      }`,
      editable: false,
    });
  }

  return items;
}

function ConfirmProgressBar({ confirmed, total }: { confirmed: number; total: number }) {
  const ratio = total > 0 ? confirmed / total : 0;

  return (
    <View className="gap-2">
      <View className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
        <View
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </View>
      <Text className="text-right text-xs font-medium text-zinc-500">
        {confirmed}/{total} confirmados
      </Text>
    </View>
  );
}

function ConfirmableFplFieldRow({
  item,
  confirmed,
  isEditing,
  draftValue,
  onStartEdit,
  onDraftChange,
  onSaveEdit,
  onCancelEdit,
  onConfirm,
}: {
  item: FplFieldItem;
  confirmed: boolean;
  isEditing: boolean;
  draftValue: string;
  onStartEdit: () => void;
  onDraftChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onConfirm: () => void;
}) {
  const displayValue = item.value.trim() || "—";

  return (
    <View
      className={cn(
        "gap-3 rounded-2xl border p-4",
        confirmed ? "border-emerald-200 bg-emerald-50/40" : "border-zinc-200 bg-white",
      )}
    >
      <View className="flex-row items-start gap-3">
        <View className="min-w-0 flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <View className="rounded-md bg-zinc-100 px-2 py-0.5">
              <Text className="text-[10px] font-bold text-zinc-500">{item.casilla}</Text>
            </View>
            <Text className="flex-1 text-xs font-medium text-zinc-500">{item.label}</Text>
          </View>

          {!isEditing ? (
            <Text className="text-lg font-bold leading-snug text-zinc-950">{displayValue}</Text>
          ) : (
            <View className="gap-2 pt-1">
              <Input
                value={draftValue}
                onChangeText={onDraftChange}
                placeholder={item.placeholder}
                autoCapitalize="characters"
                autoFocus
                className="h-12 rounded-xl border-zinc-200 text-base"
              />
              <View className="flex-row gap-2">
                <Pressable
                  onPress={onCancelEdit}
                  className="flex-1 items-center rounded-xl border border-zinc-200 bg-white py-2.5"
                >
                  <Text className="text-sm font-medium text-zinc-600">Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={onSaveEdit}
                  className="flex-1 items-center rounded-xl bg-zinc-900 py-2.5"
                >
                  <Text className="text-sm font-medium text-white">Guardar</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {!isEditing ? (
          <View className="flex-row gap-2">
            {item.editable ? (
              <Pressable
                onPress={onStartEdit}
                className="h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 active:bg-zinc-100"
                accessibilityLabel={`Editar ${item.label}`}
              >
                <Pencil size={18} color="#52525b" strokeWidth={2} />
              </Pressable>
            ) : null}
            {item.editable ? (
              <Pressable
                onPress={onConfirm}
                disabled={confirmed}
                className={cn(
                  "h-11 w-11 items-center justify-center rounded-xl border",
                  confirmed
                    ? "border-emerald-500 bg-emerald-500"
                    : "border-zinc-200 bg-zinc-50 active:bg-emerald-50",
                )}
                accessibilityLabel={`Confirmar ${item.label}`}
              >
                <Check
                  size={18}
                  color={confirmed ? "#ffffff" : "#10b981"}
                  strokeWidth={2.5}
                />
              </Pressable>
            ) : confirmed ? (
              <View className="h-11 w-11 items-center justify-center rounded-xl border border-emerald-500 bg-emerald-500">
                <Check size={18} color="#ffffff" strokeWidth={2.5} />
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function BoolGroupFplFieldRow({
  item,
  confirmed,
  fields,
  onChange,
  onConfirm,
}: {
  item: FplBoolGroupItem & { kind: "bool-group" };
  confirmed: boolean;
  fields: AircraftFplFields;
  onChange: (patch: Partial<AircraftFplFields>) => void;
  onConfirm: () => void;
}) {
  return (
    <View
      className={cn(
        "gap-3 rounded-2xl border p-4",
        confirmed ? "border-emerald-200 bg-emerald-50/40" : "border-zinc-200 bg-white",
      )}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 gap-2">
          <View className="flex-row items-center gap-2">
            <View className="rounded-md bg-zinc-100 px-2 py-0.5">
              <Text className="text-[10px] font-bold text-zinc-500">{item.casilla}</Text>
            </View>
            <Text className="flex-1 text-xs font-medium text-zinc-500">{item.label}</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {item.options.map((opt) => {
              const active = Boolean(fields[opt.fieldKey]);
              return (
                <Pressable
                  key={opt.fieldKey as string}
                  onPress={() => onChange({ [opt.fieldKey]: !active })}
                  className={cn(
                    "rounded-full border px-3 py-1.5",
                    active ? "border-zinc-900 bg-zinc-900" : "border-zinc-200 bg-white",
                  )}
                >
                  <Text
                    className={cn(
                      "text-xs font-medium",
                      active ? "text-white" : "text-zinc-500",
                    )}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <Pressable
          onPress={onConfirm}
          disabled={confirmed}
          className={cn(
            "h-11 w-11 items-center justify-center rounded-xl border",
            confirmed
              ? "border-emerald-500 bg-emerald-500"
              : "border-zinc-200 bg-zinc-50 active:bg-emerald-50",
          )}
          accessibilityLabel={`Confirmar ${item.label}`}
        >
          <Check size={18} color={confirmed ? "#ffffff" : "#10b981"} strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}

type Step3AircraftSelectProps = {
  aircraft: AircraftPublic[];
  selectedAircraftId: string;
  isLoading: boolean;
  onSelect: (aircraftId: string) => void;
};

export function Step3AircraftSelect({
  aircraft,
  selectedAircraftId,
  isLoading,
  onSelect,
}: Step3AircraftSelectProps) {
  if (isLoading && aircraft.length === 0) {
    return (
      <View className="items-center gap-3 py-12">
        <ActivityIndicator color="#18181b" />
        <Text className="text-sm text-zinc-600">Cargando aeronaves...</Text>
      </View>
    );
  }

  if (aircraft.length === 0) {
    return (
      <View className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-8">
        <Text className="text-center text-sm text-zinc-600">
          No tenés aeronaves activas. Agregá una desde tu perfil para continuar.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-4">
      {aircraft.map((item) => (
        <AircraftListCard
          key={item.id}
          aircraft={item}
          mode="select"
          selected={selectedAircraftId === item.id}
          onPress={() => onSelect(item.id)}
        />
      ))}
    </View>
  );
}

type AircraftFplConfirmSheetProps = {
  visible: boolean;
  flightPlan: FlightPlanPublic | null;
  aircraft?: AircraftPublic | null;
  fields: AircraftFplFields;
  isSaving: boolean;
  error?: string | null;
  onChange: (patch: Partial<AircraftFplFields>) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function AircraftFplConfirmSheet({
  visible,
  flightPlan,
  aircraft,
  fields,
  isSaving,
  error,
  onChange,
  onClose,
  onConfirm,
}: AircraftFplConfirmSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [confirmedIds, setConfirmedIds] = React.useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draftValue, setDraftValue] = React.useState("");

  const fieldItems = React.useMemo(
    () => (flightPlan ? buildFplFieldItems(flightPlan, aircraft, fields) : []),
    [flightPlan, aircraft, fields],
  );

  const confirmableItems = React.useMemo(
    () =>
      fieldItems.filter(
        (item) => (item as FplFieldItem).editable || (item as { kind?: string }).kind === "bool-group",
      ),
    [fieldItems],
  );

  const confirmedEditableCount = confirmableItems.filter((item) => confirmedIds[item.id]).length;
  const allConfirmed =
    confirmableItems.length === 0 ||
    confirmableItems.every((item) => confirmedIds[item.id]);

  React.useEffect(() => {
    if (!visible) {
      setConfirmedIds({});
      setEditingId(null);
      setDraftValue("");
      return;
    }
    if (!flightPlan) return;

    const items = buildFplFieldItems(flightPlan, aircraft, fields);
    setConfirmedIds(() => {
      const next: Record<string, boolean> = {};
      for (const item of items) {
        const isEditable = (item as FplFieldItem).editable;
        const isBoolGroup = (item as { kind?: string }).kind === "bool-group";
        if (!isEditable && !isBoolGroup) next[item.id] = true;
      }
      return next;
    });
    // fields omitted: only seed read-only confirmations when the sheet opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, flightPlan, aircraft]);

  const unconfirm = React.useCallback((id: string) => {
    setConfirmedIds((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const handleStartEdit = React.useCallback(
    (item: FplFieldItem) => {
      if (!item.fieldKey) return;
      const raw = fields[item.fieldKey];
      if (typeof raw !== "string") return;
      setEditingId(item.id);
      setDraftValue(raw);
      unconfirm(item.id);
    },
    [fields, unconfirm],
  );

  const handleSaveEdit = React.useCallback(
    (item: FplFieldItem) => {
      if (!item.fieldKey) return;
      onChange({ [item.fieldKey]: draftValue.trim() });
      setEditingId(null);
      setDraftValue("");
    },
    [draftValue, onChange],
  );

  if (!flightPlan) return null;

  const sheetHeight = height * 0.86;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} />

        <View
          className="rounded-t-3xl border border-border border-b-0 bg-card"
          style={{
            height: sheetHeight,
            paddingBottom: insets.bottom + 16,
            flexDirection: "column",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <View className="shrink-0 items-center py-3">
            <View className="h-1 w-10 rounded-full bg-zinc-300" />
          </View>

          <View className="shrink-0 gap-3 px-5 pb-3">
            <View className="flex-row items-start justify-between gap-3">
              <View className="min-w-0 flex-1 gap-1">
                <Text className="text-xl font-bold text-zinc-950">Datos de la aeronave</Text>
                <Text className="text-sm leading-relaxed text-zinc-600">
                  Confirmá cada dato del plan. Podés editar antes de marcar.
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100"
                accessibilityLabel="Cerrar"
              >
                <X size={20} color="#52525b" />
              </Pressable>
            </View>
            <ConfirmProgressBar
              confirmed={confirmedEditableCount}
              total={confirmableItems.length || fieldItems.length}
            />
            {error ? (
              <Text className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</Text>
            ) : null}
          </View>

          <View style={{ flex: 1, minHeight: 0 }}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16, gap: 12 }}
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
            >
            {fieldItems.map((item) => {
              if ((item as { kind?: string }).kind === "bool-group") {
                const boolItem = item as FplBoolGroupItem & { kind: "bool-group" };
                return (
                  <BoolGroupFplFieldRow
                    key={item.id}
                    item={boolItem}
                    confirmed={Boolean(confirmedIds[item.id])}
                    fields={fields}
                    onChange={onChange}
                    onConfirm={() =>
                      setConfirmedIds((prev) => ({ ...prev, [item.id]: true }))
                    }
                  />
                );
              }
              const strItem = item as FplFieldItem;
              return (
                <ConfirmableFplFieldRow
                  key={item.id}
                  item={strItem}
                  confirmed={Boolean(confirmedIds[item.id])}
                  isEditing={editingId === item.id}
                  draftValue={draftValue}
                  onStartEdit={() => handleStartEdit(strItem)}
                  onDraftChange={setDraftValue}
                  onSaveEdit={() => handleSaveEdit(strItem)}
                  onCancelEdit={() => {
                    setEditingId(null);
                    setDraftValue("");
                  }}
                  onConfirm={() =>
                    setConfirmedIds((prev) => ({ ...prev, [item.id]: true }))
                  }
                />
              );
            })}
            </ScrollView>
          </View>

          <View className="shrink-0 border-t border-zinc-100 px-5 pt-4">
            <Button
              onPress={onConfirm}
              disabled={isSaving || !allConfirmed}
              className="h-14 rounded-2xl"
            >
              <Text className="text-base font-semibold text-primary-foreground">
                {isSaving
                  ? "Guardando..."
                  : allConfirmed
                    ? "Continuar"
                    : confirmableItems.length - confirmedEditableCount === 1
                      ? "Confirmá el dato restante"
                      : `Confirmá los ${confirmableItems.length - confirmedEditableCount} restantes`}
              </Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
