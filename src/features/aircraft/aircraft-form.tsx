import * as React from "react";
import { View, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Text } from "@/components/ui/text";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CheckboxGroup } from "@/components/ui/checkbox-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AircraftCreate, AircraftUpdate, WakeTurbulenceCat } from "./types";
import { WAKE_TURBULENCE_OPTIONS } from "./types";

/* ─────────────────── Multi-select options ─────────────────── */

const COM_NAV_OPTIONS = [
  { label: "S — Standard (VHF, VOR, ILS)", value: "S" },
  { label: "D — DME", value: "D" },
  { label: "F — ADF", value: "F" },
  { label: "G — GNSS", value: "G" },
  { label: "I — Inertial Navigation", value: "I" },
  { label: "L — ILS", value: "L" },
  { label: "O — VOR", value: "O" },
  { label: "R — PBN approved", value: "R" },
  { label: "W — RVSM approved", value: "W" },
  { label: "Y — 8.33 kHz VHF", value: "Y" },
  { label: "E — EFIS / FMC", value: "E" },
  { label: "H — HF RTF", value: "H" },
  { label: "U — UHF RTF", value: "U" },
  { label: "V — VHF RTF", value: "V" },
];

const SURVEILLANCE_OPTIONS = [
  { label: "N — Nil", value: "N" },
  { label: "A — Transponder Mode A", value: "A" },
  { label: "C — Transponder Mode A + C", value: "C" },
  { label: "E — Mode S (ID + Alt + ACAS)", value: "E" },
  { label: "H — Mode S (ID + Alt + ACAS + Long squitter)", value: "H" },
  { label: "L — Mode S (ID + Alt + Long squitter)", value: "L" },
  { label: "P — Mode S (ID only)", value: "P" },
  { label: "S — Mode S (ID + Alt)", value: "S" },
  { label: "X — Mode S (no ACAS)", value: "X" },
  { label: "B1 — ADS-B Out (1090 MHz)", value: "B1" },
  { label: "B2 — ADS-B In/Out (1090 MHz)", value: "B2" },
  { label: "U1 — ADS-B Out (UAT)", value: "U1" },
  { label: "U2 — ADS-B In/Out (UAT)", value: "U2" },
];

const PBN_OPTIONS = [
  { label: "A1 — RNAV 10 (RNP 10)", value: "A1" },
  { label: "B1 — RNAV 5 (all permitted sensors)", value: "B1" },
  { label: "B2 — RNAV 5 (GNSS)", value: "B2" },
  { label: "B3 — RNAV 5 (DME/DME)", value: "B3" },
  { label: "B4 — RNAV 5 (VOR/DME)", value: "B4" },
  { label: "C1 — RNAV 2 (all permitted sensors)", value: "C1" },
  { label: "C2 — RNAV 2 (GNSS)", value: "C2" },
  { label: "C3 — RNAV 2 (DME/DME)", value: "C3" },
  { label: "D1 — RNAV 1 (all permitted sensors)", value: "D1" },
  { label: "D2 — RNAV 1 (GNSS)", value: "D2" },
  { label: "D3 — RNAV 1 (DME/DME)", value: "D3" },
  { label: "L1 — RNP 4", value: "L1" },
  { label: "O1 — Basic RNP 1 (all sensors)", value: "O1" },
  { label: "O2 — Basic RNP 1 (GNSS)", value: "O2" },
  { label: "S1 — RNP APCH", value: "S1" },
  { label: "S2 — RNP APCH (Baro-VNAV)", value: "S2" },
  { label: "T1 — RNP AR APCH (RF)", value: "T1" },
  { label: "T2 — RNP AR APCH", value: "T2" },
];

const EMERGENCY_RADIO_OPTIONS = [
  { label: "UHF", value: "UHF" },
  { label: "VHF", value: "VHF" },
  { label: "ELT", value: "ELT" },
];

const SURVIVAL_EQUIPMENT_OPTIONS = [
  { label: "Polar", value: "Polar" },
  { label: "Desert", value: "Desert" },
  { label: "Maritime", value: "Maritime" },
  { label: "Jungle", value: "Jungle" },
];

const LIFE_JACKETS_OPTIONS = [
  { label: "Light", value: "Light" },
  { label: "Fluorescent", value: "Fluorescent" },
];

/* ─────────────────── Form types & helpers ─────────────────── */

export type AircraftFormData = {
  identification: string;
  icao_type_designator: string;
  wake_turbulence_category: WakeTurbulenceCat;
  equipment_com_nav: string;
  equipment_surveillance: string;
  color_and_markings: string;
  alias: string;
  pbn_capabilities: string;
  emergency_radio: string;
  survival_equipment: string;
  life_jackets: string;
  has_dinghies: boolean;
  dinghies_number: string;
  dinghies_capacity: string;
  dinghies_cover: boolean;
  dinghies_color: string;
};

