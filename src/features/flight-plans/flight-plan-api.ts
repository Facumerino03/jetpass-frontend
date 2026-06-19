import { apiRequest } from "@/lib/api";
import type {
  ControlledAerodrome,
  FlightPlanCreate,
  FlightPlanPublic,
  FlightPlanSubmitResponse,
  FlightPlanUpdate,
  IntelligenceRunResponse,
} from "./types";

export async function listControlledAerodromes(
  accessToken: string,
  params: { query?: string; limit?: number } = {},
): Promise<ControlledAerodrome[]> {
  const searchParams = new URLSearchParams();
  if (params.query?.trim()) searchParams.set("query", params.query.trim());
  if (params.limit) searchParams.set("limit", params.limit.toString());
  const queryString = searchParams.toString();

  return apiRequest<ControlledAerodrome[]>(
    `/flight-plans/aerodromes${queryString ? `?${queryString}` : ""}`,
    { accessToken },
  );
}

export async function runAerodromeIntelligence(
  accessToken: string,
  icao: string,
): Promise<IntelligenceRunResponse> {
  return apiRequest<IntelligenceRunResponse>("/flight-plans/intelligence/aerodrome", {
    method: "POST",
    body: { icao, force_refresh: false },
    accessToken,
  });
}

export async function runWeatherIntelligence(
  accessToken: string,
  icao: string,
  forceRefresh = false,
): Promise<IntelligenceRunResponse> {
  return apiRequest<IntelligenceRunResponse>("/flight-plans/intelligence/weather", {
    method: "POST",
    body: { icao, force_refresh: forceRefresh },
    accessToken,
  });
}

export async function runNotamIntelligence(
  accessToken: string,
  icao: string,
  forceRefresh = false,
): Promise<IntelligenceRunResponse> {
  return apiRequest<IntelligenceRunResponse>("/flight-plans/intelligence/notam", {
    method: "POST",
    body: { icao, force_refresh: forceRefresh },
    accessToken,
  });
}

export async function createFlightPlan(
  accessToken: string,
  data: FlightPlanCreate,
): Promise<FlightPlanPublic> {
  return apiRequest<FlightPlanPublic>("/flight-plans", {
    method: "POST",
    body: data,
    accessToken,
  });
}

export async function updateFlightPlan(
  accessToken: string,
  flightPlanId: string,
  data: FlightPlanUpdate,
): Promise<FlightPlanPublic> {
  return apiRequest<FlightPlanPublic>(`/flight-plans/${flightPlanId}`, {
    method: "PATCH",
    body: data,
    accessToken,
  });
}

export async function getFlightPlan(
  accessToken: string,
  flightPlanId: string,
): Promise<FlightPlanPublic> {
  return apiRequest<FlightPlanPublic>(`/flight-plans/${flightPlanId}`, { accessToken });
}

export async function listFlightPlans(accessToken: string): Promise<FlightPlanPublic[]> {
  return apiRequest<FlightPlanPublic[]>("/flight-plans", { accessToken });
}

export async function submitFlightPlan(
  accessToken: string,
  flightPlanId: string,
): Promise<FlightPlanSubmitResponse> {
  return apiRequest<FlightPlanSubmitResponse>(`/flight-plans/${flightPlanId}/submit`, {
    method: "POST",
    accessToken,
  });
}

export type FlightPlanOfficialPdfResponse = {
  official_pdf_url: string;
  expires_in: number;
};

export async function getFlightPlanOfficialPdf(
  accessToken: string,
  flightPlanId: string,
): Promise<FlightPlanOfficialPdfResponse> {
  return apiRequest<FlightPlanOfficialPdfResponse>(`/flight-plans/${flightPlanId}/official-pdf`, {
    accessToken,
  });
}

export type FlightPlanSignaturePresignResponse = {
  upload_url: string;
  signature_key: string;
  expires_in: number;
};

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const cleanBase64 = base64.replace(/=+$/, "");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (const char of cleanBase64) {
    buffer = (buffer << 6) | chars.indexOf(char);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }

  return new Uint8Array(bytes).buffer;
}

export async function requestFlightPlanSignaturePresign(
  accessToken: string,
  flightPlanId: string,
  contentType: string,
): Promise<FlightPlanSignaturePresignResponse> {
  return apiRequest<FlightPlanSignaturePresignResponse>(`/flight-plans/${flightPlanId}/signature/presign`, {
    method: "POST",
    body: { content_type: contentType },
    accessToken,
  });
}

export async function uploadFlightPlanSignature(
  uploadUrl: string,
  signatureBase64: string,
  contentType: string,
): Promise<void> {
  const base64Data = signatureBase64.replace(/^data:image\/\w+;base64,/, "");
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: base64ToArrayBuffer(base64Data),
  });

  if (!response.ok) {
    throw new Error(`Error al subir firma: ${response.status}`);
  }
}
