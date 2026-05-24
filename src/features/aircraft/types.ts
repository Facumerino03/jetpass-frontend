export type WakeTurbulenceCat = "L" | "M" | "H" | "J";

export interface AircraftPublic {
  id: string;
  owner_user_id: string;
  alias: string | null;
  is_active: boolean;
  identification: string;
  icao_type_designator: string;
  wake_turbulence_category: string;
  equipment_com_nav: string;
  equipment_surveillance: string;
  pbn_capabilities: string | null;
  emergency_radio: string | null;
  survival_equipment: string | null;
  life_jackets: string | null;
  dinghies_number: number | null;
  dinghies_capacity: number | null;
  dinghies_cover: boolean | null;
  dinghies_color: string | null;
  color_and_markings: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AircraftCreate {
  identification: string;
  icao_type_designator: string;
  wake_turbulence_category: WakeTurbulenceCat;
  equipment_com_nav: string;
  equipment_surveillance: string;
  color_and_markings: string;
  alias?: string | null;
  pbn_capabilities?: string | null;
  emergency_radio?: string | null;
  survival_equipment?: string | null;
  life_jackets?: string | null;
  dinghies_number?: number | null;
  dinghies_capacity?: number | null;
  dinghies_cover?: boolean | null;
  dinghies_color?: string | null;
  image_url?: string | null;
}

export type AircraftUpdate = Partial<Omit<AircraftCreate, "identification" | "icao_type_designator" | "wake_turbulence_category" | "equipment_com_nav" | "equipment_surveillance" | "color_and_markings">> &
  Partial<Pick<AircraftCreate, "identification" | "icao_type_designator" | "wake_turbulence_category" | "equipment_com_nav" | "equipment_surveillance" | "color_and_markings" | "image_url">>;

export interface AircraftDeleteResponse {
  deleted: boolean;
}

export const WAKE_TURBULENCE_OPTIONS: { label: string; value: WakeTurbulenceCat }[] = [
  { label: "Light (L)", value: "L" },
  { label: "Medium (M)", value: "M" },
  { label: "Heavy (H)", value: "H" },
  { label: "Super (J)", value: "J" },
];
