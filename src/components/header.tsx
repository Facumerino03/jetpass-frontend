import { UserRound } from "lucide-react-native";
import React from "react";
import {
  StatusBar,
  Pressable,
  View,
  StyleSheet,
  Text as RNText,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/features/auth/auth-context";

export default function Header() {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();

  const handleSettingsPress = () => {
    console.log("[Header] Settings pressed — logout()");
    logout();
  };

  const handleProfilePress = () => {
    console.log("[Header] Profile pressed");
  };

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={handleProfilePress} hitSlop={20}>
          <View style={styles.avatar}>
            <UserRound size={20} color="#FFFFFF" />
          </View>
        </Pressable>

        <Pressable
          onPress={handleSettingsPress}
          hitSlop={20}
          style={styles.settingsButton}
        >
          <RNText style={styles.settingsText}>Cerrar sesión</RNText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "white",
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f4f4f5",
    borderRadius: 8,
  },
  settingsText: {
    color: "#09090b",
    fontSize: 14,
    fontWeight: "600",
  },
});
