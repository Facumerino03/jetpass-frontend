import * as React from "react";
import { StyleSheet, View } from "react-native";
import {
  ArrowRight,
  Clock,
  MapPin,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  Radio,
  Route,
  Wind,
} from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import {
  computeArrivalFromHhmm,
  formatEetLabel,
  formatHhmm,
  shortenAerodromeLabel,
} from "./route-eet-utils";
import { formatDateDisplay } from "./eobt-utils";
import type { Step1Data } from "./step1-onboarding";
import type { FlightPlanPublic, FlightRules, FlightType } from "./types";

const RULE_LABELS: Record<FlightRules, string> = {
  V: "VFR — Vuelo visual",
  I: "IFR — Vuelo instrumental",
  Y: "IFR → VFR",
  Z: "VFR → IFR",
};

const TYPE_LABELS: Record<FlightType, string> = {
  G: "Aviación general",
  S: "Servicio regular",
  N: "No regular (charter)",
  M: "Militar",
  X: "Otro",
};


function formatEnduranceLabel(value: string): string {
  if (value.length !== 4) return value || "—";
  return `${value.slice(0, 2)}:${value.slice(2, 4)}`;
}

function display(value: string | number | null | undefined): string {
  if (value == null) return "—";
  const text = String(value).trim();
  return text || "—";
}

function ReviewSection({
  title,
  icon,
  children,
  className,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View
      className={cn(
        "gap-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm shadow-black/5",
        className,
      )}
    >
      <View className="flex-row items-center gap-2">
        {icon}
        <Text className="text-sm font-semibold text-zinc-900">{title}</Text>
      </View>
      {children}
    </View>
  );
}

function ReviewRow({
  label,
  value,
  casilla,
  mono,
}: {
  label: string;
  value: string;
  casilla?: string;
  mono?: boolean;
}) {
  return (
    <View className="gap-1">
      <View className="flex-row items-center gap-2">
        {casilla ? (
          <View className="rounded-md bg-zinc-100 px-1.5 py-0.5">
            <Text className="text-[10px] font-bold text-zinc-500">{casilla}</Text>
          </View>
        ) : null}
        <Text className="text-xs font-medium text-zinc-500">{label}</Text>
      </View>
      <Text
        className={cn(
          "text-sm leading-snug text-zinc-900",
          mono && "font-mono text-base font-semibold tracking-wide",
        )}
      >
        {value}
      </Text>
    </View>
  );
}

function RouteConnector() {
  return (
    <View className="mx-2 flex-1 flex-row items-center justify-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <View key={i} className="h-1 w-1 rounded-full bg-zinc-300" />
      ))}
      <Plane size={16} color="#a1a1aa" strokeWidth={2} style={{ marginHorizontal: 4 }} />
      {Array.from({ length: 5 }).map((_, i) => (
        <View key={`r-${i}`} className="h-1 w-1 rounded-full bg-zinc-300" />
      ))}
    </View>
  );
}

function FplActivityCard({
  departureIcao,
  destinationIcao,
  departureName,
  destinationName,
  departureTime,
  arrivalTime,
  eetLabel,
  eobtDate,
  aircraftLabel,
  operationLabel,
}: {
  departureIcao: string;
  destinationIcao: string;
  departureName?: string | null;
  destinationName?: string | null;
  departureTime: string | null;
  arrivalTime: string | null;
  eetLabel: string | null;
  eobtDate: string | null;
  aircraftLabel: string;
  operationLabel: string;
}) {
  return (
    <View
      className="overflow-hidden rounded-[22px] border border-zinc-200/90 bg-white"
      style={styles.activityCard}
    >
      <View className="gap-4 p-4">
        <View className="flex-row items-center justify-between">
          <View className="min-w-0 flex-1 flex-row items-center gap-2">
            <View className="h-7 w-7 items-center justify-center rounded-lg bg-sky-500">
              <Plane size={14} color="#ffffff" strokeWidth={2.2} />
            </View>
            <Text className="text-sm font-semibold text-zinc-500" numberOfLines={1}>
              {aircraftLabel}
            </Text>
          </View>
          <Text className="text-[10px] font-bold tracking-[0.18em] text-zinc-300">JETPASS</Text>
        </View>

        <View className="flex-row items-center">
          <View className="shrink-0 flex-row items-baseline gap-1.5">
            <Text className="font-mono text-[26px] font-bold leading-none text-zinc-950">
              {departureIcao}
            </Text>
            <Text className="font-mono text-xl font-semibold text-sky-600">
              {departureTime ?? "—"}
            </Text>
          </View>

          <RouteConnector />

          <View className="shrink-0 flex-row items-baseline gap-1.5">
            <Text className="font-mono text-xl font-semibold text-emerald-600">
              {arrivalTime ?? "—"}
            </Text>
            <Text className="font-mono text-[26px] font-bold leading-none text-zinc-950">
              {destinationIcao}
            </Text>
          </View>
        </View>

        {(departureName || destinationName) ? (
          <View className="flex-row justify-between px-0.5">
            <Text className="max-w-[42%] text-[11px] text-zinc-500" numberOfLines={1}>
              {shortenAerodromeLabel(departureName)}
            </Text>
            <Text className="max-w-[42%] text-right text-[11px] text-zinc-500" numberOfLines={1}>
              {shortenAerodromeLabel(destinationName)}
            </Text>
          </View>
        ) : null}

        <View className="relative h-3 justify-center">
          <View className="h-2 overflow-hidden rounded-full bg-zinc-100">
            <View className="h-full w-4 rounded-full bg-emerald-500" />
          </View>
          <View className="absolute left-0 top-1/2 -mt-3 h-6 w-6 items-center justify-center rounded-full bg-white">
            <PlaneTakeoff size={14} color="#a1a1aa" strokeWidth={2} />
          </View>
          <View className="absolute right-0 top-1/2 -mt-3 h-6 w-6 items-center justify-center rounded-full bg-white">
            <PlaneLanding size={14} color="#a1a1aa" strokeWidth={2} />
          </View>
        </View>

        <View className="flex-row items-end justify-between">
          <View className="max-w-[30%] gap-0.5">
            <Text className="text-sm font-semibold text-zinc-700">{operationLabel}</Text>
            {eobtDate ? (
              <Text className="text-[11px] text-zinc-400">EOBT {eobtDate}</Text>
            ) : null}
          </View>

          <View className="items-center px-2">
            <Text className="text-[26px] font-bold leading-none tracking-tight text-zinc-950">
              {eetLabel ?? "—"}
            </Text>
            <Text className="mt-1 text-[10px] font-bold tracking-[0.14em] text-zinc-400">
              TIEMPO EN RUTA
            </Text>
          </View>

          <Text className="max-w-[30%] text-right text-sm font-semibold text-emerald-600">
            Listo para enviar
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  activityCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
});

