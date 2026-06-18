import type {
  AIPSection,
  AIPSectionId,
  Ad212Data,
  Ad213Data,
  Ad218Data,
  Ad219Data,
  Ad21Data,
  Ad22Data,
  Ad23Data,
  Ad24Data,
} from "./types";

export type HoursStatus = "h24" | "on_request" | "closed" | "scheduled";

export type ParsedCoordinates = {
  formatted: string;
  lat: number;
  lng: number;
};

export type ParsedTemperatureRange = {
  reference: string | null;
  meanLow: string | null;
};

export type ExtractedContacts = {
  phones: string[];
  emails: string[];
  urls: string[];
};

const SECTION_DATA_KEYS: Record<AIPSectionId, string> = {
  "AD 2.1": "location_indicator",
  "AD 2.2": "arp_coordinates",
  "AD 2.3": "services",
  "AD 2.4": "facilities",
  "AD 2.12": "runways",
  "AD 2.13": "entries",
  "AD 2.18": "facilities",
  "AD 2.19": "aids",
};

export function getSection<T extends AIPSectionId>(
  sections: AIPSection[],
  sectionId: T,
): Extract<AIPSection, { section_id: T }> | undefined {
  const section = sections.find((s) => s.section_id === sectionId);
  if (!section) return undefined;
  const key = SECTION_DATA_KEYS[sectionId];
  if (!(key in section.data)) return undefined;
  return section as Extract<AIPSection, { section_id: T }>;
}

export function getAd21(sections: AIPSection[]): Ad21Data | undefined {
  return getSection(sections, "AD 2.1")?.data;
}

export function getAd22(sections: AIPSection[]): Ad22Data | undefined {
  return getSection(sections, "AD 2.2")?.data;
}

export function getAd23(sections: AIPSection[]): Ad23Data | undefined {
  return getSection(sections, "AD 2.3")?.data;
}

export function getAd24(sections: AIPSection[]): Ad24Data | undefined {
  return getSection(sections, "AD 2.4")?.data;
}

export function getAd212(sections: AIPSection[]): Ad212Data | undefined {
  return getSection(sections, "AD 2.12")?.data;
}

export function getAd213(sections: AIPSection[]): Ad213Data | undefined {
  return getSection(sections, "AD 2.13")?.data;
}

export function getAd218(sections: AIPSection[]): Ad218Data | undefined {
  return getSection(sections, "AD 2.18")?.data;
}

export function getAd219(sections: AIPSection[]): Ad219Data | undefined {
  return getSection(sections, "AD 2.19")?.data;
}

function parseCompactCoord(token: string): { deg: number; min: number; sec: number; hemi: string } | null {
  const m = token.trim().match(/^(\d{2,3})(\d{2})(\d{2})([NSEW])$/i);
  if (!m) return null;
  return {
    deg: Number.parseInt(m[1], 10),
    min: Number.parseInt(m[2], 10),
    sec: Number.parseInt(m[3], 10),
    hemi: m[4].toUpperCase(),
  };
}

function formatCoordPart(part: ReturnType<typeof parseCompactCoord>): string {
  if (!part) return "";
  return `${part.deg}°${String(part.min).padStart(2, "0")}'${String(part.sec).padStart(2, "0")}"${part.hemi}`;
}

export function formatCompactCoord(raw: string | null | undefined): ParsedCoordinates | null {
  if (!raw?.trim()) return null;
  const normalized = raw.replace(/\s+/g, " ").trim();
  const latMatch = normalized.match(/(\d{6,7}[NS])/i);
  const lonMatch = normalized.match(/(\d{7,8}[EW])/i);
  if (!latMatch || !lonMatch) return null;

  const latPart = parseCompactCoord(latMatch[1]);
  const lonPart = parseCompactCoord(lonMatch[1]);
  if (!latPart || !lonPart) return null;

  const latSign = latPart.hemi === "S" ? -1 : 1;
  const lngSign = lonPart.hemi === "W" ? -1 : 1;
  const lat = latSign * (latPart.deg + latPart.min / 60 + latPart.sec / 3600);
  const lng = lngSign * (lonPart.deg + lonPart.min / 60 + lonPart.sec / 3600);

  return {
    formatted: `${formatCoordPart(latPart)}  ${formatCoordPart(lonPart)}`,
    lat,
    lng,
  };
}

