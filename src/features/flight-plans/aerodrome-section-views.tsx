import * as React from "react";
import { Linking, Pressable, View } from "react-native";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { Text } from "@/components/ui/text";
import {
  extractContacts,
  formatCompactCoord,
  formatElevation,
  formatPcnSurface,
  hoursStatus,
  isNegativeDetail,
  parseTemperatureRange,
  shortSectionTitle,
  type HoursStatus,
} from "./aerodrome-aip-helpers";
import type {
  Ad212Data,
  Ad213Data,
  Ad218Data,
  Ad219Data,
  Ad21Data,
  Ad22Data,
  Ad23Data,
  Ad24Data,
  AerodromeAIPMeta,
  AIPSection,
} from "./types";

function formatAiracDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function AipPublicationMeta({
  meta,
  airacCycle,
}: {
  meta?: AerodromeAIPMeta;
  airacCycle?: string;
}) {
  const cycle = airacCycle ?? meta?.airac_cycle;
  const effectiveDate = formatAiracDate(meta?.airac_effective_date);
  const document = meta?.source?.document?.trim();
  const version = meta?.version;

  const hasCycle = Boolean(cycle && cycle !== "unknown");
  if (!hasCycle && !effectiveDate && !document) return null;

  return (
    <View className="gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <Text className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
        Publicación AIP
      </Text>
      {hasCycle ? <KeyValueRow label="Ciclo AIRAC" value={cycle} /> : null}
      {effectiveDate ? <KeyValueRow label="Vigente desde" value={effectiveDate} /> : null}
      {document ? <KeyValueRow label="Documento" value={document} /> : null}
      {version != null ? <KeyValueRow label="Versión" value={String(version)} /> : null}
    </View>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
  remarks,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  remarks?: string | null;
}) {
  return (
    <View className="gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <View className="gap-0.5">
        <Text className="text-sm font-semibold text-zinc-900">{title}</Text>
        {subtitle ? (
          <Text className="text-xs text-zinc-500" numberOfLines={3}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {children}
      {remarks?.trim() ? (
        <Text className="border-t border-zinc-200/80 pt-2 text-xs leading-snug text-zinc-500">
          {remarks.trim()}
        </Text>
      ) : null}
    </View>
  );
}

function KeyValueRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value?.trim()) return null;
  return (
    <View className="gap-0.5">
      <Text className="text-xs font-medium text-zinc-500">{label}</Text>
      <Text className="text-sm leading-snug text-zinc-800">{value}</Text>
    </View>
  );
}

function HoursStatusDot({ status }: { status: HoursStatus }) {
  const color =
    status === "h24"
      ? "bg-emerald-500"
      : status === "on_request"
        ? "bg-amber-500"
        : status === "closed"
          ? "bg-zinc-300"
          : "bg-sky-500";
  return <View className={`mt-1 h-2 w-2 shrink-0 rounded-full ${color}`} />;
}

