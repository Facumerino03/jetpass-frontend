import {
  formatCompactCoord,
  formatContactSnippet,
  formatElevation,
  formatPcnSurface,
  formatRunwayLabel,
  getAd212,
  getAd213,
  getAd218,
  getAd219,
  getAd22,
  getAd23,
  getAd24,
  groupRunwayDesignators,
  hoursStatus,
  parseTemperatureRange,
  shortenOrgName,
  type HoursStatus,
} from "./aerodrome-aip-helpers";
import type { Ad212Runway, Ad219Aid, AerodromeAIPData } from "./types";

export type AerodromePreviewLocation = {
  coordinatesFormatted: string;
  arpReference: string | null;
  cityDistance: string | null;
  lat: number;
  lng: number;
};

export type AerodromePreviewRunway = {
  label: string;
  dimensions: string;
  surface: string;
  slope: string | null;
  navAidNote: string | null;
  remarks: string | null;
};

export type AerodromePreviewOperational = {
  service: string;
  hours: string;
  status: HoursStatus;
};

export type AerodromePreviewCommunication = {
  designation: string;
  callSign: string | null;
  frequency: string;
  channelType: string | null;
  hours: string | null;
  copyText: string;
};

export type AerodromePreviewNavAid = {
  type: string;
  identification: string | null;
  frequency: string | null;
  hours: string | null;
  remarks: string | null;
  copyText: string;
};

export type AerodromePreviewDeclaredDistance = {
  designator: string;
  tora: string;
  toda: string;
  asda: string;
  lda: string;
  ldaNotUsable: boolean;
};

export type AerodromePreview = {
  traffic: string | null;
  location: AerodromePreviewLocation;
  physical: {
    elevation: string | null;
    referenceTemperature: string | null;
    meanLowTemperature: string | null;
    gund: string | null;
    magneticVariation: string | null;
    annualChange: string | null;
  };
  runways: {
    items: AerodromePreviewRunway[];
    footnote: string | null;
  };
  declaredDistances: AerodromePreviewDeclaredDistance[];
  operationalHours: AerodromePreviewOperational[];
  operationalRemarks: string | null;
  operators: {
    authority: string | null;
    operator: string | null;
    operatorContact: string | null;
    ansp: string | null;
    anspContact: string | null;
  };
  communications: AerodromePreviewCommunication[];
  navigationAids: AerodromePreviewNavAid[];
  facilityRemarks: string | null;
};

const DEFAULT_MAP = { lat: -34.8222, lng: -58.5358 };

function findRunwayByDesignator(runways: Ad212Runway[], designator: string): Ad212Runway | undefined {
  return runways.find((r) => r.designator === designator);
}

function navAidNoteForRunway(aids: Ad219Aid[], designator: string): string | null {
  for (const aid of aids) {
    const blob = [aid.remarks, aid.type_of_aid].filter(Boolean).join(" ").toUpperCase();
    if (blob.includes(`RWY ${designator}`) || blob.includes(`PISTA ${designator}`)) {
      const cat = aid.remarks?.match(/CAT\s+[\w-]+/i)?.[0];
      if (cat) return `${aid.type_of_aid} ${cat}`;
      return aid.type_of_aid;
    }
  }
  return null;
}

function buildRunwayPreviews(
  runways: Ad212Runway[],
  aids: Ad219Aid[],
): AerodromePreview["runways"] {
  if (!runways.length) return { items: [], footnote: null };

  const designators = runways.map((r) => r.designator);
  const groups = groupRunwayDesignators(designators);
  const items: AerodromePreviewRunway[] = [];

  for (const group of groups) {
    const primary = findRunwayByDesignator(runways, group[0]);
    if (!primary) continue;
    const dimensions = primary.dimensions_m.replace(/x/gi, " × ");
    const surface = formatPcnSurface(primary.pcn_entries);
    const navNote = group.map((d) => navAidNoteForRunway(aids, d)).find(Boolean) ?? null;
    const remarks = primary.remarks?.trim() || null;

    items.push({
      label: formatRunwayLabel(group),
      dimensions,
      surface,
      slope: primary.slope,
      navAidNote: navNote,
      remarks: group.length === 1 ? remarks : remarks,
    });
  }

  const footnote =
    runways
      .map((r) => r.remarks?.trim())
      .find((r) => r && (r.toUpperCase().includes("DTHR") || r.toUpperCase().includes("OBST"))) ?? null;

  return { items, footnote };
}

