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
