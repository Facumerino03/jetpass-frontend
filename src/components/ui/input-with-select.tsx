import { cn } from "@/lib/utils";
import * as React from "react";
import { Pressable, View } from "react-native";
import { Check, ChevronDown } from "lucide-react-native";
import { Text } from "@/components/ui/text";

export type InputWithSelectOption = {
  value: string;
  label: string;
  description?: string;
};

type InputWithSelectProps = {
  value: string;
  options: InputWithSelectOption[];
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  menuWidth?: number;
};

export function InputWithSelect({
  value,
  options,
  onValueChange,
  children,
  className,
  menuWidth = 160,
}: InputWithSelectProps) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View className={cn("relative z-10", className)}>
      <View className="flex-row overflow-hidden rounded-lg border border-border bg-background">
        <Pressable
          onPress={() => setOpen((prev) => !prev)}
          className="flex-row items-center gap-1 border-r border-border px-3 py-3.5"
        >
          <Text className="text-sm font-medium text-foreground">{selected?.label ?? "..."}</Text>
          <ChevronDown size={14} color="hsl(240 3.8% 46.1%)" strokeWidth={2} />
        </Pressable>
        <View className="min-w-0 flex-1 flex-row items-center">{children}</View>
      </View>

      {open ? (
        <View
          style={{ width: menuWidth }}
          className="absolute top-full left-0 z-50 mt-1 overflow-hidden rounded-md border border-border bg-popover shadow-md"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  onValueChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex-row items-center justify-between px-3 py-2.5 active:bg-accent",
                  isSelected && "bg-accent",
                )}
              >
                <View className="min-w-0 flex-1 pr-2">
                  <Text className="text-sm font-medium text-foreground">{option.label}</Text>
                  {option.description ? (
                    <Text className="text-xs text-muted-foreground">{option.description}</Text>
                  ) : null}
                </View>
                {isSelected ? <Check size={14} color="hsl(240 5.9% 10%)" strokeWidth={2.5} /> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
