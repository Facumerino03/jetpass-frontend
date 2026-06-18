import { apiRequest } from "@/lib/api";
import * as FileSystem from "expo-file-system/legacy";
import type {
  AircraftPublic,
  AircraftCreate,
  AircraftUpdate,
  AircraftDeleteResponse,
} from "./types";

export type AircraftImagePresignResponse = {
  upload_url: string;
  image_key: string;
  expires_in: number;
};

export async function listAircraft(accessToken: string): Promise<AircraftPublic[]> {
  return apiRequest<AircraftPublic[]>("/pilot/aircraft", {
    accessToken,
  });
}

export async function requestAircraftImagePresign(
  accessToken: string,
  contentType: string,
): Promise<AircraftImagePresignResponse> {
  return apiRequest<AircraftImagePresignResponse>("/pilot/aircraft/image/presign", {
    method: "POST",
    body: { content_type: contentType },
    accessToken,
  });
}

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

export async function uploadAircraftImage(
  uploadUrl: string,
  fileUri: string,
  contentType: string,
): Promise<void> {
  const fileName = fileUri.split("/").pop() ?? "image.jpg";
  const cacheDirectory = FileSystem.cacheDirectory ?? `${FileSystem.documentDirectory ?? ""}cache/`;
  const localUri = `${cacheDirectory.endsWith("/") ? cacheDirectory : `${cacheDirectory}/`}aircraft_upload_${Date.now()}_${fileName}`;

  await FileSystem.copyAsync({
    from: fileUri,
    to: localUri,
  });

  try {
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
      },
      body: base64ToArrayBuffer(base64),
    });

    if (!response.ok) {
      throw new Error(`Error al subir imagen: ${response.status}`);
    }
  } finally {
    try {
      await FileSystem.deleteAsync(localUri);
    } catch {
      // ignore cleanup errors
    }
  }
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
