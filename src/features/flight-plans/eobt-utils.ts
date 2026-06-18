import type { Step1Data } from "./step1-onboarding";

export function todayDateOnly(): string {
  return formatDateOnly(new Date());
}

export function isTodayDate(value: string): boolean {
  return value === todayDateOnly();
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^(\d{1,2}):(\d{2})$/;

export function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDateDisplay(value: string): string | null {
  const parsed = parseDateOnly(value);
  if (!parsed) return null;
  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = parsed.getFullYear();
  return `${day}/${month}/${year}`;
}

export function parseDateOnly(value: string): Date | null {
  const match = DATE_RE.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day, 12, 0, 0, 0);
  if (Number.isNaN(date.getTime())) return null;
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function formatTime24h(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function parseTime24h(value: string): { hours: number; minutes: number } | null {
  const match = TIME_RE.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

export function resolveEobtDate(data: Step1Data): string {
  if (data.eobtWhen === "today") return data.eobtDate.trim() || todayDateOnly();
  return data.eobtDate.trim();
}

export function step1DataToDepartureEobtUtc(data: Step1Data): string | null {
  const parsedDate = parseDateOnly(resolveEobtDate(data));
  const parsedTime = parseTime24h(data.eobtTime);
  if (!parsedDate || !parsedTime) return null;

  const year = parsedDate.getFullYear();
  const month = parsedDate.getMonth();
  const day = parsedDate.getDate();
  const { hours, minutes } = parsedTime;

  const ms = data.eobtUseLocalTime
    ? new Date(year, month, day, hours, minutes, 0, 0).getTime()
    : Date.UTC(year, month, day, hours, minutes, 0, 0);

  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

export function validateEobtFields(data: Step1Data): string | null {
  const date = resolveEobtDate(data);
  if (!date) {
    return data.eobtWhen === "today"
      ? "No se pudo determinar la fecha de hoy."
      : "Selecciona la fecha de salida.";
  }
  if (!parseDateOnly(date)) return "Ingresa una fecha valida.";
  const dataWithDate = { ...data, eobtDate: date };
  if (!dataWithDate.eobtTime.trim()) {
    return data.eobtUseLocalTime ? "Selecciona la hora de salida." : "Ingresa la hora en UTC (HH:MM).";
  }
  if (!parseTime24h(dataWithDate.eobtTime)) {
    return data.eobtUseLocalTime
      ? "Selecciona una hora valida."
      : "Ingresa la hora en formato 24h UTC, por ejemplo 14:30.";
  }
  if (!step1DataToDepartureEobtUtc(dataWithDate)) return "No se pudo calcular la EOBT en UTC.";
  return null;
}

export function formatEobtUtcPreview(data: Step1Data): string | null {
  const iso = step1DataToDepartureEobtUtc(data);
  if (!iso) return null;
  const date = new Date(iso);
  return date.toISOString().replace(".000Z", "Z");
}

/**
 * Returns the flight date (YYYY-MM-DD) and UTC departure time (HHMM)
 * in the format expected by the backend POST /flight-plans.
 */
export function step1DataToFlightDateAndTime(
  data: Step1Data,
): { flight_date: string; departure_time_utc: string } | null {
  const iso = step1DataToDepartureEobtUtc(data);
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const flight_date = date.toISOString().slice(0, 10);
  const departure_time_utc =
    String(date.getUTCHours()).padStart(2, "0") +
    String(date.getUTCMinutes()).padStart(2, "0");
  return { flight_date, departure_time_utc };
}
