import * as React from "react";
import { View } from "react-native";
import { Hash } from "lucide-react-native";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { AerodromeCombobox } from "./aerodrome-combobox";
import { EobtFields } from "./eobt-fields";
import { validateEobtFields } from "./eobt-utils";
import type { ControlledAerodrome } from "./types";

export type EobtWhen = "today" | "other";

export type Step1Data = {
  departure: ControlledAerodrome | null;
  destination: ControlledAerodrome | null;
  alternate1: ControlledAerodrome | null;
  alternate2: ControlledAerodrome | null;
  /** Hoy: fecha automática; otro día: el piloto elige fecha */
  eobtWhen: EobtWhen;
  eobtDate: string;
  eobtTime: string;
  /** false = hora ingresada en UTC (default); true = hora local con selector nativo */
  eobtUseLocalTime: boolean;
};

export const STEP1_SUB_STEPS = [
  { title: "Desde donde salis?", placeholder: "Aerodromo de salida", icaoField: 13 },
  { title: "A donde vas?", placeholder: "Aerodromo de destino", icaoField: 16 },
  { title: "Alternativos", placeholder: "", icaoField: 16 },
  { title: "Cuando salis?", placeholder: "", icaoField: 13 },
] as const;

export const EMPTY_STEP1_DATA: Step1Data = {
  departure: null,
  destination: null,
  alternate1: null,
  alternate2: null,
  eobtWhen: "today",
  eobtDate: "",
  eobtTime: "",
  eobtUseLocalTime: false,
};

export function validateStep1SubStep(subStep: number, data: Step1Data): string | null {
  if (subStep === 0 && !data.departure) {
    return "Selecciona un aerodromo de salida.";
  }
  if (subStep === 1 && !data.destination) {
    return "Selecciona un aerodromo de destino.";
  }
  if (subStep === 2) {
    if (!data.alternate1 || !data.alternate2) {
      return "Selecciona ambos aerodromos alternativos.";
    }
  }
  if (subStep === 3) {
    return validateEobtFields(data);
  }
  return null;
}

type Step1ContentProps = {
  accessToken: string;
  subStep: number;
  data: Step1Data;
  onDataChange: (data: Step1Data) => void;
};

export function Step1Content({ accessToken, subStep, data, onDataChange }: Step1ContentProps) {
  const currentSub = STEP1_SUB_STEPS[subStep];

  const updateField = React.useCallback(
    <K extends keyof Step1Data>(key: K, value: Step1Data[K]) => {
      onDataChange({ ...data, [key]: value });
    },
    [data, onDataChange],
  );

  return (
    <View className="gap-8">
      <View className="gap-3">
        <View className="flex-row items-center gap-2">
          <Badge variant="default">
            <Hash size={12} color="#3f3f46" strokeWidth={2.5} />
            <Text className="text-xs font-semibold text-zinc-700">{currentSub.icaoField}</Text>
          </Badge>
          <Badge variant="blue">Aerodromos</Badge>
        </View>
        <Text className="text-4xl font-bold leading-tight text-zinc-950">{currentSub.title}</Text>
      </View>

      <View className="gap-4">
        {subStep === 0 ? (
          <AerodromeCombobox
            accessToken={accessToken}
            selected={data.departure}
            onSelect={(value) => updateField("departure", value)}
            placeholder={currentSub.placeholder}
          />
        ) : null}

        {subStep === 1 ? (
          <AerodromeCombobox
            accessToken={accessToken}
            selected={data.destination}
            onSelect={(value) => updateField("destination", value)}
            placeholder={currentSub.placeholder}
          />
        ) : null}

        {subStep === 2 ? (
          <View className="gap-6">
            <AerodromeCombobox
              accessToken={accessToken}
              selected={data.alternate1}
              onSelect={(value) => updateField("alternate1", value)}
              placeholder="Primer alternativo"
              label="Alternativo 1"
            />
            <AerodromeCombobox
              accessToken={accessToken}
              selected={data.alternate2}
              onSelect={(value) => updateField("alternate2", value)}
              placeholder="Segundo alternativo"
              label="Alternativo 2"
            />
          </View>
        ) : null}

        {subStep === 3 ? (
          <EobtFields
            data={data}
            onChange={(patch) => onDataChange({ ...data, ...patch })}
          />
        ) : null}
      </View>
    </View>
  );
}
