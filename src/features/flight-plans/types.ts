export type FlightRules = "V" | "I" | "Y" | "Z";
export type FlightType = "G" | "S" | "N" | "M" | "X";
export type WakeTurbulenceCat = "L" | "M" | "H" | "J";

export type FlightPlanStatus =
  | "draft"
  | "filed"
  | "pending_approval"
  | "accepted"
  | "rejected"
  | "active"
  | "closed"
  | "cancelled";

export interface ControlledAerodrome {
  id: string;
  icao_code: string;
  name: string;
  is_active: boolean;
  latitude: number | null;
  longitude: number | null;
}

export interface IntelligenceAerodromeRequest {
  icao: string;
  force_refresh?: boolean;
}

export interface AIPExtractionMeta {
  engine?: string;
  source_document?: string;
  status?: string;
}

export interface Ad21Data {
  location_indicator: string;
  aerodrome_name: string;
  airport_type: string;
  remarks: string | null;
  _extraction?: AIPExtractionMeta;
}

export interface Ad22Data {
  arp_coordinates: string;
  arp_location_description: string | null;
  direction_and_distance_from_city: string | null;
  elevation_m: number | null;
  elevation_ft: number | null;
  temperature_reference_and_min: string | null;
  gund_m: number | null;
  magnetic_variation: string | null;
  magnetic_variation_annual_change: string | null;
  ad_administration: string | null;
  ad_operator: string | null;
  ans_provider: string | null;
  traffic_types_permitted: string | null;
  remarks: string | null;
  _extraction?: AIPExtractionMeta;
}

export interface Ad23Service {
  service_name: string;
  hours: string;
}

export interface Ad23Data {
  services: Ad23Service[];
  remarks: string | null;
  _extraction?: AIPExtractionMeta;
}

export interface Ad24Facility {
  item_number: number;
  description: string;
  details: string;
}

export interface Ad24Data {
  facilities: Ad24Facility[];
  remarks: string | null;
  _extraction?: AIPExtractionMeta;
}

export interface Ad212PcnEntry {
  pcn_value: string;
  surface_type: string;
}

export interface Ad212Runway {
  designator: string;
  dimensions_m: string;
  pcn_entries: Ad212PcnEntry[];
  true_bearing: string | null;
  magnetic_bearing: string | null;
  thr_coordinates: string | null;
  thr_elevation_m: number | null;
  thr_elevation_ft: number | null;
  gund_m: number | null;
  slope: string | null;
  swy_dimensions_m: string | null;
  cwy_dimensions_m: string | null;
  strip_dimensions_m: string | null;
  resa_dimensions_m: string | null;
  arresting_system: string | null;
  ofz: boolean | null;
  remarks: string | null;
}

export interface Ad212Data {
  runways: Ad212Runway[];
  section_remarks: string | null;
  _extraction?: AIPExtractionMeta;
}

export interface Ad213Entry {
  rwy_designator: string;
  tora_m: number | null;
  toda_m: number | null;
  asda_m: number | null;
  lda_m: number | null;
  lda_not_usable: boolean;
  remarks: string | null;
}

export interface Ad213Data {
  entries: Ad213Entry[];
  _extraction?: AIPExtractionMeta;
}

export interface Ad218Frequency {
  channel_type: string;
  frequency: string;
}

export interface Ad218Facility {
  service_designation: string;
  call_sign: string | null;
  frequencies: Ad218Frequency[];
  hours_of_operation: string | null;
  data_link_hours: string | null;
  remarks: string | null;
}

export interface Ad218Data {
  facilities: Ad218Facility[];
  _extraction?: AIPExtractionMeta;
}

export interface Ad219Aid {
  type_of_aid: string;
  identification: string | null;
  frequency_channel: string | null;
  hours_of_operation: string | null;
  coordinates: string | null;
  elevation_m: number | null;
  remarks: string | null;
}

export interface Ad219Data {
  aids: Ad219Aid[];
  _extraction?: AIPExtractionMeta;
}

export type AIPSectionId =
  | "AD 2.1"
  | "AD 2.2"
  | "AD 2.3"
  | "AD 2.4"
  | "AD 2.12"
  | "AD 2.13"
  | "AD 2.18"
  | "AD 2.19";

export interface AIPSectionBase {
  title: string;
  section_title: string;
  raw_text: string | null;
  anchors: unknown;
  section_meta: unknown;
}

