import type { FlightCategory, WeatherCloudLayer, WeatherMetar, WeatherTafPeriod } from "./types";

type CategoryTone = {
  label: string;
  pill: string;
  text: string;
  border: string;
};

const CATEGORY_TONES: Record<string, CategoryTone> = {
  VFR: {
    label: "VFR",
    pill: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-800",
    border: "border-emerald-200",
  },
  MVFR: {
    label: "MVFR",
    pill: "bg-blue-50 border-blue-200",
    text: "text-blue-800",
    border: "border-blue-200",
  },
  IFR: {
    label: "IFR",
    pill: "bg-red-50 border-red-200",
    text: "text-red-800",
    border: "border-red-200",
  },
  LIFR: {
    label: "LIFR",
    pill: "bg-violet-50 border-violet-200",
    text: "text-violet-800",
    border: "border-violet-200",
  },
};

const DEFAULT_TONE: CategoryTone = {
  label: "N/A",
  pill: "bg-zinc-50 border-zinc-200",
  text: "text-zinc-700",
  border: "border-zinc-200",
};

export function getFlightCategoryTone(category: FlightCategory | null | undefined): CategoryTone {
  if (!category) return DEFAULT_TONE;
  return CATEGORY_TONES[category.toUpperCase()] ?? {
    ...DEFAULT_TONE,
    label: category,
  };
}

export function formatUtcShort(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hour12: false,
  }) + " UTC";
}

export function formatUnixUtc(unix: number | null | undefined): string | null {
  if (unix == null) return null;
  const d = new Date(unix * 1000);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hour12: false,
  }) + "Z";
}

export function formatWind(
  dir: number | null | undefined,
  speed: number | null | undefined,
  gust: number | null | undefined,
): string {
  if (dir == null && speed == null) return "—";
  const direction = dir != null ? `${String(dir).padStart(3, "0")}°` : "VRB";
  const spd = speed != null ? `${speed} kt` : "—";
  const gustPart = gust != null ? ` G${gust}` : "";
  return `${direction} / ${spd}${gustPart}`;
}

function toFiniteNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function formatVisibilitySm(sm: unknown): string {
  const miles = toFiniteNumber(sm);
  if (miles == null) {
    if (typeof sm === "string" && sm.trim()) return sm.trim();
    return "—";
  }
  const meters = Math.round(miles * 1609.34);
  return `${miles.toFixed(miles >= 10 ? 0 : 1)} SM (${meters} m)`;
}

export function formatAltimeter(hpa: number | null | undefined): string {
  if (hpa == null) return "—";
  const inHg = (hpa * 0.02953).toFixed(2);
  return `Q${Math.round(hpa)} / ${inHg}"`;
}

export function formatTempDewpoint(temp: number | null | undefined, dew: number | null | undefined): string {
  if (temp == null && dew == null) return "—";
  const t = temp != null ? `${temp}°C` : "—";
  const d = dew != null ? `${dew}°C` : "—";
  return `${t} / ${d}`;
}

export function formatCloudLayers(clouds: WeatherCloudLayer[]): string {
  if (!clouds.length) return "Sin nubes reportadas";
  return clouds
    .map((layer) => {
      const base = layer.base != null ? ` ${layer.base} ft` : "";
      return `${layer.cover}${base}`;
    })
    .join(" · ");
}

export function formatTafPeriodLabel(period: WeatherTafPeriod): string {
  const from = formatUnixUtc(period.timeFrom);
  const to = formatUnixUtc(period.timeTo);
  if (!from || !to) return "Período";
  return `${from} → ${to}`;
}

export function formatTafChangeBadge(period: WeatherTafPeriod): string | null {
  if (period.fcstChange === "PROB" && period.probability != null) {
    return `PROB${period.probability}`;
  }
  return period.fcstChange;
}

export function metarSummaryLines(metar: WeatherMetar) {
  return [
    { label: "Viento", value: formatWind(metar.wind_dir_degrees, metar.wind_speed_kt, metar.wind_gust_kt) },
    { label: "Visibilidad", value: formatVisibilitySm(metar.visibility) },
    { label: "QNH", value: formatAltimeter(metar.altimeter_hpa) },
    { label: "Temp / Punto rocío", value: formatTempDewpoint(metar.temperature_c, metar.dewpoint_c) },
    { label: "Fenómenos", value: metar.present_weather?.trim() || "—" },
  ];
}
