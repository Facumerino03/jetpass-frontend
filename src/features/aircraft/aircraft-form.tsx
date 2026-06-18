import * as React from "react";
import { View, ScrollView, KeyboardAvoidingView, Platform, Pressable, Alert } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Text } from "@/components/ui/text";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { requestAircraftImagePresign, uploadAircraftImage } from "./aircraft-api";
import type { AircraftCreate, AircraftUpdate, WakeTurbulenceCat } from "./types";
import { WAKE_TURBULENCE_OPTIONS } from "./types";
import {
  Plane,
  Hash,
  Fingerprint,
  Radio,
  ShieldCheck,
  Anchor,
  ChevronLeft,
  ChevronRight,
  Camera,
  X,
} from "lucide-react-native";

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
  { label: "UHF", value: "UHF" },
  { label: "VHF", value: "VHF" },
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
  /** Comma-separated active values: "UHF", "VHF", "ELT" */
  emergency_radio: string;
  /** Comma-separated active values: "Polar", "Desert", "Maritime", "Jungle" */
  survival_equipment: string;
  /** Comma-separated active values: "Light", "Fluorescent", "UHF", "VHF" */
  life_jackets: string;
  has_dinghies: boolean;
  dinghies_number: string;
  dinghies_capacity: string;
  dinghies_cover: boolean;
  dinghies_color: string;
  image_url: string;
  image_uri: string | null;
  image_mime_type: string | null;
};

interface AircraftFormProps {
  accessToken: string;
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
    image_url: partial?.image_url ?? "",
    image_uri: partial?.image_uri ?? null,
    image_mime_type: partial?.image_mime_type ?? null,
  };
}

function fromFormData(data: AircraftFormData, imageKey: string | null): AircraftCreate {
  const emergencySelected = parseValue(data.emergency_radio);
  const survivalSelected = parseValue(data.survival_equipment);
  const lifeJacketSelected = parseValue(data.life_jackets);

  return {
    identification: data.identification.trim(),
    icao_type_designator: data.icao_type_designator.trim().toUpperCase(),
    wake_turbulence_category: data.wake_turbulence_category,
    equipment_com_nav: data.equipment_com_nav.trim(),
    equipment_surveillance: data.equipment_surveillance.trim(),
    color_and_markings: data.color_and_markings.trim(),
    alias: data.alias.trim() || null,
    pbn_capabilities: data.pbn_capabilities.trim() || null,
    emergency_radio_uhf: emergencySelected.includes("UHF"),
    emergency_radio_vhf: emergencySelected.includes("VHF"),
    emergency_radio_elt: emergencySelected.includes("ELT"),
    survival_equipment_present: survivalSelected.length > 0,
    survival_polar: survivalSelected.includes("Polar"),
    survival_desert: survivalSelected.includes("Desert"),
    survival_maritime: survivalSelected.includes("Maritime"),
    survival_jungle: survivalSelected.includes("Jungle"),
    life_jackets_present: lifeJacketSelected.length > 0,
    life_jackets_lights: lifeJacketSelected.includes("Light"),
    life_jackets_fluorescein: lifeJacketSelected.includes("Fluorescent"),
    life_jackets_uhf: lifeJacketSelected.includes("UHF"),
    life_jackets_vhf: lifeJacketSelected.includes("VHF"),
    ...(data.has_dinghies
      ? {
          dinghies_number: data.dinghies_number ? parseInt(data.dinghies_number, 10) : 0,
          dinghies_capacity: data.dinghies_capacity ? parseInt(data.dinghies_capacity, 10) : 0,
          dinghies_present: true,
          dinghies_cover_present: data.dinghies_cover,
          dinghies_color: data.dinghies_color.trim() || null,
        }
      : {
          dinghies_number: 0,
          dinghies_capacity: 0,
          dinghies_present: false,
          dinghies_cover_present: false,
          dinghies_color: null,
        }),
    ...(imageKey !== null ? { image_key: imageKey } : {}),
  };
}

/* ─────────────────── Steps config ─────────────────── */

const TOTAL_STEPS = 5;

interface StepConfig {
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
}

const STEPS: StepConfig[] = [
  {
    title: "Identificá tu aeronave",
    description: "Comenzá con los datos principales de identificación.",
    icon: Fingerprint,
    iconColor: "#0ea5e9",
  },
  {
    title: "Tipo y características",
    description: "Indicá el modelo, turbulencia de estela y colores.",
    icon: Hash,
    iconColor: "#f59e0b",
  },
  {
    title: "Equipamiento",
    description: "Seleccioná el equipamiento de comunicación y vigilancia.",
    icon: Radio,
    iconColor: "#10b981",
  },
  {
    title: "Capacidades adicionales",
    description: "Agregá PBN, equipos de emergencia y supervivencia.",
    icon: ShieldCheck,
    iconColor: "#e11d48",
  },
  {
    title: "Últimos detalles",
    description: "Foto opcional y botes salvavidas.",
    icon: Anchor,
    iconColor: "#0891b2",
  },
];