export type AIPSection =
  | (AIPSectionBase & { section_id: "AD 2.1"; data: Ad21Data })
  | (AIPSectionBase & { section_id: "AD 2.2"; data: Ad22Data })
  | (AIPSectionBase & { section_id: "AD 2.3"; data: Ad23Data })
  | (AIPSectionBase & { section_id: "AD 2.4"; data: Ad24Data })
  | (AIPSectionBase & { section_id: "AD 2.12"; data: Ad212Data })
  | (AIPSectionBase & { section_id: "AD 2.13"; data: Ad213Data })
  | (AIPSectionBase & { section_id: "AD 2.18"; data: Ad218Data })
  | (AIPSectionBase & { section_id: "AD 2.19"; data: Ad219Data })
  | (AIPSectionBase & { section_id: string; data: Record<string, unknown> });

export interface AerodromeAIPMeta {
  airac_cycle?: string;
  airac_effective_date?: string;
  version?: number;
  source?: {
    type?: string;
    document?: string;
  };
}

export interface AerodromeAIPData {
  icao: string;
  name: string;
  full_name: string;
  current: {
    ad_sections: AIPSection[];
    _meta?: AerodromeAIPMeta;
  };
}

export interface AerodromeIntelligencePayload {
  icao: string;
  data: AerodromeAIPData | null;
  source?: string;
  airac_cycle?: string;
  messages?: string[];
}

export type FlightCategory = "VFR" | "MVFR" | "IFR" | "LIFR" | (string & {});

export interface WeatherStation {
  icao: string;
  name: string | null;
  lat: number;
  lon: number;
  elev: number;
}

export interface WeatherCloudLayer {
  cover: string;
  base: number | null;
  type: string | null;
}

export interface WeatherMetar {
  raw: string;
  observed_at: string | null;
  flight_category: FlightCategory | null;
  wind_dir_degrees: number | null;
  wind_speed_kt: number | null;
  wind_gust_kt: number | null;
  visibility: number | string | null;
  altimeter_hpa: number | null;
  temperature_c: number | null;
  dewpoint_c: number | null;
  present_weather: string | null;
  raw_payload?: Record<string, unknown>;
}

export interface WeatherTafPeriod {
  timeFrom: number;
  timeTo: number;
  timeBec: number | null;
  fcstChange: string | null;
  probability: number | null;
  wdir: number | null;
  wspd: number | null;
  wgst: number | null;
  visib: number | string | null;
  wxString: string | null;
  clouds: WeatherCloudLayer[];
}

export interface WeatherTaf {
  raw: string;
  issued_at: string | null;
  valid_from: string | null;
  valid_to: string | null;
  forecast_periods: WeatherTafPeriod[];
  raw_payload?: Record<string, unknown>;
}

export interface WeatherIntelligencePayload {
  icao: string;
  station: WeatherStation | null;
  metar: WeatherMetar | null;
  taf: WeatherTaf | null;
  sigmets: unknown[];
  fetched_at: string | null;
  source: string | null;
  alerts: unknown[];
  messages: string[];
  metadata?: Record<string, unknown>;
}

export interface NotamEntry {
  notam_id: string;
  location: string;
  valid_from: string | null;
  valid_to: string | null;
  raw_text: string;
  english_text: string | null;
  spanish_text: string | null;
}

export interface NotamAlert {
  level?: string;
  code?: string;
  message?: string;
}

export interface NotamIntelligencePayload {
  icao: string;
  aerodrome_name: string | null;
  site_last_updated_at: string | null;
  fetched_at: string | null;
  aerodrome_notams: NotamEntry[];
  fir_notams: NotamEntry[];
  fir_notams_by_location?: Record<string, NotamEntry[]>;
  source: string | null;
  alerts: NotamAlert[];
  messages: string[];
  metadata?: Record<string, unknown>;
}

export interface IntelligenceRunResponse {
  intent: string;
  aerodrome: AerodromeIntelligencePayload | null;
  notam: NotamIntelligencePayload | null;
  weather: WeatherIntelligencePayload | null;
  alerts: Record<string, unknown>[];
  metadata: Record<string, unknown>;
  source?: string;
  messages?: string[];
}

export interface FlightPlanCreate {
  departure_aerodrome_icao: string;
  /** UTC departure time in HHMM format, e.g. "1430" */
  departure_time_utc: string;
  /** Flight date in YYYY-MM-DD format, e.g. "2026-05-18" */
  flight_date: string;
  destination_aerodrome_icao: string;
  alternate1_aerodrome_icao: string;
  alternate2_aerodrome_icao: string;
}