function ContactBlock({ text, label }: { text: string | null | undefined; label: string }) {
  if (!text?.trim()) return null;
  const { phones, emails, urls } = extractContacts(text);
  return (
    <View className="gap-1.5">
      <Text className="text-xs font-medium text-zinc-500">{label}</Text>
      <Text className="text-sm leading-snug text-zinc-800">{text}</Text>
      <View className="flex-row flex-wrap gap-2">
        {phones.map((phone) => (
          <Pressable key={phone} onPress={() => void Linking.openURL(`tel:${phone.replace(/\s/g, "")}`)}>
            <Text className="text-xs text-sky-700 underline">{phone}</Text>
          </Pressable>
        ))}
        {emails.map((email) => (
          <Pressable key={email} onPress={() => void Linking.openURL(`mailto:${email}`)}>
            <Text className="text-xs text-sky-700 underline">{email}</Text>
          </Pressable>
        ))}
        {urls.map((url) => {
          const href = url.startsWith("http") ? url : `https://${url}`;
          return (
            <Pressable key={url} onPress={() => void Linking.openURL(href)}>
              <Text className="text-xs text-sky-700 underline">{url}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Ad21SectionView({ data }: { data: Ad21Data }) {
  return (
    <SectionCard title="AD 2.1" subtitle="Aerodrome location and name" remarks={data.remarks}>
      <View className="gap-3">
        <KeyValueRow label="ICAO" value={data.location_indicator} />
        <KeyValueRow label="Nombre" value={data.aerodrome_name} />
        <KeyValueRow label="Tipo" value={data.airport_type} />
      </View>
    </SectionCard>
  );
}

export function Ad22SectionView({ data }: { data: Ad22Data }) {
  const coords = formatCompactCoord(data.arp_coordinates);
  const temps = parseTemperatureRange(data.temperature_reference_and_min);
  return (
    <SectionCard
      title="AD 2.2"
      subtitle="Aerodrome geographical and administrative data"
      remarks={data.remarks}
    >
      <View className="gap-3 rounded-xl bg-white p-3">
        <KeyValueRow label="Coordenadas ARP" value={coords?.formatted ?? data.arp_coordinates} />
        <KeyValueRow label="Emplazamiento ARP" value={data.arp_location_description} />
        <KeyValueRow label="Distancia desde ciudad" value={data.direction_and_distance_from_city} />
        <KeyValueRow label="Elevación" value={formatElevation(data.elevation_m, data.elevation_ft)} />
        <KeyValueRow label="Temp. referencia" value={temps.reference} />
        <KeyValueRow label="Temp. mín. media" value={temps.meanLow} />
        <KeyValueRow label="GUND" value={data.gund_m != null ? `${data.gund_m} m` : null} />
        <KeyValueRow
          label="Variación magnética"
          value={
            data.magnetic_variation
              ? `${data.magnetic_variation}${data.magnetic_variation_annual_change ? ` · ${data.magnetic_variation_annual_change}` : ""}`
              : null
          }
        />
        <KeyValueRow label="Tránsito permitido" value={data.traffic_types_permitted} />
      </View>
      <ContactBlock label="Jefatura / Administración" text={data.ad_administration} />
      <ContactBlock label="Explotador" text={data.ad_operator} />
      <ContactBlock label="ANSP" text={data.ans_provider} />
    </SectionCard>
  );
}

export function Ad23SectionView({ data }: { data: Ad23Data }) {
  return (
    <SectionCard title="AD 2.3" subtitle="Operational hours" remarks={data.remarks}>
      <View className="gap-2">
        {data.services.map((svc, i) => (
          <View key={`${svc.service_name}-${i}`} className="flex-row gap-2 border-t border-zinc-200/60 pt-2 first:border-t-0 first:pt-0">
            <HoursStatusDot status={hoursStatus(svc.hours)} />
            <View className="min-w-0 flex-1 gap-0.5">
              <Text className="text-xs font-medium text-zinc-700">{svc.service_name}</Text>
              <Text className="text-sm text-zinc-800">{svc.hours}</Text>
            </View>
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

export function Ad24SectionView({ data }: { data: Ad24Data }) {
  return (
    <SectionCard title="AD 2.4" subtitle="Handling and loading services" remarks={data.remarks}>
      <View className="gap-3">
        {data.facilities.map((f) => (
          <View key={f.item_number} className="flex-row gap-2">
            <View
              className={`mt-0.5 h-5 w-5 items-center justify-center rounded-full ${isNegativeDetail(f.details) ? "bg-zinc-100" : "bg-emerald-50"}`}
            >
              <Text className={`text-[10px] font-bold ${isNegativeDetail(f.details) ? "text-zinc-400" : "text-emerald-700"}`}>
                {isNegativeDetail(f.details) ? "—" : "✓"}
              </Text>
            </View>
            <View className="min-w-0 flex-1 gap-0.5">
              <Text className="text-xs font-medium text-zinc-600">{f.description}</Text>
              <Text className="text-sm text-zinc-800">{f.details}</Text>
            </View>
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

function RunwayDetail({ runway }: { runway: Ad212Data["runways"][number] }) {
  return (
    <View className="gap-2.5 rounded-xl bg-white p-3">
      <KeyValueRow label="Dimensiones" value={runway.dimensions_m.replace(/x/gi, " × ")} />
      <KeyValueRow label="PCN / superficie" value={formatPcnSurface(runway.pcn_entries)} />
      <KeyValueRow
        label="Rumbos"
        value={
          runway.magnetic_bearing || runway.true_bearing
            ? `MAG ${runway.magnetic_bearing ?? "—"} · GEO ${runway.true_bearing ?? "—"}`
            : null
        }
      />
      <KeyValueRow
        label="Elevación THR"
        value={formatElevation(runway.thr_elevation_m, runway.thr_elevation_ft)}
      />
      <KeyValueRow label="Coordenadas THR" value={runway.thr_coordinates} />
      <KeyValueRow label="Pendiente" value={runway.slope} />
      <KeyValueRow label="SWY" value={runway.swy_dimensions_m} />
      <KeyValueRow label="CWY" value={runway.cwy_dimensions_m} />
      <KeyValueRow label="Franja" value={runway.strip_dimensions_m} />
      <KeyValueRow label="RESA" value={runway.resa_dimensions_m} />
      <KeyValueRow label="Sistema de parada" value={runway.arresting_system} />
      <KeyValueRow label="OFZ" value={runway.ofz == null ? null : runway.ofz ? "Sí" : "No"} />
      {runway.remarks?.trim() ? (
        <Text className="text-xs leading-snug text-amber-800">{runway.remarks}</Text>
      ) : null}
    </View>
  );
}

export function Ad212SectionView({ data }: { data: Ad212Data }) {
  const [selected, setSelected] = React.useState(data.runways[0]?.designator ?? "");
  const runway = data.runways.find((r) => r.designator === selected) ?? data.runways[0];

  if (!data.runways.length) return null;

  return (
    <SectionCard title="AD 2.12" subtitle="Runway physical characteristics" remarks={data.section_remarks}>
      {data.runways.length > 1 ? (
        <ToggleGroup
          value={selected}
          onChange={setSelected}
          options={data.runways.map((r) => ({ value: r.designator, label: `RWY ${r.designator}` }))}
        />
      ) : null}
      {runway ? <RunwayDetail runway={runway} /> : null}
    </SectionCard>
  );
}

export function Ad213SectionView({ data }: { data: Ad213Data }) {
  if (!data.entries.length) return null;
  return (
    <SectionCard title="AD 2.13" subtitle="Declared distances">
      <View className="gap-1 rounded-xl bg-white p-3">
        <View className="flex-row border-b border-zinc-100 pb-1.5">
          <Text className="w-16 text-[10px] font-semibold text-zinc-500">RWY</Text>
          <Text className="flex-1 text-center text-[10px] font-semibold text-zinc-500">TORA</Text>
          <Text className="flex-1 text-center text-[10px] font-semibold text-zinc-500">TODA</Text>
          <Text className="flex-1 text-center text-[10px] font-semibold text-zinc-500">ASDA</Text>
          <Text className="flex-1 text-center text-[10px] font-semibold text-zinc-500">LDA</Text>
        </View>
        {data.entries.map((e) => (
          <View key={e.rwy_designator} className="flex-row border-t border-zinc-50 py-2 first:border-t-0">
            <Text className="w-16 text-xs font-semibold text-zinc-900">{e.rwy_designator}</Text>
            <Text className="flex-1 text-center text-xs text-zinc-700">
              {e.tora_m != null ? `${Math.round(e.tora_m)} m` : "—"}
            </Text>
            <Text className="flex-1 text-center text-xs text-zinc-700">
              {e.toda_m != null ? `${Math.round(e.toda_m)} m` : "—"}
            </Text>
            <Text className="flex-1 text-center text-xs text-zinc-700">
              {e.asda_m != null ? `${Math.round(e.asda_m)} m` : "—"}
            </Text>
            <Text
              className={`flex-1 text-center text-xs ${e.lda_not_usable ? "text-zinc-400 line-through" : "text-zinc-700"}`}
            >
              {e.lda_not_usable ? "NU" : e.lda_m != null ? `${Math.round(e.lda_m)} m` : "—"}
            </Text>
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

export function Ad218SectionView({ data }: { data: Ad218Data }) {
  return (
    <SectionCard title="AD 2.18" subtitle="ATS communication facilities">
      <View className="gap-3">
        {data.facilities.map((facility, i) => (
          <View key={`${facility.service_designation}-${i}`} className="gap-2 rounded-xl bg-white p-3">
            <Text className="text-sm font-semibold text-zinc-900">{facility.service_designation}</Text>
            {facility.call_sign ? (
              <Text className="text-xs text-zinc-600">{facility.call_sign}</Text>
            ) : null}
            {facility.frequencies.length > 0 ? (
              <View className="gap-1.5">
                {facility.frequencies.map((freq, j) => (
                  <View key={`${freq.frequency}-${j}`} className="flex-row items-baseline gap-2">
                    <Text className="text-base font-bold text-zinc-950">{freq.frequency}</Text>
                    {freq.channel_type ? (
                      <Text className="text-xs text-zinc-500">{freq.channel_type}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-sm text-zinc-500">Sin frecuencias publicadas</Text>
            )}
            {facility.hours_of_operation ? (
              <Text className="text-xs text-emerald-700">{facility.hours_of_operation}</Text>
            ) : null}
            {facility.remarks?.trim() ? (
              <Text className="text-xs text-zinc-500">{facility.remarks}</Text>
            ) : null}
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

export function Ad219SectionView({ data }: { data: Ad219Data }) {
  return (
    <SectionCard title="AD 2.19" subtitle="Radio navigation and landing aids">
      <View className="gap-3">
        {data.aids.map((aid, i) => (
          <View key={`${aid.type_of_aid}-${i}`} className="gap-1.5 rounded-xl bg-white p-3">
            <View className="flex-row flex-wrap items-baseline gap-2">
              <Text className="text-sm font-semibold text-zinc-900">{aid.type_of_aid}</Text>
              {aid.identification ? (
                <Text className="font-mono text-sm font-bold text-zinc-800">{aid.identification}</Text>
              ) : null}
            </View>
            {aid.frequency_channel ? (
              <Text className="text-base font-bold text-zinc-950">{aid.frequency_channel}</Text>
            ) : null}
            {aid.hours_of_operation ? (
              <Text className="text-xs text-emerald-700">{aid.hours_of_operation}</Text>
            ) : null}
            {aid.coordinates ? (
              <Text className="text-xs text-zinc-600">{aid.coordinates}</Text>
            ) : null}
            {aid.elevation_m != null ? (
              <Text className="text-xs text-zinc-600">Elev. antena: {aid.elevation_m} m</Text>
            ) : null}
            {aid.remarks?.trim() ? (
              <Text className="text-xs font-medium leading-snug text-amber-900">{aid.remarks}</Text>
            ) : null}
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

function UnknownSectionView({ section }: { section: AIPSection }) {
  const data = section.data as Record<string, unknown>;
  const entries = Object.entries(data).filter(
    ([key, value]) => !key.startsWith("_") && value != null && value !== "",
  );
  if (!entries.length) return null;

  return (
    <SectionCard title={section.section_id} subtitle={shortSectionTitle(section)}>
      <View className="gap-2">
        {entries.map(([key, value]) => (
          <KeyValueRow
            key={key}
            label={key}
            value={typeof value === "string" ? value : JSON.stringify(value)}
          />
        ))}
      </View>
    </SectionCard>
  );
}

export function AerodromeSectionView({ section }: { section: AIPSection }) {
  switch (section.section_id) {
    case "AD 2.1":
      return <Ad21SectionView data={section.data as Ad21Data} />;
    case "AD 2.2":
      return <Ad22SectionView data={section.data as Ad22Data} />;
    case "AD 2.3":
      return <Ad23SectionView data={section.data as Ad23Data} />;
    case "AD 2.4":
      return <Ad24SectionView data={section.data as Ad24Data} />;
    case "AD 2.12":
      return <Ad212SectionView data={section.data as Ad212Data} />;
    case "AD 2.13":
      return <Ad213SectionView data={section.data as Ad213Data} />;
    case "AD 2.18":
      return <Ad218SectionView data={section.data as Ad218Data} />;
    case "AD 2.19":
      return <Ad219SectionView data={section.data as Ad219Data} />;
    default:
      return <UnknownSectionView section={section} />;
  }
}

export function AerodromeInfoContent({
  sections,
  meta,
  airacCycle,
}: {
  sections: AIPSection[];
  meta?: AerodromeAIPMeta;
  airacCycle?: string;
}) {
  const sorted = [...sections].sort((a, b) => {
    const parse = (id: string) => {
      const match = id.match(/AD\s*2\.(\d+)/i);
      return match ? Number.parseInt(match[1], 10) : 999;
    };
    return parse(a.section_id) - parse(b.section_id) || a.section_id.localeCompare(b.section_id);
  });

  if (!sorted.length) {
    return (
      <Text className="text-sm text-zinc-600">No hay secciones AIP parseadas para este aeródromo.</Text>
    );
  }

  return (
    <View className="gap-4">
      <AipPublicationMeta meta={meta} airacCycle={airacCycle} />
      {sorted.map((section) => (
        <AerodromeSectionView key={section.section_id} section={section} />
      ))}
    </View>
  );
}
