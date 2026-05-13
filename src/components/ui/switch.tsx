import { cn } from "@/lib/utils";
import * as React from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";

interface SwitchProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  className?: string;
}

export function Switch({ value, onChange, label, className }: SwitchProps) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      className={cn("flex-row items-center gap-3", className)}
    >
      <View
        className={cn(
          "h-7 w-12 rounded-full px-1 justify-center",
          value ? "bg-primary" : "bg-muted",
        )}
      >
        <View
          className={cn(
            "h-5 w-5 rounded-full bg-white shadow-sm",
            value ? "translate-x-5" : "translate-x-0",
          )}
        />
      </View>
      {label && (
        <Text className="text-foreground text-base">{label}</Text>
      )}
    </Pressable>
  );
}
