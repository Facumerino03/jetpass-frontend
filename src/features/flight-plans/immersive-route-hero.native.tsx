import * as React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, UrlTile, PROVIDER_GOOGLE } from "react-native-maps";
import type { MapType } from "react-native-maps";
import { Clock, Layers, Pause, Play } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { formatEetLabel } from "./route-eet-utils";

// ─── Great-circle maths ──────────────────────────────────────────────────────

type Coord = { latitude: number; longitude: number };

function toRad(d: number) {
  return (d * Math.PI) / 180;
}
function toDeg(r: number) {
  return (r * 180) / Math.PI;
}

function greatCirclePoints(p1: Coord, p2: Coord, n: number): Coord[] {
  const φ1 = toRad(p1.latitude), λ1 = toRad(p1.longitude);
  const φ2 = toRad(p2.latitude), λ2 = toRad(p2.longitude);
  const d =
    2 * Math.asin(Math.sqrt(
      Math.sin((φ2 - φ1) / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2,
    ));
  if (d < 1e-10) return Array(n + 1).fill(p1);
  return Array.from({ length: n + 1 }, (_, i) => {
    const f = i / n;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
    const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
    const z = A * Math.sin(φ1) + B * Math.sin(φ2);
    return {
      latitude: toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))),
      longitude: toDeg(Math.atan2(y, x)),
    };
  });
}

function dashedPolylines(p1: Coord, p2: Coord): Coord[][] {
  const TOTAL = 72, DASH = 5, GAP = 3, STEP = DASH + GAP;
  const all = greatCirclePoints(p1, p2, TOTAL);
  const segments: Coord[][] = [];
  for (let i = 0; i < all.length - 1; i += STEP) {
    const end = Math.min(i + DASH, all.length - 1);
    if (end > i) segments.push(all.slice(i, end + 1));
  }
  return segments;
}

function computeRegion(p1: Coord, p2: Coord) {
  const latDelta = Math.abs(p2.latitude - p1.latitude);
  const lonDelta = Math.abs(p2.longitude - p1.longitude);
  return {
    latitude: (p1.latitude + p2.latitude) / 2,
    longitude: (p1.longitude + p2.longitude) / 2,
    latitudeDelta: Math.max(latDelta * 1.6, 1.0),
    longitudeDelta: Math.max(lonDelta * 1.6, 1.0),
  };
}

// ─── LibreWXR ─────────────────────────────────────────────────────────────────

// NEXRAD Level III color scheme — standard in aviation
const LIBREWXR_COLOR = 6;

type LibreWxrFrame = { time: number; path: string };

type TileFrame = { url: string; time: number };

type LibreWxrData = {
  radar: TileFrame | null;
  satellite: TileFrame | null;
  nowcastFrames: TileFrame[];
};

async function fetchLibreWxrData(): Promise<LibreWxrData> {
  const empty: LibreWxrData = { radar: null, satellite: null, nowcastFrames: [] };
  try {
    const res = await fetch("https://api.librewxr.net/public/weather-maps.json");
    if (!res.ok) return empty;
    const data = await res.json() as {
      host: string;
      radar: { past: LibreWxrFrame[]; nowcast?: LibreWxrFrame[] };
      satellite?: { infrared?: LibreWxrFrame[] };
    };
    const host = data.host;

    const past = data.radar?.past ?? [];
    const latestRadar = past[past.length - 1];
    const radar: TileFrame | null = latestRadar
      ? { url: `${host}${latestRadar.path}/256/{z}/{x}/{y}/${LIBREWXR_COLOR}/1_1.png`, time: latestRadar.time }
      : null;

    const nowcastFrames: TileFrame[] = (data.radar?.nowcast ?? []).map((f) => ({
      url: `${host}${f.path}/256/{z}/{x}/{y}/${LIBREWXR_COLOR}/1_1.png`,
      time: f.time,
    }));

    const satFrames = data.satellite?.infrared ?? [];
    const latestSat = satFrames[satFrames.length - 1];
    const satellite: TileFrame | null = latestSat
      ? { url: `${host}${latestSat.path}/256/{z}/{x}/{y}/0/0_0.png`, time: latestSat.time }
      : null;

    return { radar, satellite, nowcastFrames };
  } catch {
    return empty;
  }
}