/* ─────────────────── UI Helpers ─────────────────── */

/* ─── Helpers for multi-select components ─── */

function parseValue(value: string): string[] {
  if (!value.trim()) return [];
  const trimmed = value.trim();
  if (trimmed.includes(",")) {
    return trimmed.split(",").map((v) => v.trim()).filter(Boolean);
  }
  if (trimmed.includes(" ")) {
    return trimmed.split(/\s+/).map((v) => v.trim()).filter(Boolean);
  }
  return [trimmed];
}

function serializeValue(selected: string[]): string {
  return selected.join(", ");
}

/* ─── Selectable Pills (fixed options, toggle on/off) ─── */

interface SelectablePillsProps {
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}

function SelectablePills({ value, options, onChange }: SelectablePillsProps) {
  const selected = React.useMemo(() => parseValue(value), [value]);

  const toggle = React.useCallback(
    (optionValue: string) => {
      const next = selected.includes(optionValue)
        ? selected.filter((v) => v !== optionValue)
        : [...selected, optionValue];
      onChange(serializeValue(next));
    },
    [selected, onChange],
  );

  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        return (
          <Pressable
            key={option.value}
            onPress={() => toggle(option.value)}
            className={`rounded-full px-4 py-2.5 border ${
              isSelected
                ? "bg-zinc-900 border-zinc-900"
                : "bg-white border-zinc-200"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                isSelected ? "text-white" : "text-zinc-600"
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ─── Tag Input (free-form chips with suggestions) ─── */

interface TagInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions?: { label: string; value: string }[];
  placeholder?: string;
}

function TagInput({ value, onChange, suggestions = [], placeholder = "Escribí el código y tocá +" }: TagInputProps) {
  const [inputText, setInputText] = React.useState("");
  const tags = React.useMemo(() => parseValue(value), [value]);

  const addTag = React.useCallback((text: string) => {
    const trimmed = text.trim().toUpperCase();
    if (!trimmed) return;
    const next = tags.includes(trimmed) ? tags : [...tags, trimmed];
    onChange(serializeValue(next));
    setInputText("");
  }, [tags, onChange]);

  const removeTag = React.useCallback((tag: string) => {
    onChange(serializeValue(tags.filter((t) => t !== tag)));
  }, [tags, onChange]);

  return (
    <View className="gap-3">
      {/* Existing tags */}
      {tags.length > 0 && (
        <View className="flex-row flex-wrap gap-2">
          {tags.map((tag) => (
            <View
              key={tag}
              className="flex-row items-center gap-1 bg-zinc-900 rounded-full px-3 py-1.5"
            >
              <Text className="text-sm font-medium text-white">{tag}</Text>
              <Pressable onPress={() => removeTag(tag)} hitSlop={4}>
                <Text className="text-white text-xs ml-0.5">✕</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Input row */}
      <View className="flex-row items-center gap-2">
        <Input
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => addTag(inputText)}
          placeholder={placeholder}
          className="flex-1 bg-zinc-50 rounded-2xl border-zinc-200 h-12"
          autoCapitalize="characters"
          maxLength={10}
        />
        <Pressable
          onPress={() => addTag(inputText)}
          disabled={!inputText.trim()}
          className={`h-12 w-12 items-center justify-center rounded-2xl ${
            inputText.trim() ? "bg-zinc-900 active:bg-zinc-700" : "bg-zinc-200"
          }`}
        >
          <Text className={`font-bold text-lg ${inputText.trim() ? "text-white" : "text-zinc-400"}`}>
            +
          </Text>
        </Pressable>
      </View>

      {/* Quick suggestions */}
      {suggestions.length > 0 && (
        <View className="gap-2">
          <Text className="text-xs text-zinc-400">Sugerencias rápidas</Text>
          <View className="flex-row flex-wrap gap-2">
            {suggestions.map((s) => (
              <Pressable
                key={s.value}
                onPress={() => addTag(s.value)}
                className="rounded-full px-3 py-1.5 bg-white border border-zinc-200 active:bg-zinc-50"
              >
                <Text className="text-xs text-zinc-600">{s.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

/* ─── Stepper Control (+ / -) for numeric values ─── */

interface StepperControlProps {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
}

function StepperControl({ value, onChange, min = 0, max = 999 }: StepperControlProps) {
  const numValue = parseInt(value, 10) || 0;

  const decrement = React.useCallback(() => {
    if (numValue > min) {
      onChange((numValue - 1).toString());
    }
  }, [numValue, min, onChange]);

  const increment = React.useCallback(() => {
    if (numValue < max) {
      onChange((numValue + 1).toString());
    }
  }, [numValue, max, onChange]);

  return (
    <View className="flex-row items-center gap-3">
      <Pressable
        onPress={decrement}
        disabled={numValue <= min}
        className={`h-12 w-12 items-center justify-center rounded-2xl ${
          numValue > min ? "bg-zinc-100 active:bg-zinc-200" : "bg-zinc-100 opacity-40"
        }`}
      >
        <Text className={`text-xl font-bold ${numValue > min ? "text-zinc-900" : "text-zinc-400"}`}>
          −
        </Text>
      </Pressable>

      <View className="flex-1 h-12 items-center justify-center bg-zinc-50 rounded-2xl border border-zinc-200">
        <Text className="text-lg font-semibold text-zinc-900">{numValue}</Text>
      </View>

      <Pressable
        onPress={increment}
        disabled={numValue >= max}
        className={`h-12 w-12 items-center justify-center rounded-2xl ${
          numValue < max ? "bg-zinc-900 active:bg-zinc-700" : "bg-zinc-200"
        }`}
      >
        <Text className={`text-xl font-bold ${numValue < max ? "text-white" : "text-zinc-400"}`}>
          +
        </Text>
      </Pressable>
    </View>
  );
}

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <View className="px-4 mb-6">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-medium text-zinc-400">
          Paso {currentStep} / {totalSteps}
        </Text>
      </View>
      <View className="flex-row gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            className={`flex-1 h-1 rounded-full ${
              i + 1 <= currentStep ? "bg-zinc-900" : "bg-zinc-200"
            }`}
          />
        ))}
      </View>
    </View>
  );
}

function StepHeader({ step }: { step: StepConfig }) {
  const Icon = step.icon;
  return (
    <View className="px-4 mb-8">
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 mb-4">
        <Icon size={24} color={step.iconColor} />
      </View>
      <Text className="text-2xl font-bold text-zinc-900 mb-1">{step.title}</Text>
      <Text className="text-sm text-zinc-500">{step.description}</Text>
    </View>
  );
}

function FieldWrapper({
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
      <Label className="text-sm text-zinc-500">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
      </Label>
      {children}
    </View>
  );
}

/* ─────────────────── Component ─────────────────── */

export function AircraftForm({ accessToken, initialData, onSubmit, submitLabel, isLoading }: AircraftFormProps) {
  const [form, setForm] = React.useState<AircraftFormData>(() => toFormData(initialData));
  const [step, setStep] = React.useState(1);
  const [isImageUploading, setIsImageUploading] = React.useState(false);

  const updateField = React.useCallback(<K extends keyof AircraftFormData>(
    field: K,
    value: AircraftFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const pickImage = React.useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permiso requerido", "Necesitamos acceso a la galería para seleccionar una imagen.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      updateField("image_uri", asset.uri);
      updateField("image_mime_type", asset.mimeType ?? "image/jpeg");
    }
  }, [updateField]);

  const clearImage = React.useCallback(() => {
    updateField("image_uri", null);
    updateField("image_mime_type", null);
    updateField("image_url", "");
  }, [updateField]);

  const handleSubmit = React.useCallback(async () => {
    setIsImageUploading(true);
    try {
      let imageKey: string | null = null;

      if (form.image_uri && form.image_mime_type) {
        const presign = await requestAircraftImagePresign(accessToken, form.image_mime_type);
        await uploadAircraftImage(presign.upload_url, form.image_uri, form.image_mime_type);
        imageKey = presign.image_key;
      }

      await onSubmit(fromFormData(form, imageKey));
    } catch (err) {
      Alert.alert("Error al subir imagen", err instanceof Error ? err.message : "No se pudo subir la imagen.");
      throw err;
    } finally {
      setIsImageUploading(false);
    }
  }, [accessToken, form, onSubmit]);

  const isStepValid = React.useMemo(() => {
    switch (step) {
      case 1:
        return form.identification.trim().length >= 1;
      case 2:
        return (
          form.icao_type_designator.trim().length >= 1 &&
          form.color_and_markings.trim().length >= 1
        );
      case 3:
        return (
          form.equipment_com_nav.trim().length >= 1 &&
          form.equipment_surveillance.trim().length >= 1
        );
      case 4:
        return true; // all optional
      case 5:
        return true;
      default:
        return false;
    }
  }, [step, form]);

  const goNext = React.useCallback(async () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      await handleSubmit();
    }
  }, [step, handleSubmit]);

  const goBack = React.useCallback(() => {
    if (step > 1) setStep((s) => s - 1);
  }, [step]);

  const stepConfig = STEPS[step - 1];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-8"
        keyboardShouldPersistTaps="handled"
      >
        {/* Step Indicator */}
        <StepIndicator currentStep={step} totalSteps={TOTAL_STEPS} />

        {/* Step Header */}
        <StepHeader step={stepConfig} />

        {/* Step Content */}
        <View className="px-4 gap-5">
          {step === 1 && (
            <>
              <FieldWrapper label="Identificación" required>
                <Input
                  value={form.identification}
                  onChangeText={(text) => updateField("identification", text)}
                  placeholder="Ej: LV-ABC"
                  autoCapitalize="characters"
                  maxLength={20}
                  className="bg-zinc-50 rounded-2xl border-zinc-200 h-14"
                />
              </FieldWrapper>

              <FieldWrapper label="Alias" required={false}>
                <Input
                  value={form.alias}
                  onChangeText={(text) => updateField("alias", text)}
                  placeholder="Nombre descriptivo (opcional)"
                  maxLength={120}
                  className="bg-zinc-50 rounded-2xl border-zinc-200 h-14"
                />
              </FieldWrapper>
            </>
          )}

          {step === 2 && (
            <>
              <FieldWrapper label="Designador ICAO" required>
                <Input
                  value={form.icao_type_designator}
                  onChangeText={(text) => updateField("icao_type_designator", text)}
                  placeholder="Ej: C172"
                  autoCapitalize="characters"
                  maxLength={10}
                  className="bg-zinc-50 rounded-2xl border-zinc-200 h-14"
                />
              </FieldWrapper>

              <FieldWrapper label="Categoría de turbulencia" required>
                <Select
                  value={form.wake_turbulence_category}
                  options={WAKE_TURBULENCE_OPTIONS}
                  onChange={(value) => updateField("wake_turbulence_category", value as WakeTurbulenceCat)}
                />
              </FieldWrapper>

              <FieldWrapper label="Colores y marcas" required>
                <Input
                  value={form.color_and_markings}
                  onChangeText={(text) => updateField("color_and_markings", text)}
                  placeholder="Ej: Blanco con franjas azules"
                  maxLength={255}
                  className="bg-zinc-50 rounded-2xl border-zinc-200 h-14"
                />
              </FieldWrapper>
            </>
          )}

          {step === 3 && (
            <>
              <FieldWrapper label="Equipamiento COM/NAV" required>
                <TagInput
                  value={form.equipment_com_nav}
                  onChange={(value) => updateField("equipment_com_nav", value)}
                  suggestions={[
                    { label: "S — Standard", value: "S" },
                    { label: "D — DME", value: "D" },
                    { label: "F — ADF", value: "F" },
                    { label: "G — GNSS", value: "G" },
                    { label: "W — RVSM", value: "W" },
                    { label: "Y — 8.33kHz", value: "Y" },
                  ]}
                  placeholder="Ej: S, D, F, G..."
                />
              </FieldWrapper>

              <FieldWrapper label="Equipamiento de vigilancia" required>
                <TagInput
                  value={form.equipment_surveillance}
                  onChange={(value) => updateField("equipment_surveillance", value)}
                  suggestions={[
                    { label: "N — Nil", value: "N" },
                    { label: "A — Mode A", value: "A" },
                    { label: "C — Mode A+C", value: "C" },
                    { label: "E — Mode S", value: "E" },
                    { label: "B1 — ADS-B Out", value: "B1" },
                    { label: "B2 — ADS-B In/Out", value: "B2" },
                  ]}
                  placeholder="Ej: N, C, E..."
                />
              </FieldWrapper>
            </>
          )}

          {step === 4 && (
            <>
              <FieldWrapper label="Capacidades PBN" required={false}>
                <TagInput
                  value={form.pbn_capabilities}
                  onChange={(value) => updateField("pbn_capabilities", value)}
                  suggestions={[
                    { label: "A1 — RNP 10", value: "A1" },
                    { label: "B1 — RNAV 5", value: "B1" },
                    { label: "C1 — RNAV 2", value: "C1" },
                    { label: "D1 — RNAV 1", value: "D1" },
                    { label: "S1 — RNP APCH", value: "S1" },
                    { label: "S2 — RNP APCH Baro", value: "S2" },
                  ]}
                  placeholder="Ej: A1, B1, C1..."
                />
              </FieldWrapper>

              <FieldWrapper label="Radio de emergencia" required={false}>
                <SelectablePills
                  value={form.emergency_radio}
                  options={EMERGENCY_RADIO_OPTIONS}
                  onChange={(value) => updateField("emergency_radio", value)}
                />
              </FieldWrapper>

              <FieldWrapper label="Equipo de supervivencia" required={false}>
                <SelectablePills
                  value={form.survival_equipment}
                  options={SURVIVAL_EQUIPMENT_OPTIONS}
                  onChange={(value) => updateField("survival_equipment", value)}
                />
              </FieldWrapper>

              <FieldWrapper label="Chalecos salvavidas" required={false}>
                <SelectablePills
                  value={form.life_jackets}
                  options={LIFE_JACKETS_OPTIONS}
                  onChange={(value) => updateField("life_jackets", value)}
                />
              </FieldWrapper>
            </>
          )}

          {step === 5 && (
            <>
              <FieldWrapper label="Foto de la aeronave" required={false}>
                <View className="gap-3">
                  <Pressable
                    onPress={pickImage}
                    disabled={isImageUploading}
                    className="items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 active:bg-zinc-100"
                    style={{ height: 180 }}
                  >
                    {form.image_uri || form.image_url ? (
                      <Image
                        source={{ uri: form.image_uri ?? form.image_url }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                    ) : (
                      <View className="items-center gap-2">
                        <Camera size={32} color="#a1a1aa" />
                        <Text className="text-sm text-zinc-400">Tocá para seleccionar una imagen</Text>
                      </View>
                    )}
                  </Pressable>

                  {(form.image_uri || form.image_url) && (
                    <Pressable
                      onPress={clearImage}
                      className="flex-row items-center justify-center gap-1 self-start rounded-full bg-zinc-100 px-3 py-1.5 active:bg-zinc-200"
                    >
                      <X size={14} color="#3f3f46" />
                      <Text className="text-xs font-medium text-zinc-600">Quitar imagen</Text>
                    </Pressable>
                  )}
                </View>
              </FieldWrapper>

              <View className="mt-2">
                <Switch
                  value={form.has_dinghies}
                  onChange={(value) => updateField("has_dinghies", value)}
                  label="¿Lleva botes salvavidas?"
                />
              </View>

              {form.has_dinghies && (
                <View className="gap-4 mt-2">
                  <FieldWrapper label="Cantidad" required={false}>
                    <StepperControl
                      value={form.dinghies_number}
                      onChange={(value) => updateField("dinghies_number", value)}
                      min={0}
                      max={20}
                    />
                  </FieldWrapper>

                  <FieldWrapper label="Capacidad (personas)" required={false}>
                    <StepperControl
                      value={form.dinghies_capacity}
                      onChange={(value) => updateField("dinghies_capacity", value)}
                      min={0}
                      max={100}
                    />
                  </FieldWrapper>

                  <FieldWrapper label="Color" required={false}>
                    <Input
                      value={form.dinghies_color}
                      onChangeText={(text) => updateField("dinghies_color", text)}
                      placeholder="Color de los botes"
                      maxLength={40}
                      className="bg-zinc-50 rounded-2xl border-zinc-200 h-14"
                    />
                  </FieldWrapper>

                  <Switch
                    value={form.dinghies_cover}
                    onChange={(value) => updateField("dinghies_cover", value)}
                    label="Cubierta"
                  />
                </View>
              )}
            </>
          )}
        </View>

        {/* Navigation Buttons */}
        <View className="px-4 mt-8 gap-3">
          <Button
            onPress={goNext}
            disabled={!isStepValid || isLoading || isImageUploading}
            className="h-14 rounded-2xl"
          >
            <View className="flex-row items-center gap-2">
              <Text className="text-primary-foreground font-semibold text-base">
                {step === TOTAL_STEPS
                  ? isLoading || isImageUploading
                    ? "Guardando..."
                    : submitLabel
                  : "Continuar"}
              </Text>
              {step < TOTAL_STEPS && (
                <ChevronRight size={18} color="#ffffff" />
              )}
            </View>
          </Button>

          {step > 1 && (
            <Button
              variant="ghost"
              onPress={goBack}
              className="h-12"
            >
              <View className="flex-row items-center gap-2">
                <ChevronLeft size={18} color="#71717a" />
                <Text className="text-zinc-500 font-medium">Atrás</Text>
              </View>
            </Button>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
