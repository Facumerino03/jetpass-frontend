# Flight Plan MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Flight Plan creation MVP with a dedicated feature module, six-step wizard, core API integration, and basic plan listing.

**Architecture:** Create `src/features/flight-plans` for API wrappers, domain types, aerodrome selector, wizard, and list UI. Keep route files thin wrappers that pass authenticated session state into feature components. Persist server draft state after Step 1 and PATCH completed steps afterward.

**Tech Stack:** Expo Router, React Native, TypeScript, NativeWind, existing `apiRequest`, existing `useAuth`, existing aircraft API.

---

## Scope Notes

The user's recommended order is correct. The only adjustment is scope control: `GET /flight-plans/{id}` should be typed and wrapped in the API module now, but the MVP UI should not add draft rehydration/detail navigation unless explicitly requested after this implementation. The approved spec excludes editing existing drafts from the list.

## File Structure

- Create `src/features/flight-plans/types.ts`: all FPL API types, enum options, status labels, and local helpers.
- Create `src/features/flight-plans/flight-plan-api.ts`: typed API wrappers for controlled aerodromes, create/update/get/list/submit, and aerodrome intelligence.
- Create `src/features/flight-plans/aerodrome-combobox.tsx`: catalog-backed selector that stores only selected catalog ICAO values.
- Create `src/features/flight-plans/flight-plan-wizard.tsx`: six-step wizard state machine, validation, PATCH/POST orchestration, error routing.
- Create `src/features/flight-plans/flight-plan-list.tsx`: list UI using `GET /flight-plans`.
- Modify `src/app/(tabs)/create-fpl.tsx`: render wizard with auth token.
- Modify `src/app/(tabs)/plans.tsx`: render list with auth token.

## Task 1: Base API And Types

**Files:**

- Create: `src/features/flight-plans/types.ts`
- Create: `src/features/flight-plans/flight-plan-api.ts`

- [ ] **Step 1: Create FPL domain types**

Add `src/features/flight-plans/types.ts`:

```ts
export type FlightRules = "V" | "I" | "Y" | "Z";
export type FlightType = "G" | "S" | "N" | "M" | "X";
export type WakeTurbulenceCat = "L" | "M" | "H" | "J";

export type FlightPlanStatus =
  | "draft"
  | "filed"
  | "pending_approval"
  | "accepted"
  | "rejected"
  | "active"
  | "closed"
  | "cancelled";

export interface ControlledAerodrome {
  id: string;
  icao_code: string;
  name: string;
  is_active: boolean;
}

export interface IntelligenceAerodromeRequest {
  icao: string;
  force_refresh?: boolean;
}

export interface IntelligenceRunResponse {
  intent: string;
  aerodrome: Record<string, unknown> | null;
  notam: Record<string, unknown> | null;
  alerts: Record<string, unknown>[];
  metadata: Record<string, unknown>;
}

export interface FlightPlanCreate {
  departure_aerodrome_icao: string;
  departure_eobt_utc: string;
  destination_aerodrome_icao: string;
  alternate1_aerodrome_icao: string;
  alternate2_aerodrome_icao: string;
}

export interface FlightPlanUpdate {
  flight_rules?: FlightRules | null;
  flight_type?: FlightType | null;
  aircraft_id?: string | null;
  aircraft_identification_snapshot?: string | null;
  aircraft_type_designator_snapshot?: string | null;
  wake_turbulence_category_snapshot?: WakeTurbulenceCat | null;
  equipment_com_nav_snapshot?: string | null;
  equipment_surveillance_snapshot?: string | null;
  emergency_radio_snapshot?: string | null;
  survival_equipment_snapshot?: string | null;
  life_jackets_snapshot?: string | null;
  dinghies_number_snapshot?: number | null;
  dinghies_capacity_snapshot?: number | null;
  dinghies_cover_snapshot?: boolean | null;
  dinghies_color_snapshot?: string | null;
  color_and_markings_snapshot?: string | null;
  cruising_speed?: string | null;
  cruising_level?: string | null;
  route?: string | null;
  rule_change_point?: string | null;
  total_eet?: string | null;
  other_information?: string | null;
  endurance?: string | null;
  persons_on_board?: number | null;
}

export interface FlightPlanPublic extends Required<FlightPlanCreate> {
  id: string;
  pilot_user_id: string;
  aircraft_id: string | null;
  status: FlightPlanStatus;
  flight_rules: FlightRules | null;
  flight_type: FlightType | null;
  cruising_speed: string | null;
  cruising_level: string | null;
  route: string | null;
  rule_change_point: string | null;
  total_eet: string | null;
  other_information: string | null;
  endurance: string | null;
  persons_on_board: number | null;
  aircraft_identification_snapshot: string | null;
  aircraft_type_designator_snapshot: string | null;
  wake_turbulence_category_snapshot: WakeTurbulenceCat | null;
  equipment_com_nav_snapshot: string | null;
  equipment_surveillance_snapshot: string | null;
  emergency_radio_snapshot: string | null;
  survival_equipment_snapshot: string | null;
  life_jackets_snapshot: string | null;
  dinghies_number_snapshot: number | null;
  dinghies_capacity_snapshot: number | null;
  dinghies_cover_snapshot: boolean | null;
  dinghies_color_snapshot: string | null;
  color_and_markings_snapshot: string | null;
  aircraft_snapshot_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FlightPlanSubmitResponse {
  id: string;
  status: FlightPlanStatus;
}

export const FLIGHT_RULE_OPTIONS: { label: string; value: FlightRules }[] = [
  { label: "VFR (V)", value: "V" },
  { label: "IFR (I)", value: "I" },
  { label: "IFR luego VFR (Y)", value: "Y" },
  { label: "VFR luego IFR (Z)", value: "Z" },
];

export const FLIGHT_TYPE_OPTIONS: { label: string; value: FlightType }[] = [
  { label: "General (G)", value: "G" },
  { label: "Scheduled (S)", value: "S" },
  { label: "Non-scheduled (N)", value: "N" },
  { label: "Military (M)", value: "M" },
  { label: "Other (X)", value: "X" },
];

export const FPL_STATUS_LABELS: Record<FlightPlanStatus, string> = {
  draft: "Borrador",
  filed: "Presentado",
  pending_approval: "Pendiente",
  accepted: "Aceptado",
  rejected: "Rechazado",
  active: "Activo",
  closed: "Cerrado",
  cancelled: "Cancelado",
};
```