interface AircraftFormProps {
  initialData?: Partial<AircraftFormData>;
  onSubmit: (data: AircraftCreate | AircraftUpdate) => void;
  submitLabel: string;
  isLoading?: boolean;
}

function toFormData(partial?: Partial<AircraftFormData>): AircraftFormData {
  const hasDinghies = partial?.has_dinghies ??
    (
      (partial?.dinghies_number !== undefined && partial?.dinghies_number !== "" && partial?.dinghies_number !== "0") ||
      (partial?.dinghies_capacity !== undefined && partial?.dinghies_capacity !== "" && partial?.dinghies_capacity !== "0") ||
      partial?.dinghies_cover === true ||
      (partial?.dinghies_color !== undefined && partial?.dinghies_color !== "")
    );

  return {
    identification: partial?.identification ?? "",
    icao_type_designator: partial?.icao_type_designator ?? "",
    wake_turbulence_category: partial?.wake_turbulence_category ?? "L",
    equipment_com_nav: partial?.equipment_com_nav ?? "",
    equipment_surveillance: partial?.equipment_surveillance ?? "",
    color_and_markings: partial?.color_and_markings ?? "",
    alias: partial?.alias ?? "",
    pbn_capabilities: partial?.pbn_capabilities ?? "",
    emergency_radio: partial?.emergency_radio ?? "",
    survival_equipment: partial?.survival_equipment ?? "",
    life_jackets: partial?.life_jackets ?? "",
    has_dinghies: Boolean(hasDinghies),
    dinghies_number: partial?.dinghies_number?.toString() ?? "",
    dinghies_capacity: partial?.dinghies_capacity?.toString() ?? "",
    dinghies_cover: partial?.dinghies_cover ?? false,
    dinghies_color: partial?.dinghies_color ?? "",
  };
}

function fromFormData(data: AircraftFormData): AircraftCreate {
  return {
    identification: data.identification.trim(),
    icao_type_designator: data.icao_type_designator.trim().toUpperCase(),
    wake_turbulence_category: data.wake_turbulence_category,
    equipment_com_nav: data.equipment_com_nav.trim(),
    equipment_surveillance: data.equipment_surveillance.trim(),
    color_and_markings: data.color_and_markings.trim(),
    alias: data.alias.trim() || null,
    pbn_capabilities: data.pbn_capabilities.trim() || null,
    emergency_radio: data.emergency_radio.trim() || null,
    survival_equipment: data.survival_equipment.trim() || null,
    life_jackets: data.life_jackets.trim() || null,
    ...(data.has_dinghies
      ? {
          dinghies_number: data.dinghies_number ? parseInt(data.dinghies_number, 10) : 0,
          dinghies_capacity: data.dinghies_capacity ? parseInt(data.dinghies_capacity, 10) : 0,
          dinghies_cover: data.dinghies_cover,
          dinghies_color: data.dinghies_color.trim() || null,
        }
      : {
          dinghies_number: 0,
          dinghies_capacity: 0,
          dinghies_cover: false,
          dinghies_color: null,
        }),
  };
}

function FieldRow({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <View className="gap-2">
      <Label>
        {label}
        {required && <Text className="text-destructive"> *</Text>}
      </Label>
      {children}
    </View>
  );
}

/* ─────────────────── Component ─────────────────── */