export function formatElevation(m: number | null | undefined, ft: number | null | undefined): string | null {
  if (m == null && ft == null) return null;
  if (m != null && ft != null) return `${m} m (${Math.round(ft)} ft)`;
  if (m != null) return `${m} m`;
  return `${Math.round(ft!)} ft`;
}

export function parseTemperatureRange(raw: string | null | undefined): ParsedTemperatureRange {
  if (!raw?.trim()) return { reference: null, meanLow: null };
  const match = raw.match(/([\d.]+)°C\s*-\s*(-?[\d.]+)°C/);
  if (!match) return { reference: raw.trim(), meanLow: null };
  return { reference: `${match[1]}°C`, meanLow: `${match[2]}°C` };
}

export function hoursStatus(hours: string | null | undefined): HoursStatus {
  const h = (hours ?? "").trim().toUpperCase();
  if (!h || h === "NO" || h === "NIL") return "closed";
  if (/\bH24\b/.test(h)) return "h24";
  if (/\bO\/R\b/.test(h) || /\bON\s*REQUEST\b/.test(h)) return "on_request";
  return "scheduled";
}

export function extractContacts(text: string | null | undefined): ExtractedContacts {
  if (!text?.trim()) return { phones: [], emails: [], urls: [] };
  const phones = [...new Set(text.match(/\+\d[\d\s()]{6,}/g) ?? [])];
  const emails = [...new Set(text.match(/[\w.+-]+@[\w.-]+\.\w+/gi) ?? [])];
  const urls = [...new Set(text.match(/www\.\S+|https?:\/\/\S+/gi) ?? [])];
  return { phones, emails, urls };
}

export function shortenOrgName(text: string | null | undefined): string | null {
  if (!text?.trim()) return null;
  const first = text.split(",")[0]?.trim() ?? text.trim();
  return first.length > 72 ? `${first.slice(0, 69)}…` : first;
}

export function formatContactSnippet(text: string | null | undefined): string | null {
  const { phones, emails } = extractContacts(text);
  const parts = [...phones.slice(0, 2), ...emails.slice(0, 1)];
  return parts.length ? parts.join(" · ") : null;
}

export function formatDistanceMeters(value: number | null | undefined): string {
  if (value == null) return "—";
  return value >= 1000 ? `${(value / 1000).toFixed(3)} km` : `${Math.round(value)} m`;
}

export function compareSectionIds(a: string, b: string): number {
  const parse = (id: string) => {
    const match = id.match(/AD\s*2\.(\d+)/i);
    return match ? Number.parseInt(match[1], 10) : 999;
  };
  const diff = parse(a) - parse(b);
  return diff !== 0 ? diff : a.localeCompare(b);
}

export function shortSectionTitle(section: AIPSection): string {
  const fromTitle = section.section_title?.trim();
  if (fromTitle && fromTitle.length <= 56) return fromTitle;
  return section.title || section.section_id;
}

export function isNegativeDetail(value: string | null | undefined): boolean {
  const v = (value ?? "").trim().toLowerCase();
  return v === "no" || v === "nil" || v === "nu";
}

export function oppositeRunwayDesignator(designator: string): string | null {
  const n = Number.parseInt(designator, 10);
  if (Number.isNaN(n)) return null;
  const opp = (n + 18) % 36;
  const opposite = opp === 0 ? 36 : opp;
  return String(opposite).padStart(designator.length, "0");
}

export function groupRunwayDesignators(designators: string[]): string[][] {
  const remaining = new Set(designators);
  const groups: string[][] = [];

  for (const d of designators) {
    if (!remaining.has(d)) continue;
    const opp = oppositeRunwayDesignator(d);
    if (opp && remaining.has(opp)) {
      groups.push([d, opp].sort());
      remaining.delete(d);
      remaining.delete(opp);
    } else {
      groups.push([d]);
      remaining.delete(d);
    }
  }
  return groups;
}

export function formatRunwayLabel(designators: string[]): string {
  if (designators.length === 1) return `RWY ${designators[0]}`;
  return `RWY ${designators.join("/")}`;
}

export function formatPcnSurface(pcnEntries: { pcn_value: string; surface_type: string }[]): string {
  if (!pcnEntries.length) return "—";
  return pcnEntries.map((e) => `${e.pcn_value} ${e.surface_type}`).join(" · ");
}