- [ ] **Step 2: Create API wrappers**

Add `src/features/flight-plans/flight-plan-api.ts`:

```ts
import { apiRequest } from "@/lib/api";
import type {
  ControlledAerodrome,
  FlightPlanCreate,
  FlightPlanPublic,
  FlightPlanSubmitResponse,
  FlightPlanUpdate,
  IntelligenceRunResponse,
} from "./types";

export async function listControlledAerodromes(
  accessToken: string,
  params: { query?: string; limit?: number } = {},
): Promise<ControlledAerodrome[]> {
  const searchParams = new URLSearchParams();
  if (params.query?.trim()) searchParams.set("query", params.query.trim());
  if (params.limit) searchParams.set("limit", params.limit.toString());
  const queryString = searchParams.toString();

  return apiRequest<ControlledAerodrome[]>(
    `/flight-plans/aerodromes${queryString ? `?${queryString}` : ""}`,
    { accessToken },
  );
}

export async function runAerodromeIntelligence(
  accessToken: string,
  icao: string,
): Promise<IntelligenceRunResponse> {
  return apiRequest<IntelligenceRunResponse>("/flight-plans/intelligence/aerodrome", {
    method: "POST",
    body: { icao, force_refresh: false },
    accessToken,
  });
}

export async function createFlightPlan(
  accessToken: string,
  data: FlightPlanCreate,
): Promise<FlightPlanPublic> {
  return apiRequest<FlightPlanPublic>("/flight-plans", {
    method: "POST",
    body: data,
    accessToken,
  });
}

export async function updateFlightPlan(
  accessToken: string,
  flightPlanId: string,
  data: FlightPlanUpdate,
): Promise<FlightPlanPublic> {
  return apiRequest<FlightPlanPublic>(`/flight-plans/${flightPlanId}`, {
    method: "PATCH",
    body: data,
    accessToken,
  });
}

export async function getFlightPlan(
  accessToken: string,
  flightPlanId: string,
): Promise<FlightPlanPublic> {
  return apiRequest<FlightPlanPublic>(`/flight-plans/${flightPlanId}`, { accessToken });
}

export async function listFlightPlans(accessToken: string): Promise<FlightPlanPublic[]> {
  return apiRequest<FlightPlanPublic[]>("/flight-plans", { accessToken });
}

export async function submitFlightPlan(
  accessToken: string,
  flightPlanId: string,
): Promise<FlightPlanSubmitResponse> {
  return apiRequest<FlightPlanSubmitResponse>(`/flight-plans/${flightPlanId}/submit`, {
    method: "POST",
    accessToken,
  });
}
```

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: lint completes or reports only pre-existing unrelated issues.

## Task 2: Aerodrome Combobox

**Files:**

- Create: `src/features/flight-plans/aerodrome-combobox.tsx`