export function AircraftForm({ initialData, onSubmit, submitLabel, isLoading }: AircraftFormProps) {
  const [form, setForm] = React.useState<AircraftFormData>(() => toFormData(initialData));

  const updateField = React.useCallback(<K extends keyof AircraftFormData>(
    field: K,
    value: AircraftFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = React.useCallback(() => {
    onSubmit(fromFormData(form));
  }, [form, onSubmit]);

  const isValid =
    form.identification.trim().length >= 1 &&
    form.icao_type_designator.trim().length >= 1 &&
    form.equipment_com_nav.trim().length >= 1 &&
    form.equipment_surveillance.trim().length >= 1 &&
    form.color_and_markings.trim().length >= 1;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 p-4 pb-8"
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Información básica ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información básica</CardTitle>
          </CardHeader>
          <CardContent className="gap-4">
            <FieldRow label="Identificación" required>
              <Input
                value={form.identification}
                onChangeText={(text) => updateField("identification", text)}
                placeholder="Ej: LV-ABC"
                autoCapitalize="characters"
                maxLength={20}
              />
            </FieldRow>

            <FieldRow label="Alias" required={false}>
              <Input
                value={form.alias}
                onChangeText={(text) => updateField("alias", text)}
                placeholder="Nombre descriptivo (opcional)"
                maxLength={120}
              />
            </FieldRow>

            <FieldRow label="Designador ICAO" required>
              <Input
                value={form.icao_type_designator}
                onChangeText={(text) => updateField("icao_type_designator", text)}
                placeholder="Ej: C172"
                autoCapitalize="characters"
                maxLength={10}
              />
            </FieldRow>

            <FieldRow label="Categoría de turbulencia" required>
              <Select
                value={form.wake_turbulence_category}
                options={WAKE_TURBULENCE_OPTIONS}
                onChange={(value) => updateField("wake_turbulence_category", value as WakeTurbulenceCat)}
              />
            </FieldRow>

            <FieldRow label="Colores y marcas" required>
              <Input
                value={form.color_and_markings}
                onChangeText={(text) => updateField("color_and_markings", text)}
                placeholder="Ej: Blanco con franjas azules"
                maxLength={255}
              />
            </FieldRow>
          </CardContent>
        </Card>

        {/* ── Equipamiento COM/NAV ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Equipamiento COM/NAV</CardTitle>
          </CardHeader>
          <CardContent className="gap-4">
            <FieldRow label="COM/NAV" required>
              <CheckboxGroup
                value={form.equipment_com_nav}
                options={COM_NAV_OPTIONS}
                onChange={(value) => updateField("equipment_com_nav", value)}
              />
            </FieldRow>
          </CardContent>
        </Card>

        {/* ── Equipamiento de vigilancia ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Equipamiento de vigilancia</CardTitle>
          </CardHeader>
          <CardContent className="gap-4">
            <FieldRow label="Vigilancia" required>
              <CheckboxGroup
                value={form.equipment_surveillance}
                options={SURVEILLANCE_OPTIONS}
                onChange={(value) => updateField("equipment_surveillance", value)}
              />
            </FieldRow>
          </CardContent>
        </Card>

        {/* ── Capacidades PBN ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Capacidades PBN</CardTitle>
          </CardHeader>
          <CardContent className="gap-4">
            <FieldRow label="PBN" required={false}>
              <CheckboxGroup
                value={form.pbn_capabilities}
                options={PBN_OPTIONS}
                onChange={(value) => updateField("pbn_capabilities", value)}
              />
            </FieldRow>
          </CardContent>
        </Card>

        {/* ── Equipamiento de emergencia ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Equipamiento de emergencia</CardTitle>
          </CardHeader>
          <CardContent className="gap-4">
            <FieldRow label="Radio de emergencia" required={false}>
              <CheckboxGroup
                value={form.emergency_radio}
                options={EMERGENCY_RADIO_OPTIONS}
                onChange={(value) => updateField("emergency_radio", value)}
              />
            </FieldRow>

            <FieldRow label="Equipo de supervivencia" required={false}>
              <CheckboxGroup
                value={form.survival_equipment}
                options={SURVIVAL_EQUIPMENT_OPTIONS}
                onChange={(value) => updateField("survival_equipment", value)}
              />
            </FieldRow>

            <FieldRow label="Chalecos salvavidas" required={false}>
              <CheckboxGroup
                value={form.life_jackets}
                options={LIFE_JACKETS_OPTIONS}
                onChange={(value) => updateField("life_jackets", value)}
              />
            </FieldRow>
          </CardContent>
        </Card>

        {/* ── Botes salvavidas ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Botes salvavidas</CardTitle>
          </CardHeader>
          <CardContent className="gap-4">
            <Switch
              value={form.has_dinghies}
              onChange={(value) => updateField("has_dinghies", value)}
              label="¿Lleva botes a bordo?"
            />

            {form.has_dinghies && (
              <View className="gap-4">
                <FieldRow label="Cantidad" required={false}>
                  <Input
                    value={form.dinghies_number}
                    onChangeText={(text) => updateField("dinghies_number", text)}
                    placeholder="Número de botes"
                    keyboardType="number-pad"
                  />
                </FieldRow>

                <FieldRow label="Capacidad" required={false}>
                  <Input
                    value={form.dinghies_capacity}
                    onChangeText={(text) => updateField("dinghies_capacity", text)}
                    placeholder="Capacidad total de personas"
                    keyboardType="number-pad"
                  />
                </FieldRow>

                <FieldRow label="Color" required={false}>
                  <Input
                    value={form.dinghies_color}
                    onChangeText={(text) => updateField("dinghies_color", text)}
                    placeholder="Color de los botes"
                    maxLength={40}
                  />
                </FieldRow>

                <Switch
                  value={form.dinghies_cover}
                  onChange={(value) => updateField("dinghies_cover", value)}
                  label="Cubierta"
                />
              </View>
            )}
          </CardContent>
        </Card>

        <Button
          onPress={handleSubmit}
          disabled={!isValid || isLoading}
          className="mt-2"
        >
          <Text className="text-primary-foreground font-semibold">
            {isLoading ? "Guardando..." : submitLabel}
          </Text>
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
