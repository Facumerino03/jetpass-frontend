import * as React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { Clock } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { formatEetLabel } from "./route-eet-utils";

type ImmersiveRouteHeroProps = {
  departureIcao: string;
  destinationIcao: string;
  departureName?: string | null;
  destinationName?: string | null;
  departureTime?: string | null;
  arrivalTime?: string | null;
  eet?: string;
  contentTopInset?: number;
  departureLat?: number | null;
  departureLon?: number | null;
  destinationLat?: number | null;
  destinationLon?: number | null;
};

const VW = 390;
const VH = 500;

const ARC_START_X = 56;
const ARC_START_Y = 320;
const ARC_END_X = VW - 56;
const ARC_END_Y = 320;
const ARC_CTRL_X = VW / 2;
const ARC_CTRL_Y = 130;

const ARC_PATH = `M ${ARC_START_X} ${ARC_START_Y} Q ${ARC_CTRL_X} ${ARC_CTRL_Y} ${ARC_END_X} ${ARC_END_Y}`;

export function ImmersiveRouteHero({
  departureIcao,
  destinationIcao,
  departureName,
  destinationName,
  departureTime,
  arrivalTime,
  eet = "",
  contentTopInset = 72,
  // lat/lon accepted but unused in SVG fallback
  departureLat: _depLat,
  departureLon: _depLon,
  destinationLat: _desLat,
  destinationLon: _desLon,
}: ImmersiveRouteHeroProps) {
  const durationLabel = formatEetLabel(eet);

  return (
    <View style={styles.container}>
      {/* Gradient + arc */}
      <Svg
        style={StyleSheet.absoluteFill}
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#0EA5E9" />
            <Stop offset="40%" stopColor="#38BDF8" />
            <Stop offset="72%" stopColor="#BAE6FD" />
            <Stop offset="90%" stopColor="#F0F9FF" />
            <Stop offset="100%" stopColor="#FFFFFF" />
          </LinearGradient>
        </Defs>

        <Rect x={0} y={0} width={VW} height={VH} fill="url(#grad)" />

        {/* Dashed arc */}
        <Path
          d={ARC_PATH}
          stroke="rgba(255,255,255,0.70)"
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeDasharray="6,8"
        />

        {/* Origin dot */}
        <Circle cx={ARC_START_X} cy={ARC_START_Y} r={9} fill="white" opacity={0.9} />
        <Circle cx={ARC_START_X} cy={ARC_START_Y} r={4} fill="#0EA5E9" />

        {/* Destination dot */}
        <Circle cx={ARC_END_X} cy={ARC_END_Y} r={9} fill="white" opacity={0.9} />
        <Circle cx={ARC_END_X} cy={ARC_END_Y} r={4} fill="#0EA5E9" />
      </Svg>

      {/* Text overlay — departure left, center pill, destination right */}
      <View style={[styles.overlay, { paddingTop: contentTopInset }]}>
        {/* Top row: times + names */}
        <View style={styles.topRow}>
          {/* Departure */}
          <View style={styles.airportBlock}>
            <Text style={styles.timeText}>{departureTime ?? "—:—"}</Text>
            {departureName ? (
              <Text style={styles.airportName} numberOfLines={1}>{departureName}</Text>
            ) : null}
            <Text style={styles.icaoCode}>{departureIcao}</Text>
          </View>

          {/* Center: EET pill */}
          <View style={styles.centerBlock}>
            {durationLabel ? (
              <View style={styles.eetPill}>
                <Clock size={11} color="white" strokeWidth={2.5} />
                <Text style={styles.eetText}>{durationLabel}</Text>
              </View>
            ) : (
              <Text style={styles.eetPlaceholder}>EET</Text>
            )}
          </View>

          {/* Destination */}
          <View style={[styles.airportBlock, styles.airportBlockRight]}>
            <Text style={styles.timeText}>{arrivalTime ?? "—:—"}</Text>
            {destinationName ? (
              <Text style={[styles.airportName, styles.textRight]} numberOfLines={1}>
                {destinationName}
              </Text>
            ) : null}
            <Text style={[styles.icaoCode, styles.textRight]}>{destinationIcao}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-start",
    paddingHorizontal: 24,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  airportBlock: {
    flex: 1,
    gap: 3,
  },
  airportBlockRight: {
    alignItems: "flex-end",
  },
  centerBlock: {
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  timeText: {
    fontSize: 30,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  airportName: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.85)",
  },
  icaoCode: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  textRight: {
    textAlign: "right",
  },
  eetPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  eetText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },
  eetPlaceholder: {
    fontSize: 9,
    fontWeight: "600",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
});
