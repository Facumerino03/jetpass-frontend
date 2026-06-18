import { cn } from "@/lib/utils";
import * as React from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";

type ToggleGroupOption<T extends string> = {
  value: T;
  label: string;
};

type ToggleGroupProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: ToggleGroupOption<T>[];
  className?: string;
};

export function ToggleGroup<T extends string>({
  value,
  onChange,
  options,
  className,
}: ToggleGroupProps<T>) {
  return (
    <View
      className={cn(
        "flex-row overflow-hidden rounded-md border border-border bg-background shadow-sm",
        className,
      )}
    >
      {options.map((option, index) => {
        const selected = value === option.value;
        return (
          <React.Fragment key={option.value}>
            {index > 0 ? <View className="w-px bg-border" /> : null}
            <Pressable
              onPress={() => onChange(option.value)}
              className={cn(
                "min-w-0 flex-1 items-center justify-center px-3 py-2",
                selected ? "bg-muted" : "bg-background",
              )}
            >
              <Text className="text-sm font-medium text-foreground">{option.label}</Text>
            </Pressable>
          </React.Fragment>
        );
      })}
    </View>
  );
}