export interface FlightPlanUpdate {
  flight_rules?: FlightRules | null;
  flight_type?: FlightType | null;
  aircraft_id?: string | null;
  aircraft_identification_snapshot?: string | null;
  aircraft_type_designator_snapshot?: string | null;
  wake_turbulence_category_snapshot?: WakeTurbulenceCat | null;
  equipment_com_nav_snapshot?: string | null;
  equipment_surveillance_snapshot?: string | null;
  emergency_radio_uhf_snapshot?: boolean | null;
  emergency_radio_vhf_snapshot?: boolean | null;
  emergency_radio_elt_snapshot?: boolean | null;
  survival_equipment_present_snapshot?: boolean | null;
  survival_polar_snapshot?: boolean | null;
  survival_desert_snapshot?: boolean | null;
  survival_maritime_snapshot?: boolean | null;
  survival_jungle_snapshot?: boolean | null;
  life_jackets_present_snapshot?: boolean | null;
  life_jackets_lights_snapshot?: boolean | null;
  life_jackets_fluorescein_snapshot?: boolean | null;
  life_jackets_uhf_snapshot?: boolean | null;
  life_jackets_vhf_snapshot?: boolean | null;
  dinghies_number_snapshot?: number | null;
  dinghies_capacity_snapshot?: number | null;
  dinghies_present_snapshot?: boolean | null;
  dinghies_cover_present_snapshot?: boolean | null;
  dinghies_color_snapshot?: string | null;
  color_and_markings_snapshot?: string | null;
  cruising_speed?: string | null;
  cruising_level?: string | null;
  route?: string | null;
  total_eet?: string | null;
  other_information?: string | null;
  endurance?: string | null;
  persons_on_board?: number | null;
  signature_key?: string | null;
}

export interface FlightPlanPublic extends Required<FlightPlanCreate> {
  id: string;
  pilot_user_id: string;
  aircraft_id: string | null;
  status: FlightPlanStatus;
  aircraft_number: number;
  flight_rules: FlightRules | null;
  flight_type: FlightType | null;
  cruising_speed: string | null;
  cruising_level: string | null;
  route: string | null;
  total_eet: string | null;
  other_information: string | null;
  endurance: string | null;
  persons_on_board: number | null;
  aircraft_identification_snapshot: string | null;
  aircraft_type_designator_snapshot: string | null;
  wake_turbulence_category_snapshot: WakeTurbulenceCat | null;
  equipment_com_nav_snapshot: string | null;
  equipment_surveillance_snapshot: string | null;
  emergency_radio_uhf_snapshot: boolean;
  emergency_radio_vhf_snapshot: boolean;
  emergency_radio_elt_snapshot: boolean;
  survival_equipment_present_snapshot: boolean;
  survival_polar_snapshot: boolean;
  survival_desert_snapshot: boolean;
  survival_maritime_snapshot: boolean;
  survival_jungle_snapshot: boolean;
  life_jackets_present_snapshot: boolean;
  life_jackets_lights_snapshot: boolean;
  life_jackets_fluorescein_snapshot: boolean;
  life_jackets_uhf_snapshot: boolean;
  life_jackets_vhf_snapshot: boolean;
  dinghies_number_snapshot: number | null;
  dinghies_capacity_snapshot: number | null;
  dinghies_present_snapshot: boolean;
  dinghies_cover_present_snapshot: boolean;
  dinghies_color_snapshot: string | null;
  color_and_markings_snapshot: string | null;
  aircraft_snapshot_confirmed_at: string | null;
  remarks_present: boolean;
  remarks: string | null;
  pilot_in_command: string | null;
  signature_url: string | null;
  official_pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface FlightPlanSubmitResponse {
  id: string;
  status: FlightPlanStatus;
}

export const FLIGHT_RULE_OPTIONS: { label: string; value: FlightRules }[] = [
  { label: "VFR (V)", value: "V" },
  { label: "IFR (I)", value: "I" },
  { label: "IFR luego VFR (Y)", value: "Y" },
  { label: "VFR luego IFR (Z)", value: "Z" },
];

export const FLIGHT_TYPE_OPTIONS: { label: string; value: FlightType }[] = [
  { label: "General (G)", value: "G" },
  { label: "Scheduled (S)", value: "S" },
  { label: "Non-scheduled (N)", value: "N" },
  { label: "Military (M)", value: "M" },
  { label: "Other (X)", value: "X" },
];

export const FPL_STATUS_LABELS: Record<FlightPlanStatus, string> = {
  draft: "Borrador",
  filed: "Presentado",
  pending_approval: "Pendiente",
  accepted: "Aceptado",
  rejected: "Rechazado",
  active: "Activo",
  closed: "Cerrado",
  cancelled: "Cancelado",
};
