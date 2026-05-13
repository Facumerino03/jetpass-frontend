import { apiRequest } from "@/lib/api";
import type {
  AircraftPublic,
  AircraftCreate,
  AircraftUpdate,
  AircraftDeleteResponse,
} from "./types";

export async function listAircraft(accessToken: string): Promise<AircraftPublic[]> {
  return apiRequest<AircraftPublic[]>("/pilot/aircraft", {
    accessToken,
  });
}

export async function getAircraft(
  aircraftId: string,
  accessToken: string,
): Promise<AircraftPublic> {
  return apiRequest<AircraftPublic>(`/pilot/aircraft/${aircraftId}`, {
    accessToken,
  });
}

export async function createAircraft(
  data: AircraftCreate,
  accessToken: string,
): Promise<AircraftPublic> {
  return apiRequest<AircraftPublic>("/pilot/aircraft", {
    method: "POST",
    body: data,
    accessToken,
  });
}

export async function updateAircraft(
  aircraftId: string,
  data: AircraftUpdate,
  accessToken: string,
): Promise<AircraftPublic> {
  return apiRequest<AircraftPublic>(`/pilot/aircraft/${aircraftId}`, {
    method: "PATCH",
    body: data,
    accessToken,
  });
}

export async function deleteAircraft(
  aircraftId: string,
  accessToken: string,
): Promise<AircraftDeleteResponse> {
  return apiRequest<AircraftDeleteResponse>(`/pilot/aircraft/${aircraftId}`, {
    method: "DELETE",
    accessToken,
  });
}