function formatUtcTime(unixSec: number): string {
  const d = new Date(unixSec * 1000);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm} UTC`;
}

// ─── Weather layer config ─────────────────────────────────────────────────────

const OWM_API_KEY = process.env.EXPO_PUBLIC_OWM_API_KEY ?? "";

type WeatherLayerId =
  | "radar"
  | "nowcast"
  | "satellite"
  | "precipitation_new"
  | "clouds_new"
  | "wind_new"
  | "temp_new"
  | "pressure_new";

type WeatherLayer = {
  id: WeatherLayerId;
  label: string;
  emoji: string;
};

const WEATHER_LAYERS: WeatherLayer[] = [
  { id: "radar",            label: "Radar",         emoji: "🌩️" },
  { id: "nowcast",          label: "Pronóstico",    emoji: "🔮" },
  { id: "satellite",        label: "Satélite",      emoji: "🛰️" },
  { id: "precipitation_new",label: "Precipitación", emoji: "🌧️" },
  { id: "clouds_new",       label: "Nubes",         emoji: "☁️" },
  { id: "wind_new",         label: "Viento",        emoji: "💨" },
  { id: "temp_new",         label: "Temperatura",   emoji: "🌡️" },
  { id: "pressure_new",     label: "Presión",       emoji: "🔵" },
];

function owmTileUrl(
  layerId: Exclude<WeatherLayerId, "radar" | "nowcast" | "satellite">,
): string | null {
  if (!OWM_API_KEY) return null;
  return `https://tile.openweathermap.org/map/${layerId}/{z}/{x}/{y}.png?appid=${OWM_API_KEY}`;
}

// ─── Layer selector ───────────────────────────────────────────────────────────