export type Step7ReviewProps = {
  flightPlan: FlightPlanPublic;
  step1Data: Step1Data;
  flightRules: FlightRules | "";
  flightType: FlightType | "";
  flightStep: {
    cruising_speed: string;
    cruising_level: string;
    route: string;
    total_eet: string;
  };
  operationalStep: {
    endurance: string;
    persons_on_board: string;
  };
  otherInformation: string;
  onOtherInformationChange: (value: string) => void;
};

export function Step7Review({
  flightPlan,
  step1Data,
  flightRules,
  flightType,
  flightStep,
  operationalStep,
  otherInformation,
  onOtherInformationChange,
}: Step7ReviewProps) {
  const eetLabel = formatEetLabel(flightStep.total_eet);
  const departureTime = formatHhmm(flightPlan.departure_time_utc);
  const arrivalTime = computeArrivalFromHhmm(flightPlan.departure_time_utc, flightStep.total_eet);
  const eobtDate = formatDateDisplay(flightPlan.flight_date);

  const rulesLabel =
    flightRules && RULE_LABELS[flightRules as FlightRules]
      ? RULE_LABELS[flightRules as FlightRules]
      : "—";
  const typeLabel =
    flightType && TYPE_LABELS[flightType as FlightType]
      ? `${flightType} — ${TYPE_LABELS[flightType as FlightType]}`
      : "—";

  const aircraftLine = [
    flightPlan.aircraft_identification_snapshot,
    flightPlan.aircraft_type_designator_snapshot,
    flightPlan.wake_turbulence_category_snapshot
      ? `Estela ${flightPlan.wake_turbulence_category_snapshot}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const equipmentLine = [
    flightPlan.equipment_com_nav_snapshot
      ? `COM/NAV ${flightPlan.equipment_com_nav_snapshot}`
      : null,
    flightPlan.equipment_surveillance_snapshot
      ? `SSR ${flightPlan.equipment_surveillance_snapshot}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const emergencyRadioParts = [
    flightPlan.emergency_radio_uhf_snapshot && "UHF",
    flightPlan.emergency_radio_vhf_snapshot && "VHF",
    flightPlan.emergency_radio_elt_snapshot && "ELT",
  ].filter(Boolean);
  const survivalParts = [
    flightPlan.survival_polar_snapshot && "Polar",
    flightPlan.survival_desert_snapshot && "Desierto",
    flightPlan.survival_maritime_snapshot && "Marítimo",
    flightPlan.survival_jungle_snapshot && "Jungla",
  ].filter(Boolean);
  const lifeJacketParts = [
    flightPlan.life_jackets_lights_snapshot && "Luces",
    flightPlan.life_jackets_fluorescein_snapshot && "Fluorescína",
    flightPlan.life_jackets_uhf_snapshot && "UHF",
    flightPlan.life_jackets_vhf_snapshot && "VHF",
  ].filter(Boolean);
  const survivalLine = [
    emergencyRadioParts.length > 0 ? `Radio ${emergencyRadioParts.join("/")}` : null,
    flightPlan.survival_equipment_present_snapshot && survivalParts.length > 0
      ? `SAR ${survivalParts.join("/")}` : null,
    flightPlan.life_jackets_present_snapshot && lifeJacketParts.length > 0
      ? `Chalecos ${lifeJacketParts.join("/")}` : null,
    flightPlan.color_and_markings_snapshot
      ? `Color ${flightPlan.color_and_markings_snapshot}`
      : null,
    flightPlan.dinghies_present_snapshot && flightPlan.dinghies_number_snapshot != null
      ? `Botes ${flightPlan.dinghies_number_snapshot}${
          flightPlan.dinghies_capacity_snapshot != null
            ? `/${flightPlan.dinghies_capacity_snapshot}`
            : ""
        }`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const speedLevel = [flightStep.cruising_speed, flightStep.cruising_level]
    .filter((v) => v.trim())
    .join(" / ");

  const aircraftHeader = [
    flightPlan.aircraft_identification_snapshot,
    flightPlan.aircraft_type_designator_snapshot,
  ]
    .filter(Boolean)
    .join(" · ");

  const operationHeader =
    flightRules && flightType ? `${flightRules}/${flightType}` : display(flightRules || flightType);

  return (
    <View className="gap-4">
      <FplActivityCard
        departureIcao={flightPlan.departure_aerodrome_icao}
        destinationIcao={flightPlan.destination_aerodrome_icao}
        departureName={step1Data.departure?.name}
        destinationName={step1Data.destination?.name}
        departureTime={departureTime}
        arrivalTime={arrivalTime}
        eetLabel={eetLabel}
        eobtDate={eobtDate}
        aircraftLabel={aircraftHeader || "Aeronave"}
        operationLabel={operationHeader}
      />

      <ReviewSection title="Viaje" icon={<MapPin size={16} color="#0ea5e9" />}>
        <ReviewRow
          casilla="C13"
          label="Fecha y hora de salida (UTC)"
          value={`${eobtDate ?? "—"} ${departureTime ?? ""}`.trim()}
          mono
        />
        <ReviewRow
          casilla="C16"
          label="Alternativo 1"
          value={display(flightPlan.alternate1_aerodrome_icao)}
          mono
        />
        <ReviewRow
          casilla="C16"
          label="Alternativo 2"
          value={display(flightPlan.alternate2_aerodrome_icao)}
          mono
        />
      </ReviewSection>

      <ReviewSection title="Operación" icon={<Wind size={16} color="#8b5cf6" />}>
        <ReviewRow casilla="C8" label="Reglas de vuelo" value={rulesLabel} />
        <ReviewRow casilla="C8" label="Tipo de vuelo" value={typeLabel} />
      </ReviewSection>

      <ReviewSection title="Aeronave" icon={<Plane size={16} color="#059669" />}>
        <ReviewRow casilla="C7" label="Identificación y tipo" value={display(aircraftLine)} mono />
        {equipmentLine ? (
          <ReviewRow casilla="C10" label="Equipamiento" value={equipmentLine} mono />
        ) : null}
        {survivalLine ? (
          <ReviewRow casilla="C18" label="Emergencia y supervivencia" value={survivalLine} />
        ) : null}
      </ReviewSection>

      <ReviewSection title="Ruta y crucero" icon={<Route size={16} color="#d97706" />}>
        <ReviewRow
          casilla="C15"
          label="Ruta"
          value={display(flightStep.route)}
          mono
        />
        {speedLevel ? (
          <ReviewRow casilla="C15" label="Velocidad / Nivel" value={speedLevel} mono />
        ) : null}
        {(flightRules === "Y" || flightRules === "Z") ? (
          <ReviewRow
            casilla="C15"
            label="Punto de cambio (en ruta)"
            value="Incluido en la ruta"
          />
        ) : null}
      </ReviewSection>

      <ReviewSection title="Operacional del día" icon={<Clock size={16} color="#e11d48" />}>
        <ReviewRow
          casilla="C15"
          label="Tiempo en ruta (EET)"
          value={eetLabel ?? display(flightStep.total_eet)}
        />
        <ReviewRow
          casilla="C19"
          label="Autonomía"
          value={formatEnduranceLabel(operationalStep.endurance)}
          mono
        />
        <ReviewRow
          casilla="C19"
          label="Personas a bordo"
          value={display(operationalStep.persons_on_board)}
        />
      </ReviewSection>

      <ReviewSection title="Información adicional" icon={<Radio size={16} color="#71717a" />}>
        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <View className="rounded-md bg-zinc-100 px-1.5 py-0.5">
              <Text className="text-[10px] font-bold text-zinc-500">C18</Text>
            </View>
            <Text className="text-xs font-medium text-zinc-500">
              Otros datos o remarks (opcional)
            </Text>
          </View>
          <Input
            value={otherInformation}
            onChangeText={onOtherInformationChange}
            placeholder="RMK/TRAINING"
            autoCapitalize="characters"
            className="h-14 rounded-2xl border-zinc-200 font-mono"
          />
        </View>
      </ReviewSection>

      <View className="flex-row items-center justify-center gap-2 rounded-xl bg-zinc-50 px-4 py-3">
        <ArrowRight size={14} color="#71717a" />
        <Text className="text-center text-xs leading-relaxed text-zinc-500">
          Revisá que todo coincida con tu intención de vuelo antes de enviar.
        </Text>
      </View>
    </View>
  );
}