- [ ] **Step 1: Implement catalog-backed selector**

Add `src/features/flight-plans/aerodrome-combobox.tsx`:

```tsx
import * as React from "react";
import { Pressable, View } from "react-native";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { getErrorMessage } from "@/lib/api";
import { listControlledAerodromes, runAerodromeIntelligence } from "./flight-plan-api";
import type { ControlledAerodrome } from "./types";

type AerodromeComboboxProps = {
  accessToken: string;
  label: string;
  selected: ControlledAerodrome | null;
  onSelect: (aerodrome: ControlledAerodrome) => void;
  onWarning: (message: string) => void;
};

export function AerodromeCombobox({
  accessToken,
  label,
  selected,
  onSelect,
  onWarning,
}: AerodromeComboboxProps) {
  const [query, setQuery] = React.useState(selected?.icao_code ?? "");
  const [results, setResults] = React.useState<ControlledAerodrome[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    setQuery(selected ? selected.icao_code : "");
  }, [selected]);

  const search = React.useCallback(
    async (nextQuery: string) => {
      setIsLoading(true);
      try {
        const data = await listControlledAerodromes(accessToken, {
          query: nextQuery,
          limit: 20,
        });
        setResults(data.filter((item) => item.is_active));
      } catch (error) {
        onWarning(getErrorMessage(error, "No se pudieron cargar aerodromos."));
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken, onWarning],
  );

  const handleChangeText = React.useCallback(
    (text: string) => {
      const next = text.toUpperCase();
      setQuery(next);
      setIsOpen(true);
      void search(next);
    },
    [search],
  );

  const handleFocus = React.useCallback(() => {
    setIsOpen(true);
    void search(query);
  }, [query, search]);

  const handleSelect = React.useCallback(
    (aerodrome: ControlledAerodrome) => {
      onSelect(aerodrome);
      setQuery(aerodrome.icao_code);
      setIsOpen(false);
      void runAerodromeIntelligence(accessToken, aerodrome.icao_code).catch(() => {
        onWarning(`No se pudo enriquecer ${aerodrome.icao_code} ahora. Podes continuar.`);
      });
    },
    [accessToken, onSelect, onWarning],
  );

  return (
    <View className="gap-2">
      <Text className="text-sm text-zinc-500">{label}</Text>
      <Input
        value={query}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        placeholder="Buscar aerodromo"
        autoCapitalize="characters"
        className="rounded-2xl border-zinc-200 bg-white"
      />
      {selected && selected.icao_code === query ? (
        <Text className="text-xs text-zinc-500">Seleccionado: {selected.icao_code} - {selected.name}</Text>
      ) : (
        <Text className="text-xs text-amber-600">Selecciona un aerodromo del catalogo.</Text>
      )}
      {isOpen && (
        <View className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          {isLoading ? <Text className="p-3 text-sm text-zinc-500">Buscando...</Text> : null}
          {!isLoading && results.length === 0 ? (
            <Text className="p-3 text-sm text-zinc-500">Sin resultados</Text>
          ) : null}
          {results.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => handleSelect(item)}
              className="border-b border-zinc-100 p-3 active:bg-zinc-50"
            >
              <Text className="font-semibold text-zinc-900">{item.icao_code}</Text>
              <Text className="text-sm text-zinc-500">{item.name}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
```

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: no lint errors from `aerodrome-combobox.tsx`.

## Task 3: Wizard Steps 1 And 2

**Files:**

- Create: `src/features/flight-plans/flight-plan-wizard.tsx`
- Modify: `src/app/(tabs)/create-fpl.tsx`

- [ ] **Step 1: Implement wizard shell, Step 1, and Step 2**

Add `src/features/flight-plans/flight-plan-wizard.tsx` with Step 1 and Step 2 working. Keep later steps as disabled panels until subsequent tasks replace them:

```tsx
import * as React from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { getErrorMessage } from "@/lib/api";
import { AerodromeCombobox } from "./aerodrome-combobox";
import { createFlightPlan, updateFlightPlan } from "./flight-plan-api";
import type { ControlledAerodrome, FlightPlanPublic, FlightRules, FlightType } from "./types";
import { FLIGHT_RULE_OPTIONS, FLIGHT_TYPE_OPTIONS } from "./types";

type FlightPlanWizardProps = { accessToken: string };

type Step1State = {
  departure: ControlledAerodrome | null;
  destination: ControlledAerodrome | null;
  alternate1: ControlledAerodrome | null;
  alternate2: ControlledAerodrome | null;
  eobtLocal: string;
};

const STEP_TITLES = [
  "El viaje",
  "Tipo de operacion",
  "Aeronave",
  "El vuelo",
  "Operacional del dia",
  "Revision final",
];

function toUtcIso(localValue: string) {
  const parsed = new Date(localValue);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function areAerodromesDistinct(values: (ControlledAerodrome | null)[]) {
  const codes = values.map((item) => item?.icao_code).filter(Boolean);
  return codes.length === new Set(codes).size;
}

export function FlightPlanWizard({ accessToken }: FlightPlanWizardProps) {
  const [step, setStep] = React.useState(1);
  const [flightPlan, setFlightPlan] = React.useState<FlightPlanPublic | null>(null);
  const [warning, setWarning] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [step1, setStep1] = React.useState<Step1State>({
    departure: null,
    destination: null,
    alternate1: null,
    alternate2: null,
    eobtLocal: "",
  });
  const [flightRules, setFlightRules] = React.useState<FlightRules | "">("");
  const [flightType, setFlightType] = React.useState<FlightType | "">("");

  const setStep1Field = React.useCallback(<K extends keyof Step1State>(key: K, value: Step1State[K]) => {
    setStep1((prev) => ({ ...prev, [key]: value }));
  }, []);

  const createDraft = React.useCallback(async () => {
    setError(null);
    const aerodromes = [step1.departure, step1.destination, step1.alternate1, step1.alternate2];
    if (aerodromes.some((item) => !item)) {
      setError("Selecciona salida, destino y dos alternativos del catalogo.");
      return;
    }
    if (!areAerodromesDistinct(aerodromes)) {
      setError("Los cuatro aerodromos deben ser distintos.");
      return;
    }
    const departureEobtUtc = toUtcIso(step1.eobtLocal);
    if (!departureEobtUtc) {
      setError("Ingresa una EOBT local valida.");
      return;
    }

    setIsSaving(true);
    try {
      const created = await createFlightPlan(accessToken, {
        departure_aerodrome_icao: step1.departure!.icao_code,
        departure_eobt_utc: departureEobtUtc,
        destination_aerodrome_icao: step1.destination!.icao_code,
        alternate1_aerodrome_icao: step1.alternate1!.icao_code,
        alternate2_aerodrome_icao: step1.alternate2!.icao_code,
      });
      setFlightPlan(created);
      setStep(2);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }, [accessToken, step1]);

  const saveOperation = React.useCallback(async () => {
    setError(null);
    if (!flightPlan) {
      setError("Primero completa el viaje.");
      setStep(1);
      return;
    }
    if (!flightRules || !flightType) {
      setError("Selecciona reglas de vuelo y tipo de operacion.");
      return;
    }
    setIsSaving(true);
    try {
      const updated = await updateFlightPlan(accessToken, flightPlan.id, {
        flight_rules: flightRules,
        flight_type: flightType,
      });
      setFlightPlan(updated);
      setStep(3);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }, [accessToken, flightPlan, flightRules, flightType]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-zinc-50">
      <ScrollView contentContainerClassName="gap-5 px-4 py-6">
        <View className="gap-2">
          <Text className="text-sm font-medium text-zinc-500">Paso {step} / 6</Text>
          <Text className="text-3xl font-bold text-zinc-950">{STEP_TITLES[step - 1]}</Text>
          <View className="mt-2 flex-row gap-2">
            {STEP_TITLES.map((title, index) => (
              <Pressable key={title} onPress={() => index + 1 < step && setStep(index + 1)} className={`h-1 flex-1 rounded-full ${index + 1 <= step ? "bg-zinc-900" : "bg-zinc-200"}`} />
            ))}
          </View>
        </View>

        {warning ? <Text className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-700">{warning}</Text> : null}
        {error ? <Text className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</Text> : null}

        {step === 1 ? (
          <View className="gap-4 rounded-3xl border border-zinc-200 bg-white p-4">
            <AerodromeCombobox accessToken={accessToken} label="Salida" selected={step1.departure} onSelect={(value) => setStep1Field("departure", value)} onWarning={setWarning} />
            <Input value={step1.eobtLocal} onChangeText={(value) => setStep1Field("eobtLocal", value)} placeholder="2026-05-18T11:30:00" className="rounded-2xl border-zinc-200" />
            <AerodromeCombobox accessToken={accessToken} label="Destino" selected={step1.destination} onSelect={(value) => setStep1Field("destination", value)} onWarning={setWarning} />
            <AerodromeCombobox accessToken={accessToken} label="Alternativo 1" selected={step1.alternate1} onSelect={(value) => setStep1Field("alternate1", value)} onWarning={setWarning} />
            <AerodromeCombobox accessToken={accessToken} label="Alternativo 2" selected={step1.alternate2} onSelect={(value) => setStep1Field("alternate2", value)} onWarning={setWarning} />
            <Button onPress={createDraft} disabled={isSaving}><Text className="font-semibold text-white">Crear borrador</Text></Button>
          </View>
        ) : null}

        {step === 2 ? (
          <View className="gap-4 rounded-3xl border border-zinc-200 bg-white p-4">
            <Select value={flightRules} onChange={(value) => setFlightRules(value as FlightRules)} options={FLIGHT_RULE_OPTIONS} placeholder="Reglas de vuelo" />
            <Select value={flightType} onChange={(value) => setFlightType(value as FlightType)} options={FLIGHT_TYPE_OPTIONS} placeholder="Tipo de vuelo" />
            <Button onPress={saveOperation} disabled={isSaving}><Text className="font-semibold text-white">Guardar y continuar</Text></Button>
          </View>
        ) : null}

        {step >= 3 ? (
          <View className="rounded-3xl border border-zinc-200 bg-white p-4">
            <Text className="text-zinc-500">Este paso se implementa en la siguiente tarea.</Text>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
```