function WeatherLayerSelector({
  activeLayer,
  onToggle,
}: {
  activeLayer: WeatherLayerId | null;
  onToggle: (id: WeatherLayerId) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.pillsRow}
      style={styles.pillsScroll}
    >
      {WEATHER_LAYERS.map((layer) => {
        const active = activeLayer === layer.id;
        return (
          <Pressable
            key={layer.id}
            onPress={() => onToggle(layer.id)}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Text style={styles.pillEmoji}>{layer.emoji}</Text>
            <Text style={[styles.pillLabel, active && styles.pillLabelActive]}>
              {layer.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export type ImmersiveRouteHeroProps = {
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

const DEFAULT_REGION = {
  latitude: -34.61,
  longitude: -58.37,
  latitudeDelta: 20,
  longitudeDelta: 20,
};

const ROUTE_COLOR = "rgba(255,255,255,0.90)";
const ROUTE_WIDTH = 2.5;

export function ImmersiveRouteHero({
  departureIcao,
  destinationIcao,
  departureName,
  destinationName,
  departureTime,
  arrivalTime,
  eet = "",
  contentTopInset = 72,
  departureLat,
  departureLon,
  destinationLat,
  destinationLon,
}: ImmersiveRouteHeroProps) {
  const durationLabel = formatEetLabel(eet);
  const [activeLayer, setActiveLayer] = React.useState<WeatherLayerId | null>(null);
  const [mapType, setMapType] = React.useState<MapType>("standard");
  const [lwxrRadar, setLwxrRadar] = React.useState<TileFrame | null>(null);
  const [lwxrSatellite, setLwxrSatellite] = React.useState<TileFrame | null>(null);
  const [lwxrNowcast, setLwxrNowcast] = React.useState<TileFrame[]>([]);
  const [nowcastIdx, setNowcastIdx] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);

  React.useEffect(() => {
    fetchLibreWxrData().then(({ radar, satellite, nowcastFrames }) => {
      if (radar) setLwxrRadar(radar);
      if (satellite) setLwxrSatellite(satellite);
      if (nowcastFrames.length) setLwxrNowcast(nowcastFrames);
    });
  }, []);

  React.useEffect(() => {
    if (!isPlaying || activeLayer !== "nowcast" || lwxrNowcast.length === 0) return;
    const timer = setInterval(() => {
      setNowcastIdx((prev) => (prev + 1) % lwxrNowcast.length);
    }, 900);
    return () => clearInterval(timer);
  }, [isPlaying, activeLayer, lwxrNowcast.length]);

  React.useEffect(() => {
    if (activeLayer !== "nowcast") {
      setIsPlaying(false);
      setNowcastIdx(0);
    }
  }, [activeLayer]);

  const cycleMapType = React.useCallback(() => {
    setMapType((prev) => {
      if (prev === "standard") return "satellite";
      if (prev === "satellite") return "hybrid";
      return "standard";
    });
  }, []);

  const hasCoords =
    departureLat != null && departureLon != null &&
    destinationLat != null && destinationLon != null;

  const depCoord: Coord | null = hasCoords
    ? { latitude: departureLat!, longitude: departureLon! }
    : null;
  const desCoord: Coord | null = hasCoords
    ? { latitude: destinationLat!, longitude: destinationLon! }
    : null;

  const region = depCoord && desCoord ? computeRegion(depCoord, desCoord) : DEFAULT_REGION;
  const dashes = depCoord && desCoord ? dashedPolylines(depCoord, desCoord) : [];

  const handleToggleLayer = (id: WeatherLayerId) => {
    setActiveLayer((prev) => (prev === id ? null : id));
  };

  const activeTileUrl = React.useMemo<string | null>(() => {
    if (!activeLayer) return null;
    if (activeLayer === "radar") return lwxrRadar?.url ?? null;
    if (activeLayer === "satellite") return lwxrSatellite?.url ?? null;
    if (activeLayer === "nowcast") return lwxrNowcast[nowcastIdx]?.url ?? null;
    return owmTileUrl(activeLayer);
  }, [activeLayer, lwxrRadar, lwxrSatellite, lwxrNowcast, nowcastIdx]);

  const activeLayerTime = React.useMemo<number | null>(() => {
    if (activeLayer === "radar") return lwxrRadar?.time ?? null;
    if (activeLayer === "satellite") return lwxrSatellite?.time ?? null;
    if (activeLayer === "nowcast") return lwxrNowcast[nowcastIdx]?.time ?? null;
    return null;
  }, [activeLayer, lwxrRadar, lwxrSatellite, lwxrNowcast, nowcastIdx]);

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        mapType={mapType}
        initialRegion={region}
        scrollEnabled
        zoomEnabled
        rotateEnabled
        pitchEnabled={false}
        showsCompass
        showsScale={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsPointsOfInterest={false}
        showsBuildings={false}
        toolbarEnabled={false}
      >
        {activeTileUrl ? (
          <UrlTile
            urlTemplate={activeTileUrl}
            maximumZ={19}
            flipY={false}
            opacity={
              activeLayer === "radar" || activeLayer === "nowcast" ? 0.82
              : activeLayer === "satellite" ? 0.90
              : 0.80
            }
            zIndex={1}
          />
        ) : null}

        {depCoord ? (
          <Marker
            coordinate={depCoord}
            title={departureIcao}
            description={departureName ?? undefined}
            pinColor="#0ea5e9"
            zIndex={2}
          />
        ) : null}

        {desCoord ? (
          <Marker
            coordinate={desCoord}
            title={destinationIcao}
            description={destinationName ?? undefined}
            pinColor="#f97316"
            zIndex={2}
          />
        ) : null}

        {dashes.map((coords, i) => (
          <Polyline
            key={`dash-${i}`}
            coordinates={coords}
            strokeColor={ROUTE_COLOR}
            strokeWidth={ROUTE_WIDTH}
            zIndex={3}
          />
        ))}
      </MapView>

      {/* Airport info overlay */}
      <View
        style={[styles.overlay, { paddingTop: contentTopInset }]}
        pointerEvents="none"
      >
        <View style={styles.infoCard}>
          <View style={styles.airportBlock}>
            <Text style={styles.timeText}>{departureTime ?? "—:—"}</Text>
            {departureName ? (
              <Text style={styles.airportName} numberOfLines={1}>{departureName}</Text>
            ) : null}
            <Text style={styles.icaoCode}>{departureIcao}</Text>
          </View>

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

      {/* Layer selector — bottom floating */}
      <View style={styles.pillsContainer} pointerEvents="box-none">
        {/* Timestamp + nowcast controls */}
        {activeLayerTime != null ? (
          <View style={styles.timeBar} pointerEvents="box-none">
            {activeLayer === "nowcast" && lwxrNowcast.length > 0 ? (
              <Pressable
                onPress={() => setIsPlaying((p) => !p)}
                style={styles.playBtn}
                pointerEvents="auto"
              >
                {isPlaying
                  ? <Pause size={13} color="#fff" strokeWidth={2.5} />
                  : <Play size={13} color="#fff" strokeWidth={2.5} />
                }
              </Pressable>
            ) : null}
            <Text style={styles.timeLabel}>
              {activeLayer === "nowcast"
                ? `+${nowcastIdx + 1}/${lwxrNowcast.length} · ${formatUtcTime(activeLayerTime)}`
                : formatUtcTime(activeLayerTime)
              }
            </Text>
          </View>
        ) : null}

        <View style={styles.pillsRow2}>
          <WeatherLayerSelector activeLayer={activeLayer} onToggle={handleToggleLayer} />
          {/* Map type button */}
          <Pressable onPress={cycleMapType} style={styles.mapTypeBtn} pointerEvents="auto">
            <Layers size={15} color="#fff" strokeWidth={2} />
            <Text style={styles.mapTypeBtnLabel}>
              {mapType === "standard" ? "Mapa" : mapType === "satellite" ? "Satélite" : "Híbrido"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, overflow: "hidden" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-start",
    paddingHorizontal: 20,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(0,0,0,0.42)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  airportBlock: { flex: 1, gap: 3 },
  airportBlockRight: { alignItems: "flex-end" },
  centerBlock: { alignItems: "center", paddingHorizontal: 8, paddingTop: 6 },
  timeText: {
    fontSize: 28, fontWeight: "700", color: "#ffffff", letterSpacing: -0.5,
  },
  airportName: {
    fontSize: 12, fontWeight: "500", color: "rgba(255,255,255,0.80)",
  },
  icaoCode: {
    fontSize: 10, fontWeight: "600", color: "rgba(255,255,255,0.60)",
    letterSpacing: 1.2, textTransform: "uppercase",
  },
  textRight: { textAlign: "right" },
  eetPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  eetText: { fontSize: 11, fontWeight: "700", color: "#ffffff" },
  eetPlaceholder: {
    fontSize: 9, fontWeight: "600", color: "rgba(255,255,255,0.40)",
    letterSpacing: 1.5, textTransform: "uppercase",
  },
  pillsContainer: { position: "absolute", bottom: 16, left: 0, right: 0, gap: 6 },
  pillsScroll: { flexGrow: 0 },
  pillsRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16 },
  pillsRow2: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 8 },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100,
    backgroundColor: "rgba(0,0,0,0.52)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.20)",
  },
  pillActive: {
    backgroundColor: "rgba(14,165,233,0.85)",
    borderColor: "rgba(255,255,255,0.50)",
  },
  pillEmoji: { fontSize: 13 },
  pillLabel: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.75)" },
  pillLabelActive: { color: "#ffffff" },
  timeBar: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start", marginHorizontal: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
  },
  timeLabel: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.90)" },
  playBtn: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.20)",
    alignItems: "center", justifyContent: "center",
  },
  mapTypeBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: 100,
    backgroundColor: "rgba(0,0,0,0.52)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.20)",
    marginLeft: "auto",
  },
  mapTypeBtnLabel: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.80)" },
});