function getFuelTypes(ad24: ReturnType<typeof getAd24>): string | null {
  const facility = ad24?.facilities.find((f) =>
    (f.description?.toLowerCase() ?? "").includes("combustible") || (f.description?.toLowerCase() ?? "").includes("fuel"),
  );
  return facility?.details?.trim() || null;
}

function buildOperationalHours(
  ad23: ReturnType<typeof getAd23>,
  fuelTypes: string | null,
): AerodromePreviewOperational[] {
  if (!ad23?.services.length) return [];

  const findService = (matcher: (name: string) => boolean, displayName: string): AerodromePreviewOperational | null => {
    const svc = ad23.services.find((s) => matcher(s.service_name?.toLowerCase() ?? ""));
    if (!svc) return null;
    let hours = svc.hours?.trim() ?? "—";
    if (displayName.toLowerCase().includes("combustible") && fuelTypes) {
      hours = `${hours} (${fuelTypes})`;
    }
    return { service: displayName, hours, status: hoursStatus(svc.hours) };
  };

  const customs = ad23.services.filter((s) => {
    const n = s.service_name?.toLowerCase() ?? "";
    return n.includes("aduana") || n.includes("customs") || n.includes("inmigrac");
  });
  const customsEntry: AerodromePreviewOperational | null =
    customs.length > 0
      ? {
          service: "Aduana / Migraciones",
          hours: customs.map((c) => c.hours).join(" · "),
          status: customs.every((c) => hoursStatus(c.hours) === "h24")
            ? "h24"
            : customs.some((c) => hoursStatus(c.hours) === "closed")
              ? "closed"
              : "scheduled",
        }
      : null;

  const fuelLabel = fuelTypes ? `Combustible (${fuelTypes})` : "Combustible";

  return [
    findService((n) => n === "ats", "ATS"),
    findService((n) => n.includes("información met") || n.includes("met briefing"), "MET"),
    findService((n) => n.includes("combustible") || n.includes("fuelling"), fuelLabel),
    customsEntry,
    findService((n) => n.includes("deshielo") || n.includes("de-icing"), "Deshielo"),
    findService((n) => n.includes("explotador") || n.includes("operator"), "Explotador del AD"),
  ].filter((x): x is AerodromePreviewOperational => x !== null);
}

function buildCommunications(ad218: ReturnType<typeof getAd218>): AerodromePreviewCommunication[] {
  if (!ad218?.facilities.length) return [];

  const rows: AerodromePreviewCommunication[] = [];
  for (const facility of ad218.facilities) {
    for (const freq of facility.frequencies) {
      const designation = facility.service_designation?.trim() ?? "";
      const channel = freq.channel_type?.trim() || null;
      const frequency = freq.frequency?.trim() ?? "—";
      rows.push({
        designation,
        callSign: facility.call_sign?.trim() || null,
        frequency,
        channelType: channel,
        hours: facility.hours_of_operation?.trim() || null,
        copyText: [designation, facility.call_sign, frequency, channel].filter(Boolean).join("   "),
      });
    }
    if (facility.frequencies.length === 0 && facility.service_designation) {
      rows.push({
        designation: facility.service_designation?.trim() ?? "",
        callSign: facility.call_sign?.trim() || null,
        frequency: "—",
        channelType: null,
        hours: facility.hours_of_operation?.trim() || null,
        copyText: [facility.service_designation, facility.call_sign].filter(Boolean).join("   "),
      });
    }
  }
  return rows;
}

