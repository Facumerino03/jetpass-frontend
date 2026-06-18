import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react-native";
import * as React from "react";
import { Platform, Pressable, ScrollView } from "react-native";
import { Text } from "@/components/ui/text";

export type AerodromeInfoTab =
  | "general"
  | "runways"
  | "operations"
  | "aip"
  | "weather"
  | "notam";

type TabOption = {
  value: AerodromeInfoTab;
  label: string;
  icon: LucideIcon;
  tone: "sky" | "emerald" | "amber" | "violet" | "blue" | "rose";
};

const TONE_STYLES = {
  sky: {
    active: "border-sky-200 bg-sky-50",
    inactive: "border-sky-100/80 bg-sky-50/40",
    textActive: "text-sky-900",
    textInactive: "text-sky-800/70",
    iconActive: "#0369a1",
    iconInactive: "#38bdf8",
  },
  emerald: {
    active: "border-emerald-200 bg-emerald-50",
    inactive: "border-emerald-100/80 bg-emerald-50/40",
    textActive: "text-emerald-900",
    textInactive: "text-emerald-800/70",
    iconActive: "#047857",
    iconInactive: "#34d399",
  },
  amber: {
    active: "border-amber-200 bg-amber-50",
    inactive: "border-amber-100/80 bg-amber-50/40",
    textActive: "text-amber-900",
    textInactive: "text-amber-800/70",
    iconActive: "#b45309",
    iconInactive: "#fbbf24",
  },
  violet: {
    active: "border-violet-200 bg-violet-50",
    inactive: "border-violet-100/80 bg-violet-50/40",
    textActive: "text-violet-900",
    textInactive: "text-violet-800/70",
    iconActive: "#6d28d9",
    iconInactive: "#a78bfa",
  },
  blue: {
    active: "border-blue-200 bg-blue-50",
    inactive: "border-blue-100/80 bg-blue-50/40",
    textActive: "text-blue-900",
    textInactive: "text-blue-800/70",
    iconActive: "#1d4ed8",
    iconInactive: "#60a5fa",
  },
  rose: {
    active: "border-rose-200 bg-rose-50",
    inactive: "border-rose-100/80 bg-rose-50/40",
    textActive: "text-rose-900",
    textInactive: "text-rose-800/70",
    iconActive: "#be123c",
    iconInactive: "#fb7185",
  },
} as const;

type AerodromeTabPillsProps = {
  value: AerodromeInfoTab;
  onChange: (value: AerodromeInfoTab) => void;
  options: TabOption[];
};

export function AerodromeTabPills({ value, onChange, options }: AerodromeTabPillsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerClassName="items-center gap-2 px-5 py-1.5"
    >
      {options.map((option) => {
        const selected = value === option.value;
        const tone = TONE_STYLES[option.tone];
        const Icon = option.icon;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className={cn(
              "min-h-[36px] flex-row items-center justify-center gap-1.5 rounded-full border px-3.5 py-2",
              selected ? tone.active : tone.inactive,
            )}
          >
            <Icon size={14} color={selected ? tone.iconActive : tone.iconInactive} strokeWidth={2.25} />
            <Text
              className={cn(
                "text-xs font-semibold leading-none",
                selected ? tone.textActive : tone.textInactive,
              )}
              {...(Platform.OS === "android" ? { includeFontPadding: false } : {})}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export type { TabOption };
