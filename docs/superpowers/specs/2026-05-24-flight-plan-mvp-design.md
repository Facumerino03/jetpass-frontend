# Flight Plan MVP Design

## Context

JetPass frontend will integrate the Flight Plan (FPL) MVP against `jetpass-core` only. The frontend must not call `jetpass-intelligence` directly. Existing project patterns are Expo Router screens under `src/app`, feature modules under `src/features`, and authenticated API calls through `src/lib/api.ts` with an explicit bearer token.

The existing placeholder screens are `src/app/(tabs)/create-fpl.tsx` and `src/app/(tabs)/plans.tsx`. Aircraft data already uses `GET /pilot/aircraft` through `src/features/aircraft/aircraft-api.ts`.

## Scope

Included in this MVP:

- New dedicated module under `src/features/flight-plans`.
- Create-new FPL wizard with six steps.
- Draft creation only after Step 1 completes successfully.
- Step persistence through `PATCH /flight-plans/{id}` after the draft exists.
- Aerodrome dropdowns backed only by core catalog responses.
- Optional aerodrome intelligence enrichment through core endpoint, with non-blocking warnings.
- Aircraft selection from the existing pilot aircraft endpoint.
- Aircraft snapshot display and snapshot override fields inside the FPL flow only.
- Final submit through `POST /flight-plans/{id}/submit`.
- Basic list of the pilot's flight plans through `GET /flight-plans`.

Excluded from this MVP:

- Rehydrating or editing existing drafts from the list.
- Dynamic route for `GET /flight-plans/{id}`.
- Amend/CHG, close/arrival report, and cancellation flows.
- Auto-generation of Item 18 indicators.
- Blockchain/event displays.
- Changing pilot in command.
- Creating aircraft from the FPL wizard.
- Direct calls to `jetpass-intelligence`.

## API Contract

The frontend will use `apiRequest` from `src/lib/api.ts`. All FPL calls will receive `session.access_token` from `useAuth()`, including intelligence calls through core.

The pasted OpenAPI contract includes the FPL create/update/list/submit schemas and intelligence endpoints. The aerodrome catalog endpoint is included from the product requirements and is treated as part of the core API surface for this MVP.

Aerodromes:

- `GET /flight-plans/aerodromes`
- `GET /flight-plans/aerodromes?query=sa&limit=20`

Expected aerodrome item:

```ts
type FlightPlanAerodrome = {
  id: string;
  icao_code: string;
  name: string;
  is_active: boolean;
};
```

Aerodrome intelligence:

- `POST /flight-plans/intelligence/aerodrome`

```ts
type IntelligenceAerodromeRequest = {
  icao: string;
  force_refresh?: boolean;
};
```

Flight plan creation:

- `POST /flight-plans`

```ts
type FlightPlanCreate = {
  departure_aerodrome_icao: string;
  departure_eobt_utc: string;
  destination_aerodrome_icao: string;
  alternate1_aerodrome_icao: string;
  alternate2_aerodrome_icao: string;
};
```

Flight plan update:

- `PATCH /flight-plans/{flight_plan_id}`

```ts
type FlightPlanUpdate = {
  flight_rules?: "V" | "I" | "Y" | "Z" | null;
  flight_type?: "G" | "S" | "N" | "M" | "X" | null;
  aircraft_id?: string | null;
  aircraft_identification_snapshot?: string | null;
  aircraft_type_designator_snapshot?: string | null;
  wake_turbulence_category_snapshot?: "L" | "M" | "H" | "J" | null;
  equipment_com_nav_snapshot?: string | null;
  equipment_surveillance_snapshot?: string | null;
  emergency_radio_snapshot?: string | null;
  survival_equipment_snapshot?: string | null;
  life_jackets_snapshot?: string | null;
  dinghies_number_snapshot?: number | null;
  dinghies_capacity_snapshot?: number | null;
  dinghies_cover_snapshot?: boolean | null;
  dinghies_color_snapshot?: string | null;
  color_and_markings_snapshot?: string | null;
  cruising_speed?: string | null;
  cruising_level?: string | null;
  route?: string | null;
  rule_change_point?: string | null;
  total_eet?: string | null;
  other_information?: string | null;
  endurance?: string | null;
  persons_on_board?: number | null;
};
```

Submit:

- `POST /flight-plans/{flight_plan_id}/submit`

List:

- `GET /flight-plans`

Aircraft:

- `GET /pilot/aircraft`

## Proposed Files

- `src/features/flight-plans/types.ts`: FPL API types, statuses, enum option arrays, local form state types.
- `src/features/flight-plans/flight-plan-api.ts`: typed wrappers for aerodromes, intelligence, create, update, submit, and list.
- `src/features/flight-plans/flight-plan-wizard.tsx`: six-step creation wizard and local step validation.
- `src/features/flight-plans/aerodrome-combobox.tsx`: catalog-backed searchable selector that only emits selected catalog values.
- `src/features/flight-plans/flight-plan-list.tsx`: basic list UI for `plans.tsx`.
- `src/app/(tabs)/create-fpl.tsx`: screen wrapper for the wizard.
- `src/app/(tabs)/plans.tsx`: screen wrapper for the list.

This keeps the FPL feature isolated and avoids growing `create-fpl.tsx` into a large stateful screen.

## Wizard Flow

### Step 1: El viaje

Fields:

- Departure aerodrome.
- Local EOBT input.
- Destination aerodrome.
- Alternate 1.
- Alternate 2.

Validation:

- All four aerodromes must be selected from catalog-backed dropdowns.
- All four aerodrome ICAO codes must be distinct.
- EOBT local must be present and convertible to a valid date.

On advance:

- Convert local EOBT to UTC ISO string with `Date` serialization.
- Call `POST /flight-plans`.
- Store returned `id` and returned `FlightPlanPublic` state.

### Step 2: Tipo de operacion

Fields:

- `flight_rules`: one of `V`, `I`, `Y`, `Z`.
- `flight_type`: one of `G`, `S`, `N`, `M`, `X`.

On advance:

- Call `PATCH /flight-plans/{id}` with `flight_rules` and `flight_type`.

### Step 3: Aeronave

Fields:

- Aircraft selected from `GET /pilot/aircraft`.
- Optional snapshot override fields.

On aircraft selection:

- Call `PATCH /flight-plans/{id}` with `aircraft_id`.
- Use the response as the current FPL state, including snapshot fields preloaded by the backend.

Snapshot banner displays:

- Matricula: `aircraft_identification_snapshot`.
- Tipo ICAO: `aircraft_type_designator_snapshot`.
- Estela: `wake_turbulence_category_snapshot`.
- COM/NAV: `equipment_com_nav_snapshot`.
- Vigilancia: `equipment_surveillance_snapshot`.
- Emergencia/SAR: `emergency_radio_snapshot`, `survival_equipment_snapshot`.
- Chalecos/botes: `life_jackets_snapshot`, `dinghies_number_snapshot`, `dinghies_capacity_snapshot`, `dinghies_cover_snapshot`, `dinghies_color_snapshot`.
- Color: `color_and_markings_snapshot`.

If the pilot edits snapshot data, only the FPL snapshot fields are patched. The aircraft profile is never updated from this flow.

### Step 4: El vuelo

Fields:

- `cruising_speed`.
- `cruising_level`.
- `route`.
- `total_eet`.
- `rule_change_point` only when `flight_rules` is `Y` or `Z`.

On advance:

- Call `PATCH /flight-plans/{id}` with step fields.

### Step 5: Operacional del dia

Fields:

- `endurance`.
- `persons_on_board`, including the pilot.

Validation:

- `persons_on_board` must be at least `1`.
- `endurance` must be four characters before backend validation.

On advance:

- Call `PATCH /flight-plans/{id}`.

### Step 6: Revision final

Fields:

- `other_information` for free-form Item 18 text.

Behavior:

- Do not auto-generate Item 18 indicators.
- Show a compact review of all required values.
- Disable submit until all required local fields are complete.

On submit:

- Patch `other_information` if changed.
- Call `POST /flight-plans/{id}/submit`.
- Show success when status is `pending_approval` or any successful status returned by core.

## Aerodrome Selector

The selector must not be a free ICAO input. It will keep local search text for filtering but will store only the selected catalog object or its ICAO code.

Behavior:

- Initial focus can load `GET /flight-plans/aerodromes?limit=20`.
- Search calls `GET /flight-plans/aerodromes?query=<text>&limit=20`.
- Results are displayed as `ICAO - name`.
- Selection stores the returned `icao_code`.
- Manual text that is not selected from results does not satisfy validation.
- On selection, call core intelligence endpoint in the background.
- If intelligence fails, show a warning such as `No se pudo enriquecer SAEZ ahora. Podés continuar.`

## List Screen

`src/app/(tabs)/plans.tsx` will fetch `GET /flight-plans` and show the pilot's plans.

Card contents:

- Route summary: departure to destination.
- EOBT formatted for display.
- Status badge.
- Aircraft identification snapshot when available.

Interactions:

- Pull to refresh.
- No draft rehydration or detail navigation in this MVP.

## Error Handling

Use `ApiError` and `getErrorMessage` from `src/lib/api.ts` for user-facing messages.

Rules:

- Show backend 422 messages clearly near the step action area.
- If backend reports an inactive or missing aerodrome catalog entry, move the wizard back to Step 1.
- If submit reports `endurance <= total_eet`, move the wizard back to Step 5.
- If submit reports missing or invalid `rule_change_point`, move the wizard back to Step 4.
- Intelligence failures are warnings, not blocking errors.

Because backend error strings may vary, routing decisions will use conservative message matching over `ApiError.message` and validation payload text, with fallback to staying on the current step and showing the error.

## Persistence Model

Within this MVP, persistence means backend draft persistence after Step 1 and patching each completed step. The frontend does not persist a pre-draft Step 1 form locally across app restarts.

If the user leaves the wizard after draft creation, the backend draft exists, but returning to it from the list is intentionally out of scope for this iteration.

## Testing And Verification

Manual verification targets:

- Login session can access FPL endpoints with bearer token.
- Step 1 blocks missing fields and duplicate aerodromes.
- Step 1 sends UTC EOBT.
- Aerodrome selector does not accept non-catalog text.
- Intelligence warning does not block step advancement.
- Step 2 patches operation type fields.
- Step 3 lists aircraft, selects one, and displays snapshot fields.
- Snapshot overrides patch FPL only.
- Step 4 requires `rule_change_point` for `Y` and `Z` only.
- Step 5 requires endurance and persons on board.
- Step 6 blocks submit until required fields are complete.
- Submit transitions to the returned status.
- `plans.tsx` lists existing FPLs.

Automated verification available in this repository:

- Run `npm run lint` after implementation.
- Run TypeScript checking if a project script is added later; currently `package.json` has no `typecheck` script.
