import * as React from "react";
import { Pressable, View, type PressableProps } from "react-native";
import { Text } from "@/components/ui/text";

type SelectionCardProps = {
  selected: boolean;
  onPress: () => void;
  title: string;
  description: string;
  badge: string;
  icon?: React.ReactNode;
};

function RadioIndicator({ selected }: { selected: boolean }) {
  if (selected) {
    return (
      <View className="h-4 w-4 items-center justify-center rounded-full border-2 border-primary bg-primary">
        <View className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
      </View>
    );
  }

  return (
    <View className="h-4 w-4 items-center justify-center rounded-full border-2 border-zinc-300 bg-background" />
  );
}

const pressableStyle: PressableProps["style"] = ({ pressed }) => ({
  opacity: pressed ? 0.9 : 1,
});

export function SelectionCard({
  selected,
  onPress,
  description,
  badge,
  icon,
}: SelectionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={pressableStyle}
      className={
        selected
          ? "h-[118px] rounded-xl border border-primary bg-accent p-3.5"
          : "h-[118px] rounded-xl border border-border bg-card p-3.5"
      }
    >
      <View className="h-5 flex-row items-center justify-between gap-2">
        <View className="min-w-0 flex-1 flex-row items-center gap-2">
          {icon ? <View className="shrink-0">{icon}</View> : null}
          <View className="min-w-[40px] items-center rounded-md bg-secondary px-2 py-0.5">
            <Text className="text-xs font-semibold text-secondary-foreground">{badge}</Text>
          </View>
        </View>
        <RadioIndicator selected={selected} />
      </View>
      <View className="mt-3 min-h-[44px] justify-start">
        <Text className="text-sm leading-5 text-muted-foreground" numberOfLines={2}>
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

type SelectionCardGridProps<T extends string> = {
  options: {
    value: T;
    badge: string;
    description: string;
    icon?: React.ReactNode;
  }[];
  value: T | "";
  onChange: (value: T) => void;
};

export function SelectionCardGrid<T extends string>({
  options,
  value,
  onChange,
}: SelectionCardGridProps<T>) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {options.map((option) => (
        <View key={option.value} className="w-[48%] shrink-0 grow-0">
          <SelectionCard
            selected={value === option.value}
            onPress={() => onChange(option.value)}
            badge={option.badge}
            title={option.badge}
            description={option.description}
            icon={option.icon}
          />
        </View>
      ))}
    </View>
  );
}