- [ ] **Step 2: Wire create route**

Replace `src/app/(tabs)/create-fpl.tsx` with:

```tsx
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/features/auth/auth-context";
import { FlightPlanWizard } from "@/features/flight-plans/flight-plan-wizard";

export default function CreateFplScreen() {
  const { session } = useAuth();

  if (!session) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-center text-muted-foreground">Inicia sesion para crear un FPL.</Text>
      </View>
    );
  }

  return <FlightPlanWizard accessToken={session.access_token} />;
}
```

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: no lint errors from the new wizard shell.

## Task 4: Step 3 Aircraft Selection And Snapshot Overrides

**Files:**

- Modify: `src/features/flight-plans/flight-plan-wizard.tsx`

- [ ] **Step 1: Add aircraft state and handlers**

Update imports in `flight-plan-wizard.tsx`:

```tsx
import { listAircraft } from "@/features/aircraft/aircraft-api";
import type { AircraftPublic } from "@/features/aircraft/types";
```

Add state inside `FlightPlanWizard`:

```tsx
const [aircraft, setAircraft] = React.useState<AircraftPublic[]>([]);
const [selectedAircraftId, setSelectedAircraftId] = React.useState("");
const [snapshotOverrides, setSnapshotOverrides] = React.useState({
  equipment_com_nav_snapshot: "",
  equipment_surveillance_snapshot: "",
  emergency_radio_snapshot: "",
  survival_equipment_snapshot: "",
  life_jackets_snapshot: "",
  color_and_markings_snapshot: "",
});
```

Add aircraft loader and selection handler:

```tsx
React.useEffect(() => {
  if (step !== 3) return;
  let isMounted = true;
  listAircraft(accessToken)
    .then((data) => {
      if (isMounted) setAircraft(data.filter((item) => item.is_active));
    })
    .catch((err) => setError(getErrorMessage(err, "No se pudieron cargar aeronaves.")));
  return () => {
    isMounted = false;
  };
}, [accessToken, step]);

const selectAircraft = React.useCallback(
  async (aircraftId: string) => {
    if (!flightPlan) return;
    setError(null);
    setIsSaving(true);
    try {
      const updated = await updateFlightPlan(accessToken, flightPlan.id, { aircraft_id: aircraftId });
      setFlightPlan(updated);
      setSelectedAircraftId(aircraftId);
      setSnapshotOverrides({
        equipment_com_nav_snapshot: updated.equipment_com_nav_snapshot ?? "",
        equipment_surveillance_snapshot: updated.equipment_surveillance_snapshot ?? "",
        emergency_radio_snapshot: updated.emergency_radio_snapshot ?? "",
        survival_equipment_snapshot: updated.survival_equipment_snapshot ?? "",
        life_jackets_snapshot: updated.life_jackets_snapshot ?? "",
        color_and_markings_snapshot: updated.color_and_markings_snapshot ?? "",
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  },
  [accessToken, flightPlan],
);

const saveAircraftStep = React.useCallback(async () => {
  if (!flightPlan || !selectedAircraftId) {
    setError("Selecciona una aeronave.");
    return;
  }
  setIsSaving(true);
  try {
    const updated = await updateFlightPlan(accessToken, flightPlan.id, snapshotOverrides);
    setFlightPlan(updated);
    setStep(4);
  } catch (err) {
    setError(getErrorMessage(err));
  } finally {
    setIsSaving(false);
  }
}, [accessToken, flightPlan, selectedAircraftId, snapshotOverrides]);
```

- [ ] **Step 2: Replace Step 3 temporary UI**

