import * as React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { ImmersiveRouteHero } from "./immersive-route-hero";
import {
  computeArrivalFromHhmm,
  formatHhmm,
  shortenAerodromeLabel,
} from "./route-eet-utils";

type Step4RouteProps = {
  departureIcao: string;
  destinationIcao: string;
  departureName?: string | null;
  destinationName?: string | null;
  /** UTC departure time in HHMM format, e.g. "1430" */
  departureTimeUtc?: string | null;
  departureLat?: number | null;
  departureLon?: number | null;
  destinationLat?: number | null;
  destinationLon?: number | null;
  route: string;
  totalEet: string;
  topInset?: number;
  bottomInset?: number;
  footer?: React.ReactNode;
  onRouteChange: (value: string) => void;
  onTotalEetChange: (value: string) => void;
};

export function Step4Route({
  departureIcao,
  destinationIcao,
  departureName,
  destinationName,
  departureTimeUtc,
  departureLat,
  departureLon,
  destinationLat,
  destinationLon,
  route,
  totalEet,
  topInset = 0,
  bottomInset = 0,
  footer,
  onRouteChange,
  onTotalEetChange,
}: Step4RouteProps) {
  const departureTime = formatHhmm(departureTimeUtc);
  const arrivalTime = computeArrivalFromHhmm(departureTimeUtc, totalEet);

  return (
    <View style={styles.root}>
      <ImmersiveRouteHero
        departureIcao={departureIcao}
        destinationIcao={destinationIcao}
        departureName={shortenAerodromeLabel(departureName)}
        destinationName={shortenAerodromeLabel(destinationName)}
        departureTime={departureTime}
        arrivalTime={arrivalTime}
        eet={totalEet}
        departureLat={departureLat}
        departureLon={departureLon}
        destinationLat={destinationLat}
        destinationLon={destinationLon}
        contentTopInset={topInset + 56}
      />

      <View
        className="z-10 -mt-5 w-full rounded-t-[28px] border border-border border-b-0 bg-card pt-6"
        style={[styles.bottomPanelShadow, { paddingBottom: bottomInset + 16 }]}
      >
        <View style={styles.fields}>
          <View style={styles.field}>
            <Text style={styles.label}>Tiempo en ruta (EET)</Text>
            <Input
              value={totalEet}
              onChangeText={(value) => onTotalEetChange(value.replace(/\D/g, "").slice(0, 4))}
              placeholder="0130"
              keyboardType="number-pad"
              className="h-14 rounded-2xl border-zinc-200 text-lg tracking-widest"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Ruta</Text>
            <Input
              value={route}
              onChangeText={(value) => onRouteChange(value.toUpperCase())}
              placeholder="DCT GUALE DCT"
              autoCapitalize="characters"
              className="h-14 rounded-2xl border-zinc-200 text-lg"
            />
          </View>
        </View>

        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bottomPanelShadow: Platform.select({
    ios: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
    },
    android: {
      elevation: 12,
    },
    default: {},
  }) ?? {},
  fields: {
    paddingHorizontal: 24,
    gap: 16,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#52525b",
  },
});
