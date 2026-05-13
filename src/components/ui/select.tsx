import { cn } from "@/lib/utils";
import * as React from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { ChevronDown } from "lucide-react-native";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function Select({ value, options, onChange, placeholder = "Seleccionar...", className }: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder;

  return (
    <View className={cn("relative", className)}>
      <Pressable
        onPress={() => setOpen(!open)}
        className={cn(
          "border-input bg-background h-12 flex-row items-center justify-between rounded-md border px-3",
          open && "border-ring",
        )}
      >
        <Text className={cn("text-base", !value && "text-muted-foreground")}>
          {selectedLabel}
        </Text>
        <ChevronDown className={cn("text-muted-foreground size-4", open && "rotate-180")} />
      </Pressable>

      {open && (
        <View className="border-input bg-background absolute top-[52px] right-0 left-0 z-50 rounded-md border shadow-lg">
          {options.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "h-12 justify-center px-3",
                option.value === value && "bg-accent",
              )}
            >
              <Text
                className={cn(
                  "text-base",
                  option.value === value ? "text-accent-foreground font-medium" : "text-foreground",
                )}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
