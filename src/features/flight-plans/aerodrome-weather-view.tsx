import * as React from "react";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Cloud, Copy, RefreshCw, Wind } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import {
  formatCloudLayers,
  formatTafChangeBadge,
  formatTafPeriodLabel,
  formatUtcShort,
  formatWind,
  formatVisibilitySm,
  getFlightCategoryTone,
  metarSummaryLines,
} from "./aerodrome-weather-utils";
import type { WeatherIntelligencePayload } from "./types";

function WeatherCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string | null;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={cn("gap-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm shadow-black/5", className)}>
      <View className="gap-0.5">
        <Text className="text-sm font-semibold text-zinc-900">{title}</Text>
        {subtitle ? <Text className="text-xs text-zinc-500">{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function RawReportBlock({ label, raw, onCopy }: { label: string; raw: string; onCopy: () => void }) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{label}</Text>
        <Pressable onPress={onCopy} className="flex-row items-center gap-1 rounded-full bg-zinc-100 px-2 py-1">
          <Copy size={12} color="#71717a" />
          <Text className="text-[10px] font-medium text-zinc-600">Copiar</Text>
        </Pressable>
      </View>
      <Text className="rounded-xl bg-zinc-50 px-3 py-2.5 font-mono text-xs leading-relaxed text-zinc-800">
        {raw}
      </Text>
    </View>
  );
}

function MetricGrid({ lines }: { lines: { label: string; value: string }[] }) {
  return (
    <View className="gap-2.5">
      {lines.map((line) => (
        <View key={line.label} className="flex-row gap-2">
          <Text className="w-[118px] shrink-0 text-xs text-zinc-500">{line.label}</Text>
          <Text className="flex-1 text-sm leading-snug text-zinc-800">{line.value}</Text>
        </View>
      ))}
    </View>
  );
}

type AerodromeWeatherViewProps = {
  weather: WeatherIntelligencePayload | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
};

export function AerodromeWeatherView({
  weather,
  isLoading,
  error,
  onRefresh,
}: AerodromeWeatherViewProps) {
  const copyRaw = React.useCallback(async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copiado", "Reporte copiado al portapapeles.");
  }, []);

  if (isLoading && !weather) {
    return (
      <View className="items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-10">
        <ActivityIndicator color="#0ea5e9" />
        <Text className="text-sm text-zinc-600">Consultando METAR y TAF...</Text>
      </View>
    );
  }

  if (error && !weather) {
    return (
      <View className="gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
        <Text className="text-sm text-red-700">{error}</Text>
        <Pressable
          onPress={onRefresh}
          className="flex-row items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2"
        >
          <RefreshCw size={14} color="#b91c1c" />
          <Text className="text-sm font-medium text-red-700">Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  if (!weather?.metar && !weather?.taf) {
    return (
      <View className="gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4">
        <Text className="text-sm text-zinc-600">No hay información meteorológica disponible para este aeródromo.</Text>
        <Pressable
          onPress={onRefresh}
          className="flex-row items-center justify-center gap-2 self-start rounded-full border border-zinc-200 bg-white px-4 py-2"
        >
          <RefreshCw size={14} color="#52525b" />
          <Text className="text-sm font-medium text-zinc-700">Actualizar</Text>
        </Pressable>
      </View>
    );
  }

  const categoryTone = getFlightCategoryTone(weather.metar?.flight_category);
  const station = weather.station;

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className={cn("rounded-full border px-3 py-1.5", categoryTone.pill)}>
            <Text className={cn("text-sm font-bold", categoryTone.text)}>
              {categoryTone.label}
            </Text>
          </View>
          {station?.elev != null ? (
            <Text className="text-xs text-zinc-500">Elev. {station.elev} m</Text>
          ) : null}
        </View>
        <Pressable
          onPress={onRefresh}
          disabled={isLoading}
          className="h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#52525b" />
          ) : (
            <RefreshCw size={16} color="#52525b" />
          )}
        </Pressable>
      </View>

      {weather.metar ? (
        <WeatherCard
          title="METAR"
          subtitle={
            weather.metar.observed_at
              ? `Observado ${formatUtcShort(weather.metar.observed_at) ?? ""}`
              : null
          }
        >
          <MetricGrid lines={metarSummaryLines(weather.metar)} />
          <RawReportBlock
            label="Texto crudo"
            raw={weather.metar.raw}
            onCopy={() => void copyRaw(weather.metar!.raw)}
          />
        </WeatherCard>
      ) : null}

      {weather.taf ? (
        <WeatherCard
          title="TAF"
          subtitle={
            weather.taf.valid_from && weather.taf.valid_to
              ? `Válido ${formatUtcShort(weather.taf.valid_from) ?? ""} → ${formatUtcShort(weather.taf.valid_to) ?? ""}`
              : null
          }
        >
          {weather.taf.forecast_periods.length > 0 ? (
            <View className="gap-2.5">
              {weather.taf.forecast_periods.map((period, index) => {
                const badge = formatTafChangeBadge(period);
                return (
                  <View
                    key={`${period.timeFrom}-${period.timeTo}-${index}`}
                    className="gap-2 rounded-xl border border-zinc-100 bg-zinc-50/80 p-3"
                  >
                    <View className="flex-row flex-wrap items-center gap-2">
                      <Text className="text-xs font-semibold text-zinc-800">
                        {formatTafPeriodLabel(period)}
                      </Text>
                      {badge ? (
                        <View className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5">
                          <Text className="text-[10px] font-bold text-amber-800">{badge}</Text>
                        </View>
                      ) : null}
                    </View>
                    <View className="flex-row flex-wrap gap-x-4 gap-y-1">
                      <View className="flex-row items-center gap-1">
                        <Wind size={12} color="#71717a" />
                        <Text className="text-xs text-zinc-700">
                          {formatWind(period.wdir, period.wspd, period.wgst)}
                        </Text>
                      </View>
                      {period.visib != null ? (
                        <Text className="text-xs text-zinc-700">
                          Vis {formatVisibilitySm(period.visib)}
                        </Text>
                      ) : null}
                      {period.wxString ? (
                        <Text className="text-xs font-medium text-zinc-800">{period.wxString}</Text>
                      ) : null}
                    </View>
                    <Text className="text-xs text-zinc-600">{formatCloudLayers(period.clouds)}</Text>
                  </View>
                );
              })}
            </View>
          ) : null}
          <RawReportBlock
            label="Texto crudo"
            raw={weather.taf.raw}
            onCopy={() => void copyRaw(weather.taf!.raw)}
          />
        </WeatherCard>
      ) : null}

      {weather.fetched_at ? (
        <View className="flex-row items-center gap-1.5">
          <Cloud size={12} color="#a1a1aa" />
          <Text className="text-[11px] text-zinc-400">
            Actualizado {formatUtcShort(weather.fetched_at) ?? ""}
            {weather.source ? ` · ${weather.source}` : ""}
          </Text>
        </View>
      ) : null}

      {error ? <Text className="text-xs text-amber-700">{error}</Text> : null}
    </View>
  );
}