Replace the `step >= 3` temporary panel with a dedicated Step 3 branch before later temporary panels:

```tsx
{step === 3 ? (
  <View className="gap-4 rounded-3xl border border-zinc-200 bg-white p-4">
    <Select
      value={selectedAircraftId}
      onChange={selectAircraft}
      options={aircraft.map((item) => ({
        label: `${item.identification} - ${item.icao_type_designator}`,
        value: item.id,
      }))}
      placeholder="Seleccionar aeronave"
    />
    {flightPlan?.aircraft_identification_snapshot ? (
      <View className="gap-2 rounded-2xl bg-zinc-50 p-3">
        <Text className="font-semibold text-zinc-900">Snapshot de aeronave</Text>
        <Text className="text-sm text-zinc-600">Matricula: {flightPlan.aircraft_identification_snapshot}</Text>
        <Text className="text-sm text-zinc-600">Tipo ICAO: {flightPlan.aircraft_type_designator_snapshot}</Text>
        <Text className="text-sm text-zinc-600">Estela: {flightPlan.wake_turbulence_category_snapshot}</Text>
        <Text className="text-sm text-zinc-600">COM/NAV: {flightPlan.equipment_com_nav_snapshot}</Text>
        <Text className="text-sm text-zinc-600">Vigilancia: {flightPlan.equipment_surveillance_snapshot}</Text>
        <Text className="text-sm text-zinc-600">Emergencia: {flightPlan.emergency_radio_snapshot ?? "-"}</Text>
        <Text className="text-sm text-zinc-600">SAR: {flightPlan.survival_equipment_snapshot ?? "-"}</Text>
        <Text className="text-sm text-zinc-600">Chalecos: {flightPlan.life_jackets_snapshot ?? "-"}</Text>
        <Text className="text-sm text-zinc-600">Botes: {flightPlan.dinghies_number_snapshot ?? 0} / cap. {flightPlan.dinghies_capacity_snapshot ?? 0}</Text>
        <Text className="text-sm text-zinc-600">Color: {flightPlan.color_and_markings_snapshot}</Text>
      </View>
    ) : null}
    <Input value={snapshotOverrides.equipment_com_nav_snapshot} onChangeText={(value) => setSnapshotOverrides((prev) => ({ ...prev, equipment_com_nav_snapshot: value }))} placeholder="COM/NAV override" />
    <Input value={snapshotOverrides.equipment_surveillance_snapshot} onChangeText={(value) => setSnapshotOverrides((prev) => ({ ...prev, equipment_surveillance_snapshot: value }))} placeholder="Vigilancia override" />
    <Input value={snapshotOverrides.color_and_markings_snapshot} onChangeText={(value) => setSnapshotOverrides((prev) => ({ ...prev, color_and_markings_snapshot: value }))} placeholder="Color override" />
    <Button onPress={saveAircraftStep} disabled={isSaving}><Text className="font-semibold text-white">Guardar y continuar</Text></Button>
  </View>
) : null}
```

Change the final temporary panel condition to:

```tsx
{step >= 4 ? (
  <View className="rounded-3xl border border-zinc-200 bg-white p-4">
    <Text className="text-zinc-500">Este paso se implementa en la siguiente tarea.</Text>
  </View>
) : null}
```

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: no lint errors from Step 3 additions.

## Task 5: Steps 4, 5, And 6 Submit

**Files:**

- Modify: `src/features/flight-plans/flight-plan-wizard.tsx`

- [ ] **Step 1: Add remaining form state and submit helpers**

Update API import:

```tsx
import { createFlightPlan, submitFlightPlan, updateFlightPlan } from "./flight-plan-api";
```

Add state:

```tsx
const [flightStep, setFlightStep] = React.useState({
  cruising_speed: "",
  cruising_level: "",
  route: "",
  total_eet: "",
  rule_change_point: "",
});
const [operationalStep, setOperationalStep] = React.useState({
  endurance: "",
  persons_on_board: "1",
});
const [otherInformation, setOtherInformation] = React.useState("");
const [submittedStatus, setSubmittedStatus] = React.useState<string | null>(null);
```

Add handlers:

