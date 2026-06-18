import * as React from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { AlertTriangle, Copy, RefreshCw, ScrollText } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import {
  buildNotamFilters,
  filterPilotNotamAlerts,
  formatNotamDate,
  formatValidityRange,
  getNotamValidity,
  getNotamsForFilter,
  isOperationalNotam,
  pickNotamText,
  validityLabel,
  validityTone,
  type NotamFilterOption,
} from "./aerodrome-notam-utils";
import type { NotamEntry, NotamIntelligencePayload } from "./types";

function FilterPill({
  option,
  selected,
  onPress,
}: {
  option: NotamFilterOption;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "min-h-[32px] flex-row items-center gap-1.5 rounded-full border px-3 py-1.5",
        selected
          ? "border-rose-200 bg-rose-50"
          : "border-rose-100/80 bg-rose-50/40",
      )}
    >
      <Text
        className={cn(
          "text-xs font-semibold leading-none",
          selected ? "text-rose-900" : "text-rose-800/70",
        )}
        {...(Platform.OS === "android" ? { includeFontPadding: false } : {})}
      >
        {option.label}
      </Text>
      <View className="rounded-full bg-white/80 px-1.5 py-0.5">
        <Text className="text-[10px] font-bold text-rose-700">{option.count}</Text>
      </View>
    </Pressable>
  );
}

function NotamCard({ notam, onCopy }: { notam: NotamEntry; onCopy: () => void }) {
  const [expanded, setExpanded] = React.useState(false);
  const validity = getNotamValidity(notam.valid_from, notam.valid_to);
  const tone = validityTone(validity);
  const body = pickNotamText(notam);
  const operational = isOperationalNotam(body);

  return (
    <Pressable
      onPress={() => setExpanded((v) => !v)}
      className={cn(
        "gap-2.5 rounded-2xl border bg-white p-4 shadow-sm shadow-black/5",
        operational ? "border-amber-200" : "border-zinc-100",
      )}
    >
      <View className="flex-row items-start justify-between gap-2">
        <View className="min-w-0 flex-1 gap-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="font-mono text-sm font-bold text-zinc-900">{notam.notam_id}</Text>
            <View className={cn("rounded-full border px-2 py-0.5", tone.pill)}>
              <Text className={cn("text-[10px] font-semibold", tone.text)}>
                {validityLabel(validity)}
              </Text>
            </View>
            {operational ? (
              <View className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5">
                <Text className="text-[10px] font-semibold text-amber-800">Operacional</Text>
              </View>
            ) : null}
          </View>
          <Text className="text-[11px] text-zinc-500">
            {formatValidityRange(notam.valid_from, notam.valid_to)}
          </Text>
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            onCopy();
          }}
          hitSlop={8}
          className="rounded-full bg-zinc-100 p-2"
        >
          <Copy size={14} color="#71717a" />
        </Pressable>
      </View>

      <Text
        className="text-sm leading-relaxed text-zinc-800"
        numberOfLines={expanded ? undefined : 4}
      >
        {body}
      </Text>

      {expanded ? (
        <Text className="rounded-xl bg-zinc-50 px-3 py-2 font-mono text-[11px] leading-relaxed text-zinc-600">
          {notam.raw_text}
        </Text>
      ) : (
        <Text className="text-[11px] font-medium text-zinc-400">Tocá para ver texto crudo</Text>
      )}
    </Pressable>
  );
}

type AerodromeNotamViewProps = {
  notam: NotamIntelligencePayload | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
};

export function AerodromeNotamView({
  notam,
  isLoading,
  error,
  onRefresh,
}: AerodromeNotamViewProps) {
  const filters = React.useMemo(
    () => (notam ? buildNotamFilters(notam) : []),
    [notam],
  );

  const [activeFilter, setActiveFilter] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (filters.length && !activeFilter) {
      setActiveFilter(filters[0].id);
    }
  }, [filters, activeFilter]);

  React.useEffect(() => {
    setActiveFilter(null);
  }, [notam?.icao]);

  const visibleNotams = React.useMemo(() => {
    if (!notam || !activeFilter) return [];
    return getNotamsForFilter(notam, activeFilter);
  }, [notam, activeFilter]);

  const copyText = React.useCallback(async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copiado", "NOTAM copiado al portapapeles.");
  }, []);

  if (isLoading && !notam) {
    return (
      <View className="items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-10">
        <ActivityIndicator color="#e11d48" />
        <Text className="text-sm text-zinc-600">Consultando NOTAM...</Text>
      </View>
    );
  }

  if (error && !notam) {
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

  if (!notam) {
    return (
      <View className="gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4">
        <Text className="text-sm text-zinc-600">No hay NOTAM disponibles para este aeródromo.</Text>
      </View>
    );
  }

  const totalCount =
    notam.aerodrome_notams.length + notam.fir_notams.length;
  const pilotAlerts = filterPilotNotamAlerts(notam.alerts);

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between">
        <View className="gap-0.5">
          <Text className="text-sm font-semibold text-zinc-900">
            {totalCount} aviso{totalCount === 1 ? "" : "s"}
          </Text>
          {notam.site_last_updated_at ? (
            <Text className="text-[11px] text-zinc-500">
              Fuente actualizada {formatNotamDate(notam.site_last_updated_at) ?? ""}
            </Text>
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

      {pilotAlerts.length > 0 ? (
        <View className="gap-2">
          {pilotAlerts.map((alert, i) => (
            <View
              key={`${alert.code ?? "alert"}-${i}`}
              className="flex-row gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5"
            >
              <AlertTriangle size={14} color="#b45309" style={{ marginTop: 2 }} />
              <Text className="flex-1 text-xs leading-snug text-amber-900">
                {alert.message ?? alert.code}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {filters.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerClassName="gap-2"
        >
          {filters.map((option) => (
            <FilterPill
              key={option.id}
              option={option}
              selected={activeFilter === option.id}
              onPress={() => setActiveFilter(option.id)}
            />
          ))}
        </ScrollView>
      ) : null}

      {visibleNotams.length > 0 ? (
        <View className="gap-3">
          {visibleNotams.map((entry) => (
            <NotamCard
              key={`${entry.notam_id}-${entry.valid_from}`}
              notam={entry}
              onCopy={() => void copyText(pickNotamText(entry))}
            />
          ))}
        </View>
      ) : (
        <View className="items-center gap-2 rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-8">
          <ScrollText size={24} color="#a1a1aa" />
          <Text className="text-sm text-zinc-600">No hay NOTAM en este filtro.</Text>
        </View>
      )}

      {notam.fetched_at ? (
        <Text className="text-[11px] text-zinc-400">
          Consultado {formatNotamDate(notam.fetched_at) ?? ""}
          {notam.source ? ` · ${notam.source}` : ""}
        </Text>
      ) : null}

      {error ? <Text className="text-xs text-amber-700">{error}</Text> : null}
    </View>
  );
}
