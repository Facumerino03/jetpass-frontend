import { cn } from "@/lib/utils";
import * as React from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { Check } from "lucide-react-native";

export interface CheckboxOption {
  label: string;
  value: string;
}

interface CheckboxGroupProps {
  value: string;
  options: CheckboxOption[];
  onChange: (value: string) => void;
  className?: string;
}

function parseValue(value: string): string[] {
  if (!value.trim()) return [];
  // ICAO codes are typically concatenated without separators,
  // but for our internal representation we use comma-separated.
  // However, some values might have spaces. We split by comma first,
  // then fall back to splitting by whitespace for backward compatibility.
  const trimmed = value.trim();
  if (trimmed.includes(",")) {
    return trimmed.split(",").map((v) => v.trim()).filter(Boolean);
  }
  // For single-letter ICAO codes like "SDFGRW", we might need to match against options
  // but let's keep it simple: if there are no commas and no spaces,
  // treat it as a single value unless options contain it.
  if (trimmed.includes(" ")) {
    return trimmed.split(/\s+/).map((v) => v.trim()).filter(Boolean);
  }
  return [trimmed];
}

function serializeValue(selected: string[]): string {
  return selected.join(", ");
}

export function CheckboxGroup({ value, options, onChange, className }: CheckboxGroupProps) {
  const selected = React.useMemo(() => parseValue(value), [value]);

  const toggleOption = React.useCallback(
    (optionValue: string) => {
      const next = selected.includes(optionValue)
        ? selected.filter((v) => v !== optionValue)
        : [...selected, optionValue];
      onChange(serializeValue(next));
    },
    [selected, onChange],
  );

  return (
    <View className={cn("gap-2", className)}>
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        return (
          <Pressable
            key={option.value}
            onPress={() => toggleOption(option.value)}
            className={cn(
              "flex-row items-center gap-3 rounded-md border px-3 py-2.5 active:opacity-80",
              isSelected
                ? "border-primary bg-primary/10"
                : "border-input bg-background",
            )}
          >
            <View
              className={cn(
                "h-5 w-5 items-center justify-center rounded border",
                isSelected
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30 bg-background",
              )}
            >
              {isSelected && <Check className="text-primary-foreground size-3.5" />}
            </View>
            <Text
              className={cn(
                "text-base",
                isSelected ? "text-primary font-medium" : "text-foreground",
              )}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
