import {
  Home,
  Plane,
  List,
  MoreHorizontal,
  Plus,
  TicketsPlane,
} from "lucide-react-native";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const TAB_CONFIG: Record<string, { label: string; icon: typeof Home }> = {
  index: { label: "Inicio", icon: Home },
  aircraft: { label: "Aeronaves", icon: Plane },
  plans: { label: "Planes", icon: List },
  more: { label: "Más", icon: MoreHorizontal },
};

const FAB_CONFIG: Record<string, { href: Href; visible: boolean; icon?: typeof Home } | undefined> = {
  index: { href: "/create-fpl", visible: true, icon: TicketsPlane },
  aircraft: { href: "/aircraft/create", visible: true, icon: Plus },
  plans: { href: "/", visible: false },
  more: { href: "/", visible: false },
};

export default function FloatingNavbar({
  state,
  descriptors,
  navigation,
}: TabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const activeRouteName = state.routes[state.index]?.name as string;

  if (activeRouteName === "create-fpl") {
    return null;
  }

  const fabConfig = FAB_CONFIG[activeRouteName];

  const handleFabPress = () => {
    if (fabConfig?.visible && fabConfig.href) {
      router.push(fabConfig.href);
    }
  };

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + 20 }]}>
      <View style={styles.mainContainer}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name];

          if (!config) return null;

          const Icon = config.icon;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={[
                styles.tab,
                isFocused && { backgroundColor: "#f4f4f5" },
              ]}
            >
              <Icon
                size={24}
                color={isFocused ? "#09090b" : "#09090b"}
                strokeWidth={isFocused ? 2.2 : 2.2}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {fabConfig?.visible && (
        <TouchableOpacity
          onPress={handleFabPress}
          activeOpacity={0.8}
          style={styles.fab}
        >
          {(() => {
            const FabIcon = fabConfig.icon ?? Plus;
            return <FabIcon size={28} color="#ffffff" strokeWidth={2.2} />;
          })()}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    alignSelf: "center",
    marginHorizontal: 20,
  },
  mainContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 50,
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  tab: {
    padding: 12,
    borderRadius: 50,
    minWidth: 48,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  fab: {
    backgroundColor: "#09090b",
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
});
