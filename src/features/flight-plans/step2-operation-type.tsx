import * as React from "react";
import { View } from "react-native";
import { ArrowLeftRight, Cloud, Sun } from "lucide-react-native";
import { SelectionCardGrid } from "@/components/ui/selection-card";
import { Text } from "@/components/ui/text";
import type { FlightRules, FlightType } from "./types";

const FLIGHT_RULE_CARDS: {
  value: FlightRules;
  badge: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "V",
    badge: "VFR",
    description: "Vuelo visual",
    icon: <Sun size={16} color="hsl(240 5.9% 10%)" strokeWidth={2} />,
  },
  {
    value: "I",
    badge: "IFR",
    description: "Vuelo instrumental",
    icon: <Cloud size={16} color="hsl(240 5.9% 10%)" strokeWidth={2} />,
  },
  {
    value: "Y",
    badge: "Y",
    description: "Empieza IFR, cambia a VFR",
    icon: <ArrowLeftRight size={16} color="hsl(240 5.9% 10%)" strokeWidth={2} />,
  },
  {
    value: "Z",
    badge: "Z",
    description: "Empieza VFR, cambia a IFR",
    icon: <ArrowLeftRight size={16} color="hsl(240 5.9% 10%)" strokeWidth={2} />,
  },
];

const FLIGHT_TYPE_CARDS: {
  value: FlightType;
  badge: string;
  description: string;
}[] = [
  { value: "G", badge: "G", description: "Aviación general" },
  { value: "S", badge: "S", description: "Servicio regular" },
  { value: "N", badge: "N", description: "No regular (charter)" },
  { value: "M", badge: "M", description: "Militar" },
  { value: "X", badge: "X", description: "Otro" },
];

type Step2OperationTypeProps = {
  flightRules: FlightRules | "";
  flightType: FlightType | "";
  onFlightRulesChange: (value: FlightRules) => void;
  onFlightTypeChange: (value: FlightType) => void;
};

function OperationSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-3">
      <Text className="text-lg font-semibold text-foreground">{title}</Text>
      {children}
    </View>
  );
}

export function Step2OperationType({
  flightRules,
  flightType,
  onFlightRulesChange,
  onFlightTypeChange,
}: Step2OperationTypeProps) {
  return (
    <View className="gap-8">
      <View className="gap-1">
        <Text className="text-4xl font-bold leading-tight text-foreground">Tipo de operación</Text>
      </View>

      <OperationSection title="¿Cómo vas a volar?">
        <SelectionCardGrid
          options={FLIGHT_RULE_CARDS}
          value={flightRules}
          onChange={onFlightRulesChange}
        />
      </OperationSection>

      <OperationSection title="¿Qué tipo de vuelo es?">
        <SelectionCardGrid
          options={FLIGHT_TYPE_CARDS}
          value={flightType}
          onChange={onFlightTypeChange}
        />
      </OperationSection>
    </View>
  );
}
