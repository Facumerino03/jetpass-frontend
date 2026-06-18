export function parseEet(hhmm: string): { hours: number; minutes: number } | null {
  if (hhmm.length !== 4) return null;
  const hours = Number.parseInt(hhmm.slice(0, 2), 10);
  const minutes = Number.parseInt(hhmm.slice(2, 4), 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (hours < 0 || hours > 99 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

export function formatEetLabel(hhmm: string): string | null {
  const parsed = parseEet(hhmm);
  if (!parsed) return null;
  if (parsed.hours === 0 && parsed.minutes === 0) return null;
  if (parsed.minutes === 0) return `${parsed.hours} h`;
  if (parsed.hours === 0) return `${parsed.minutes} min`;
  return `${parsed.hours} h ${parsed.minutes} min`;
}

export function formatUtcClock(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const h = String(date.getUTCHours()).padStart(2, "0");
  const m = String(date.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function computeArrivalUtc(departureIso: string | null | undefined, eet: string): string | null {
  if (!departureIso) return null;
  const parsed = parseEet(eet);
  if (!parsed) return null;
  const arrival = new Date(departureIso);
  if (Number.isNaN(arrival.getTime())) return null;
  arrival.setUTCMinutes(arrival.getUTCMinutes() + parsed.minutes);
  arrival.setUTCHours(arrival.getUTCHours() + parsed.hours);
  return formatUtcClock(arrival.toISOString());
}

/**
 * Formats a HHMM departure_time_utc string (e.g. "1430") as "HH:MM" for display.
 */
export function formatHhmm(hhmm: string | null | undefined): string | null {
  if (!hhmm || hhmm.length !== 4) return null;
  return `${hhmm.slice(0, 2)}:${hhmm.slice(2, 4)}`;
}

/**
 * Computes the arrival time (HH:MM) given a departure HHMM string and an EET HHMM string.
 * Wraps around midnight (modulo 24h).
 */
export function computeArrivalFromHhmm(
  departureHhmm: string | null | undefined,
  eet: string,
): string | null {
  if (!departureHhmm || departureHhmm.length !== 4) return null;
  const dh = Number.parseInt(departureHhmm.slice(0, 2), 10);
  const dm = Number.parseInt(departureHhmm.slice(2, 4), 10);
  if (Number.isNaN(dh) || Number.isNaN(dm)) return null;
  const parsed = parseEet(eet);
  if (!parsed) return null;
  const totalMinutes = dh * 60 + dm + parsed.hours * 60 + parsed.minutes;
  const ah = Math.floor(totalMinutes / 60) % 24;
  const am = totalMinutes % 60;
  return `${String(ah).padStart(2, "0")}:${String(am).padStart(2, "0")}`;
}

export function shortenAerodromeLabel(name: string | null | undefined): string {
  if (!name?.trim()) return "";
  const primary = name.split("/")[0]?.trim() ?? name.trim();
  return primary.length > 28 ? `${primary.slice(0, 25)}…` : primary;
}