```tsx
const saveFlightStep = React.useCallback(async () => {
  if (!flightPlan) return;
  if (!flightStep.cruising_speed || !flightStep.cruising_level || !flightStep.route || flightStep.total_eet.length !== 4) {
    setError("Completa velocidad, nivel, ruta y EET de 4 digitos.");
    return;
  }
  if ((flightRules === "Y" || flightRules === "Z") && !flightStep.rule_change_point.trim()) {
    setError("Indica el punto de cambio de reglas para Y/Z.");
    return;
  }
  setIsSaving(true);
  try {
    const updated = await updateFlightPlan(accessToken, flightPlan.id, flightStep);
    setFlightPlan(updated);
    setStep(5);
  } catch (err) {
    setError(getErrorMessage(err));
  } finally {
    setIsSaving(false);
  }
}, [accessToken, flightPlan, flightRules, flightStep]);

const saveOperationalStep = React.useCallback(async () => {
  if (!flightPlan) return;
  const persons = Number.parseInt(operationalStep.persons_on_board, 10);
  if (operationalStep.endurance.length !== 4 || Number.isNaN(persons) || persons < 1) {
    setError("Completa autonomia de 4 digitos y personas a bordo mayor o igual a 1.");
    return;
  }
  setIsSaving(true);
  try {
    const updated = await updateFlightPlan(accessToken, flightPlan.id, {
      endurance: operationalStep.endurance,
      persons_on_board: persons,
    });
    setFlightPlan(updated);
    setStep(6);
  } catch (err) {
    setError(getErrorMessage(err));
  } finally {
    setIsSaving(false);
  }
}, [accessToken, flightPlan, operationalStep]);

const submitCurrentFlightPlan = React.useCallback(async () => {
  if (!flightPlan) return;
  setIsSaving(true);
  try {
    if (otherInformation !== (flightPlan.other_information ?? "")) {
      const updated = await updateFlightPlan(accessToken, flightPlan.id, {
        other_information: otherInformation.trim() || null,
      });
      setFlightPlan(updated);
    }
    const result = await submitFlightPlan(accessToken, flightPlan.id);
    setSubmittedStatus(result.status);
    Alert.alert("FPL enviado", `Estado: ${result.status}`);
  } catch (err) {
    const message = getErrorMessage(err);
    setError(message);
    const lower = message.toLowerCase();
    if (lower.includes("endurance") || lower.includes("autonomia")) setStep(5);
    if (lower.includes("rule_change_point") || lower.includes("cambio")) setStep(4);
  } finally {
    setIsSaving(false);
  }
}, [accessToken, flightPlan, otherInformation]);
```

- [ ] **Step 2: Add Step 4, 5, and 6 UI**

Replace the remaining temporary panel with Step 4, Step 5, and Step 6 branches:

```tsx
{step === 4 ? (
  <View className="gap-4 rounded-3xl border border-zinc-200 bg-white p-4">
    <Input value={flightStep.cruising_speed} onChangeText={(value) => setFlightStep((prev) => ({ ...prev, cruising_speed: value.toUpperCase() }))} placeholder="N0120" autoCapitalize="characters" />
    <Input value={flightStep.cruising_level} onChangeText={(value) => setFlightStep((prev) => ({ ...prev, cruising_level: value.toUpperCase() }))} placeholder="A045" autoCapitalize="characters" />
    <Input value={flightStep.route} onChangeText={(value) => setFlightStep((prev) => ({ ...prev, route: value.toUpperCase() }))} placeholder="DCT GUALE DCT" autoCapitalize="characters" />
    <Input value={flightStep.total_eet} onChangeText={(value) => setFlightStep((prev) => ({ ...prev, total_eet: value.replace(/\D/g, "").slice(0, 4) }))} placeholder="0100" keyboardType="number-pad" />
    {flightRules === "Y" || flightRules === "Z" ? (
      <Input value={flightStep.rule_change_point} onChangeText={(value) => setFlightStep((prev) => ({ ...prev, rule_change_point: value.toUpperCase() }))} placeholder="Punto de cambio de reglas" autoCapitalize="characters" />
    ) : null}
    <Button onPress={saveFlightStep} disabled={isSaving}><Text className="font-semibold text-white">Guardar y continuar</Text></Button>
  </View>
) : null}

{step === 5 ? (
  <View className="gap-4 rounded-3xl border border-zinc-200 bg-white p-4">
    <Input value={operationalStep.endurance} onChangeText={(value) => setOperationalStep((prev) => ({ ...prev, endurance: value.replace(/\D/g, "").slice(0, 4) }))} placeholder="0230" keyboardType="number-pad" />
    <Input value={operationalStep.persons_on_board} onChangeText={(value) => setOperationalStep((prev) => ({ ...prev, persons_on_board: value.replace(/\D/g, "") }))} placeholder="2" keyboardType="number-pad" />
    <Button onPress={saveOperationalStep} disabled={isSaving}><Text className="font-semibold text-white">Guardar y continuar</Text></Button>
  </View>
) : null}

{step === 6 ? (
  <View className="gap-4 rounded-3xl border border-zinc-200 bg-white p-4">
    <Input value={otherInformation} onChangeText={setOtherInformation} placeholder="RMK/TRAINING" autoCapitalize="characters" />
    <View className="gap-1 rounded-2xl bg-zinc-50 p-3">
      <Text className="font-semibold text-zinc-900">Resumen</Text>
      <Text className="text-sm text-zinc-600">Ruta: {flightPlan?.departure_aerodrome_icao} a {flightPlan?.destination_aerodrome_icao}</Text>
      <Text className="text-sm text-zinc-600">Reglas/tipo: {flightRules} / {flightType}</Text>
      <Text className="text-sm text-zinc-600">Aeronave: {flightPlan?.aircraft_identification_snapshot}</Text>
      <Text className="text-sm text-zinc-600">EET/autonomia: {flightStep.total_eet} / {operationalStep.endurance}</Text>
      <Text className="text-sm text-zinc-600">Personas: {operationalStep.persons_on_board}</Text>
    </View>
    {submittedStatus ? <Text className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">Estado: {submittedStatus}</Text> : null}
    <Button onPress={submitCurrentFlightPlan} disabled={isSaving || Boolean(submittedStatus)}><Text className="font-semibold text-white">Enviar FPL</Text></Button>
  </View>
) : null}
```

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: no lint errors from submit flow.

