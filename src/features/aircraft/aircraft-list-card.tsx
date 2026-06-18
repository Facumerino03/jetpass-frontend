import * as React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { ArrowUpRight, Check, Hash, Heart, Plane, Wind } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import type { AircraftPublic } from "./types";

type AircraftListCardProps = {
  aircraft: AircraftPublic;
  onPress: () => void;
  selected?: boolean;
  mode?: "navigate" | "select";
};

export function AircraftListCard({
  aircraft,
  onPress,
  selected = false,
  mode = "navigate",
}: AircraftListCardProps) {
  const hasImage = !!aircraft.image_url;
  const isSelectMode = mode === "select";

  return (
    <Pressable onPress={onPress} className="active:opacity-95">
      <View
        style={styles.card}
        className={cn(
          selected && isSelectMode && "border-emerald-500",
          selected && isSelectMode && "border-2",
        )}
      >
        <View className="p-5 pb-7 pt-6">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <View className="flex-row items-baseline gap-2">
                <Text className="text-2xl font-bold text-zinc-900" numberOfLines={1}>
                  {aircraft.alias ?? aircraft.identification}
                </Text>
                <Text className="text-sm text-zinc-500" numberOfLines={1}>
                  {aircraft.icao_type_designator}
                </Text>
              </View>
            </View>

            {isSelectMode ? (
              <View
                className={cn(
                  "h-11 w-11 items-center justify-center rounded-full border-2",
                  selected ? "border-emerald-500 bg-emerald-500" : "border-zinc-200 bg-white",
                )}
              >
                {selected ? <Check size={20} color="#ffffff" strokeWidth={2.5} /> : null}
              </View>
            ) : (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  onPress();
                }}
                className="h-11 w-11 items-center justify-center rounded-full bg-zinc-900 active:bg-zinc-700"
              >
                <ArrowUpRight size={20} color="#ffffff" />
              </Pressable>
            )}
          </View>

          <View className="mt-3 flex-row flex-wrap gap-2">
            <View className="flex-row items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1.5">
              <Hash size={12} color="#f59e0b" />
              <Text className="text-xs font-medium text-amber-700">{aircraft.identification}</Text>
            </View>
            <View className="flex-row items-center gap-1 rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1.5">
              <Plane size={12} color="#0ea5e9" />
              <Text className="text-xs font-medium text-sky-700">{aircraft.icao_type_designator}</Text>
            </View>
            <View className="flex-row items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1.5">
              <Wind size={12} color="#10b981" />
              <Text className="text-xs font-medium text-emerald-700">
                {aircraft.wake_turbulence_category}
              </Text>
            </View>
          </View>
        </View>

        <View className="px-0 pb-0">
          <View style={styles.imageWrapper}>
            {hasImage ? (
              <Image
                source={{ uri: aircraft.image_url! }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={300}
              />
            ) : (
              <View className="flex-1 items-center justify-center bg-zinc-100">
                <Plane size={48} color="#a1a1aa" strokeWidth={1.5} />
              </View>
            )}

            {!isSelectMode ? (
              <View className="absolute bottom-3 left-3 h-8 w-8 items-center justify-center rounded-full bg-white/90">
                <Heart size={16} color="#ef4444" fill="#ef4444" />
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  imageWrapper: {
    height: 220,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    position: "relative",
  },
});