function buildNavigationAids(ad219: ReturnType<typeof getAd219>): AerodromePreviewNavAid[] {
  if (!ad219?.aids.length) return [];
  return ad219.aids.map((aid) => ({
    type: aid.type_of_aid,
    identification: aid.identification?.trim() || null,
    frequency: aid.frequency_channel?.trim() || null,
    hours: aid.hours_of_operation?.trim() || null,
    remarks: aid.remarks?.trim() || null,
    copyText: [aid.identification, aid.type_of_aid, aid.frequency_channel].filter(Boolean).join("   "),
  }));
}

function buildDeclaredDistances(ad213: ReturnType<typeof getAd213>): AerodromePreviewDeclaredDistance[] {
  if (!ad213?.entries.length) return [];
  return ad213.entries
    .filter((e) => !(e.rwy_designator?.toLowerCase() ?? "").includes("intersec"))
    .map((e) => ({
      designator: e.rwy_designator,
      tora: e.tora_m != null ? `${Math.round(e.tora_m)} m` : "—",
      toda: e.toda_m != null ? `${Math.round(e.toda_m)} m` : "—",
      asda: e.asda_m != null ? `${Math.round(e.asda_m)} m` : "—",
      lda: e.lda_not_usable ? "NU" : e.lda_m != null ? `${Math.round(e.lda_m)} m` : "—",
      ldaNotUsable: e.lda_not_usable,
    }));
}

export function buildAerodromePreview(data: AerodromeAIPData): AerodromePreview {
  const sections = data.current?.ad_sections ?? [];

  const ad22 = getAd22(sections);
  const ad23 = getAd23(sections);
  const ad24 = getAd24(sections);
  const ad212 = getAd212(sections);
  const ad213 = getAd213(sections);
  const ad218 = getAd218(sections);
  const ad219 = getAd219(sections);

  const parsedCoords = formatCompactCoord(ad22?.arp_coordinates);
  const temps = parseTemperatureRange(ad22?.temperature_reference_and_min);
  const fuelTypes = getFuelTypes(ad24);

  return {
    traffic: ad22?.traffic_types_permitted?.trim() || null,
    location: {
      coordinatesFormatted: parsedCoords?.formatted ?? "—",
      arpReference: ad22?.arp_location_description?.trim() || null,
      cityDistance: ad22?.direction_and_distance_from_city?.trim() || null,
      lat: parsedCoords?.lat ?? DEFAULT_MAP.lat,
      lng: parsedCoords?.lng ?? DEFAULT_MAP.lng,
    },
    physical: {
      elevation: formatElevation(ad22?.elevation_m, ad22?.elevation_ft),
      referenceTemperature: temps.reference,
      meanLowTemperature: temps.meanLow,
      gund: ad22?.gund_m != null ? `${ad22.gund_m} m` : null,
      magneticVariation: ad22?.magnetic_variation?.trim() || null,
      annualChange: ad22?.magnetic_variation_annual_change?.trim() || null,
    },
    runways: buildRunwayPreviews(ad212?.runways ?? [], ad219?.aids ?? []),
    declaredDistances: buildDeclaredDistances(ad213),
    operationalHours: buildOperationalHours(ad23, fuelTypes),
    operationalRemarks: ad23?.remarks?.trim() || null,
    operators: {
      authority: shortenOrgName(ad22?.ad_administration),
      operator: shortenOrgName(ad22?.ad_operator),
      operatorContact: formatContactSnippet(ad22?.ad_operator),
      ansp: shortenOrgName(ad22?.ans_provider),
      anspContact: formatContactSnippet(ad22?.ans_provider),
    },
    communications: buildCommunications(ad218),
    navigationAids: buildNavigationAids(ad219),
    facilityRemarks: ad24?.remarks?.trim() || null,
  };
}