## Task 6: Flight Plan List Screen

**Files:**

- Create: `src/features/flight-plans/flight-plan-list.tsx`
- Modify: `src/app/(tabs)/plans.tsx`

- [ ] **Step 1: Create list component**

Add `src/features/flight-plans/flight-plan-list.tsx`:

```tsx
import * as React from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { getErrorMessage } from "@/lib/api";
import { listFlightPlans } from "./flight-plan-api";
import type { FlightPlanPublic } from "./types";
import { FPL_STATUS_LABELS } from "./types";

type FlightPlanListProps = { accessToken: string };

function formatDate(value: string) {
  return new Date(value).toLocaleString();
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
    <View className="flex-1 bg-background px-4 pt-6">
      <Text className="text-2xl font-bold text-foreground">Planes de vuelo</Text>
      <Text className="text-sm text-muted-foreground">{plans.length} planes registrados</Text>
      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-3 py-4 pb-28"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
        renderItem={({ item }) => (
          <View className="gap-2 rounded-3xl border border-zinc-200 bg-white p-4">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="text-lg font-bold text-zinc-900">{item.departure_aerodrome_icao} -> {item.destination_aerodrome_icao}</Text>
                <Text className="text-sm text-zinc-500">EOBT {formatDate(item.departure_eobt_utc)}</Text>
              </View>
              <Text className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">{FPL_STATUS_LABELS[item.status]}</Text>
            </View>
            <Text className="text-sm text-zinc-600">Aeronave: {item.aircraft_identification_snapshot ?? "Sin seleccionar"}</Text>
          </View>
        )}
        ListEmptyComponent={<Text className="py-12 text-center text-muted-foreground">Todavia no tenes planes de vuelo.</Text>}
      />
    </View>
  );
}
```

- [ ] **Step 2: Wire plans route**

Replace `src/app/(tabs)/plans.tsx` with:

```tsx
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/features/auth/auth-context";
import { FlightPlanList } from "@/features/flight-plans/flight-plan-list";

export default function PlansScreen() {
  const { session } = useAuth();

  if (!session) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-center text-muted-foreground">Inicia sesion para ver tus planes.</Text>
      </View>
    );
  }

  return <FlightPlanList accessToken={session.access_token} />;
}
```

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: no lint errors from list screen.

## Task 7: Final Verification

**Files:**

- Verify all files changed in previous tasks.

- [ ] **Step 1: Run repository lint**

Run: `npm run lint`

Expected: command exits successfully.

- [ ] **Step 2: Manual smoke test in Expo**

Run: `npm run start`

Expected: Expo starts. In the app, log in and verify these flows:

- Create FPL blocks missing Step 1 fields.
- Step 1 blocks duplicate aerodromes.
- Step 1 creates draft and advances to Step 2.
- Step 2 PATCH advances to Step 3.
- Step 3 lists aircraft, selects aircraft, and shows snapshot.
- Step 4 requires rule change point for Y/Z.
- Step 5 requires endurance and persons onboard.
- Step 6 submits and shows returned status.
- Plans tab lists FPLs.

- [ ] **Step 3: Review git diff**

Run: `git diff -- src/features/flight-plans src/app/(tabs)/create-fpl.tsx src/app/(tabs)/plans.tsx docs/superpowers`

Expected: diff only contains FPL feature, route wrappers, and docs.
