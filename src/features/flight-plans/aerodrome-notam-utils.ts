import type { NotamAlert, NotamEntry, NotamIntelligencePayload } from "./types";

const INTERNAL_NOTAM_ALERT_PATTERNS = [/cached/i, /refreshing/i, /older than/i, /force_refresh/i];

export function filterPilotNotamAlerts(alerts: NotamAlert[]): NotamAlert[] {
  return alerts.filter((alert) => {
    const text = `${alert.message ?? ""} ${alert.code ?? ""}`;
    return !INTERNAL_NOTAM_ALERT_PATTERNS.some((pattern) => pattern.test(text));
  });
}

export type NotamValidityStatus = "active" | "upcoming" | "expired" | "permanent";

export type NotamFilterOption = {
  id: string;
  label: string;
  count: number;
};

const ALL_FIRS_KEY = "AVISOS A TODAS LAS FIRS";

export function formatNotamDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function getNotamValidity(
  validFrom: string | null,
  validTo: string | null,
  now = new Date(),
): NotamValidityStatus {
  if (!validTo) return "permanent";
  const to = new Date(validTo);
  if (!Number.isNaN(to.getTime()) && to < now) return "expired";
  if (validFrom) {
    const from = new Date(validFrom);
    if (!Number.isNaN(from.getTime()) && from > now) return "upcoming";
  }
  return "active";
}

export function validityLabel(status: NotamValidityStatus): string {
  switch (status) {
    case "active":
      return "Vigente";
    case "upcoming":
      return "Próximo";
    case "expired":
      return "Vencido";
    case "permanent":
      return "Permanente";
  }
}

export function validityTone(status: NotamValidityStatus): {
  pill: string;
  text: string;
} {
  switch (status) {
    case "active":
      return { pill: "bg-emerald-50 border-emerald-200", text: "text-emerald-800" };
    case "upcoming":
      return { pill: "bg-sky-50 border-sky-200", text: "text-sky-800" };
    case "expired":
      return { pill: "bg-zinc-100 border-zinc-200", text: "text-zinc-500" };
    case "permanent":
      return { pill: "bg-amber-50 border-amber-200", text: "text-amber-800" };
  }
}

export function pickNotamText(notam: NotamEntry): string {
  return (
    notam.spanish_text?.trim() ||
    notam.english_text?.trim() ||
    notam.raw_text?.trim() ||
    "—"
  );
}

export function formatValidityRange(validFrom: string | null, validTo: string | null): string {
  const from = formatNotamDate(validFrom);
  const to = validTo ? formatNotamDate(validTo) : "Permanente";
  if (!from && !validTo) return "—";
  if (!from) return `Hasta ${to}`;
  return `${from} → ${to}`;
}

function shortenFirLocation(location: string): string {
  if (location === ALL_FIRS_KEY) return "Todas las FIR";
  return location.replace(/^AVISOS FIR\s+/i, "FIR ");
}

export function buildNotamFilters(payload: NotamIntelligencePayload): NotamFilterOption[] {
  const filters: NotamFilterOption[] = [];

  if (payload.aerodrome_notams.length > 0) {
    filters.push({
      id: "aerodrome",
      label: "Aeródromo",
      count: payload.aerodrome_notams.length,
    });
  }

  const byLocation = payload.fir_notams_by_location ?? {};
  const locationKeys = Object.keys(byLocation);

  if (byLocation[ALL_FIRS_KEY]?.length) {
    filters.push({
      id: `fir:${ALL_FIRS_KEY}`,
      label: shortenFirLocation(ALL_FIRS_KEY),
      count: byLocation[ALL_FIRS_KEY].length,
    });
  }

  const specificFirs = locationKeys
    .filter((key) => key !== ALL_FIRS_KEY)
    .sort((a, b) => a.localeCompare(b, "es"));

  for (const key of specificFirs) {
    const items = byLocation[key];
    if (!items?.length) continue;
    filters.push({
      id: `fir:${key}`,
      label: shortenFirLocation(key),
      count: items.length,
    });
  }

  if (!filters.length && payload.fir_notams.length > 0) {
    filters.push({
      id: "fir:all",
      label: "FIR",
      count: payload.fir_notams.length,
    });
  }

  return filters;
}

export function getNotamsForFilter(
  payload: NotamIntelligencePayload,
  filterId: string,
): NotamEntry[] {
  if (filterId === "aerodrome") {
    return sortNotams(payload.aerodrome_notams);
  }

  if (filterId === "fir:all") {
    return sortNotams(payload.fir_notams);
  }

  if (filterId.startsWith("fir:")) {
    const location = filterId.slice(4);
    const items = payload.fir_notams_by_location?.[location] ?? [];
    return sortNotams(items);
  }

  return [];
}

function sortNotams(items: NotamEntry[]): NotamEntry[] {
  return [...items].sort((a, b) => {
    const aFrom = a.valid_from ? new Date(a.valid_from).getTime() : 0;
    const bFrom = b.valid_from ? new Date(b.valid_from).getTime() : 0;
    return bFrom - aFrom;
  });
}

export function isOperationalNotam(text: string): boolean {
  const upper = text.toUpperCase();
  return (
    upper.includes("RWY") ||
    upper.includes("CLSD") ||
    upper.includes("U/S") ||
    upper.includes("CLOSED") ||
    upper.includes("TWY")
  );
}
