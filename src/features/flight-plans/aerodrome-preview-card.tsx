import * as React from "react";
import { Alert, Pressable, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Copy } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import type { HoursStatus } from "./aerodrome-aip-helpers";
import { AerodromePreviewMap } from "./aerodrome-preview-map";
import type {
  AerodromePreview,
  AerodromePreviewCommunication,
  AerodromePreviewNavAid,
  AerodromePreviewOperational,
} from "./aerodrome-preview-utils";

function PreviewBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-2.5">
      <Text className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{title}</Text>
      {children}
    </View>
  );
}

function InfoLine({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value?.trim()) return null;
  return (
    <View className="flex-row gap-2">
      <Text className="w-[108px] shrink-0 text-xs text-zinc-500">{label}</Text>
      <Text className="flex-1 text-sm leading-snug text-zinc-800">{value}</Text>
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
  return <View className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${color}`} />;
}

function OperationalRow({ row }: { row: AerodromePreviewOperational }) {
  return (
    <View className="flex-row gap-2">
      <HoursStatusDot status={row.status} />
      <Text className="w-[100px] shrink-0 text-xs text-zinc-500">{row.service}</Text>
      <Text className="flex-1 text-sm leading-snug text-zinc-800">{row.hours}</Text>
    </View>
  );
}

function RunwayChip({
  label,
  dimensions,
  surface,
  slope,
  navAidNote,
  remarks,
}: {
  label: string;
  dimensions: string;
  surface: string;
  slope: string | null;
  navAidNote: string | null;
  remarks: string | null;
}) {
  return (
    <View className="gap-1 rounded-xl bg-white px-3 py-2.5 shadow-sm shadow-black/5">
      <Text className="text-sm font-semibold text-zinc-900">{label}</Text>
      <Text className="text-xs text-zinc-600">
        {dimensions} · {surface}
        {slope ? ` · ${slope}` : ""}
        {navAidNote ? ` · ${navAidNote}` : ""}
      </Text>
      {remarks ? <Text className="text-[11px] text-amber-800">{remarks}</Text> : null}
    </View>
  );
}

function CommChip({ comm, onCopy }: { comm: AerodromePreviewCommunication; onCopy: () => void }) {
  return (
    <Pressable
      onPress={onCopy}
      className="gap-0.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 active:bg-zinc-50"
    >
      <View className="flex-row items-center gap-1.5">
        <Text className="text-xs font-bold text-zinc-900">{comm.designation}</Text>
        {comm.channelType ? (
          <Text className="text-[10px] text-zinc-500">{comm.channelType}</Text>
        ) : null}
        <Copy size={12} color="#71717a" />
      </View>
      <Text className="text-sm font-semibold text-zinc-900">{comm.frequency}</Text>
      {comm.callSign ? <Text className="text-[11px] text-zinc-600">{comm.callSign}</Text> : null}
      {comm.hours ? <Text className="text-[10px] text-emerald-700">{comm.hours}</Text> : null}
    </Pressable>
  );
}

function NavAidChip({ aid, onCopy }: { aid: AerodromePreviewNavAid; onCopy: () => void }) {
  return (
    <Pressable
      onPress={onCopy}
      className="flex-row items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-2 active:bg-zinc-50"
    >
      <Text className="text-xs font-bold text-zinc-900">{aid.identification || aid.type}</Text>
      {aid.frequency ? <Text className="text-xs text-zinc-700">{aid.frequency}</Text> : null}
      {aid.hours ? <Text className="text-[10px] text-emerald-700">{aid.hours}</Text> : null}
      <Copy size={12} color="#71717a" />
    </Pressable>
  );
}

export type AerodromePreviewSection = "general" | "runways" | "operations";

type AerodromePreviewCardProps = {
  preview: AerodromePreview;
  section: AerodromePreviewSection;
};

export function AerodromePreviewCard({ preview, section }: AerodromePreviewCardProps) {
  const copyText = React.useCallback(async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copiado", "Copiado al portapapeles.");
  }, []);

  if (section === "general") {
    return (
      <View className="gap-5 rounded-3xl border border-zinc-100 bg-zinc-50/90 p-4">
      {preview.traffic ? (
        <View className="flex-row items-center gap-2">
          <Text className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Tránsito
          </Text>
          <View className="rounded-full bg-white px-2.5 py-1">
            <Text className="text-xs font-semibold text-zinc-800">{preview.traffic}</Text>
          </View>
        </View>
      ) : null}

      <PreviewBlock title="Ubicación">
        <AerodromePreviewMap
          lat={preview.location.lat}
          lng={preview.location.lng}
          coordinatesLabel={preview.location.coordinatesFormatted}
        />
        <View className="gap-1.5">
          <InfoLine label="Referencia ARP" value={preview.location.arpReference} />
          <InfoLine label="Distancia" value={preview.location.cityDistance} />
        </View>
      </PreviewBlock>

      <PreviewBlock title="Datos físicos">
        <View className="gap-1.5">
          <InfoLine label="Elevación" value={preview.physical.elevation} />
          <InfoLine label="Temp. referencia" value={preview.physical.referenceTemperature} />
          <InfoLine label="Temp. mín. media" value={preview.physical.meanLowTemperature} />
          <InfoLine label="GUND en ARP" value={preview.physical.gund} />
          <InfoLine
            label="Variación magnética"
            value={
              preview.physical.magneticVariation
                ? `${preview.physical.magneticVariation}${preview.physical.annualChange ? ` · ${preview.physical.annualChange}` : ""}`
                : null
            }
          />
        </View>
      </PreviewBlock>
      </View>
    );
  }

  if (section === "runways") {
    return (
      <View className="gap-5 rounded-3xl border border-zinc-100 bg-zinc-50/90 p-4">
      {preview.runways.items.length > 0 ? (
        <PreviewBlock title="Pistas">
          <View className="gap-2">
            {preview.runways.items.map((rwy) => (
              <RunwayChip
                key={rwy.label}
                label={rwy.label}
                dimensions={rwy.dimensions}
                surface={rwy.surface}
                slope={rwy.slope}
                navAidNote={rwy.navAidNote}
                remarks={rwy.remarks}
              />
            ))}
          </View>
          {preview.runways.footnote ? (
            <Text className="text-xs font-medium text-amber-800">{preview.runways.footnote}</Text>
          ) : null}
        </PreviewBlock>
      ) : null}

      {preview.declaredDistances.length > 0 ? (
        <PreviewBlock title="Distancias declaradas">
          <View className="gap-2 rounded-xl bg-white px-3 py-2.5">
            <View className="flex-row border-b border-zinc-100 pb-1.5">
              <Text className="w-10 text-[10px] font-semibold text-zinc-500">RWY</Text>
              <Text className="flex-1 text-center text-[10px] font-semibold text-zinc-500">TORA</Text>
              <Text className="flex-1 text-center text-[10px] font-semibold text-zinc-500">TODA</Text>
              <Text className="flex-1 text-center text-[10px] font-semibold text-zinc-500">ASDA</Text>
              <Text className="flex-1 text-center text-[10px] font-semibold text-zinc-500">LDA</Text>
            </View>
            {preview.declaredDistances.map((row) => (
              <View key={row.designator} className="flex-row py-1">
                <Text className="w-10 text-xs font-semibold text-zinc-900">{row.designator}</Text>
                <Text className="flex-1 text-center text-xs text-zinc-700">{row.tora}</Text>
                <Text className="flex-1 text-center text-xs text-zinc-700">{row.toda}</Text>
                <Text className="flex-1 text-center text-xs text-zinc-700">{row.asda}</Text>
                <Text
                  className={`flex-1 text-center text-xs ${row.ldaNotUsable ? "text-zinc-400 line-through" : "text-zinc-700"}`}
                >
                  {row.lda}
                </Text>
              </View>
            ))}
          </View>
        </PreviewBlock>
      ) : null}
      {preview.runways.items.length === 0 && preview.declaredDistances.length === 0 ? (
        <Text className="text-sm text-zinc-600">No hay información de pistas disponible.</Text>
      ) : null}
      </View>
    );
  }

  return (
    <View className="gap-5 rounded-3xl border border-zinc-100 bg-zinc-50/90 p-4">
      {preview.operationalHours.length > 0 ? (
        <PreviewBlock title="Horarios operacionales">
          <View className="gap-2">
            {preview.operationalHours.map((row) => (
              <OperationalRow key={row.service} row={row} />
            ))}
          </View>
          {preview.operationalRemarks ? (
            <Text className="text-[11px] leading-snug text-zinc-500">{preview.operationalRemarks}</Text>
          ) : null}
        </PreviewBlock>
      ) : null}

      <PreviewBlock title="Operador y ANSP">
        <View className="gap-1.5">
          <InfoLine label="Autoridad" value={preview.operators.authority} />
          <InfoLine
            label="Explotador"
            value={
              preview.operators.operator
                ? [preview.operators.operator, preview.operators.operatorContact].filter(Boolean).join("\n")
                : null
            }
          />
          <InfoLine
            label="ANSP"
            value={
              preview.operators.ansp
                ? [preview.operators.ansp, preview.operators.anspContact].filter(Boolean).join("\n")
                : null
            }
          />
        </View>
        {preview.facilityRemarks ? (
          <Text className="text-[11px] leading-snug text-zinc-500">{preview.facilityRemarks}</Text>
        ) : null}
      </PreviewBlock>

      {preview.communications.length > 0 ? (
        <View className="gap-2 border-t border-zinc-200 pt-4">
          <Text className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Comunicaciones
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {preview.communications.map((comm, i) => (
              <CommChip
                key={`${comm.designation}-${comm.frequency}-${i}`}
                comm={comm}
                onCopy={() => void copyText(comm.copyText)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {preview.navigationAids.length > 0 ? (
        <View className="gap-2">
          <Text className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Radioayudas
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {preview.navigationAids.map((aid, i) => (
              <NavAidChip
                key={`${aid.identification}-${aid.frequency}-${i}`}
                aid={aid}
                onCopy={() => void copyText(aid.copyText)}
              />
            ))}
          </View>
        </View>
      ) : null}
      {preview.operationalHours.length === 0 &&
      !preview.operators.authority &&
      !preview.operators.operator &&
      preview.communications.length === 0 &&
      preview.navigationAids.length === 0 ? (
        <Text className="text-sm text-zinc-600">No hay información operacional disponible.</Text>
      ) : null}
    </View>
  );
}
