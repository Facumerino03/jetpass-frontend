import {
  Home,
  Plane,
  List,
  MoreHorizontal,
  Plus,
} from "lucide-react-native";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export default function FloatingNavbar({
  state,
  descriptors,
  navigation,
}: TabBarProps) {
  const insets = useSafeAreaInsets();

  const tabColors = {
    index: { background: "#f4f4f5", icon: "#09090b" },
    aircraft: { background: "#f4f4f5", icon: "#09090b" },
    plans: { background: "#f4f4f5", icon: "#09090b" },
    more: { background: "#f4f4f5", icon: "#09090b" },
    "create-fpl": { background: "#09090b", icon: "#ffffff" },
  };

  const getIcon = (routeName: string, color: string) => {
    const isCreate = routeName === "create-fpl";
    const iconProps = { 
      size: isCreate ? 30 : 24, 
      color,
      strokeWidth: isCreate ? 2.5 : 2 
    };

    switch (routeName) {
      case "index":
        return <Home {...iconProps} />;
      case "aircraft":
        return <Plane {...iconProps} />;
      case "plans":
        return <List {...iconProps} />;
      case "more":
        return <MoreHorizontal {...iconProps} />;
      case "create-fpl":
        return <Plus {...iconProps} />;
      default:
        return <Home {...iconProps} />;
    }
  };

  const getTabStyle = (routeName: string, isFocused: boolean) => {
    const routeColors = tabColors[routeName as keyof typeof tabColors] || tabColors.index;
    
    if (routeName === 'create-fpl') {
      return {
        backgroundColor: routeColors.background,
      };
    }
    
    return isFocused ? { backgroundColor: routeColors.background } : {};
  };

  const getIconColor = (routeName: string, isFocused: boolean) => {
    const routeColors = tabColors[routeName as keyof typeof tabColors] || tabColors.index;
    
    if (routeName === 'create-fpl') {
      return routeColors.icon;
    }
    
    return isFocused ? routeColors.icon : "#09090b";
  };

  const mainRoutes = state.routes.filter((route: any) => route.name !== "create-fpl");
  const createFplRoute = state.routes.find((route: any) => route.name === "create-fpl");

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + 20 }]}>
      <View style={styles.mainContainer}>
        {mainRoutes.map((route: any, index: number) => {
          const isFocused = state.index === state.routes.indexOf(route);

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
              key={index}
              onPress={onPress}
              style={[
                styles.tab,
                getTabStyle(route.name, isFocused)
              ]}
            >
              {getIcon(route.name, getIconColor(route.name, isFocused))}
            </TouchableOpacity>
          );
        })}
      </View>

      {createFplRoute && (
        <TouchableOpacity
          onPress={() => {
            const event = navigation.emit({
              type: "tabPress",
              target: createFplRoute.key,
              canPreventDefault: true,
            });

            const isFocused = state.index === state.routes.indexOf(createFplRoute);
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(createFplRoute.name);
            }
          }}
          style={styles.fab}
        >
          {getIcon(
            "create-fpl",
            getIconColor("create-fpl", state.index === state.routes.indexOf(createFplRoute))
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "flex-end", // Aligns the bottoms so the FAB can stick out from the top
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
