import * as React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BookOpen, Cloud, MapPin, Plane, Radio, ScrollText, X } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { getErrorMessage } from "@/lib/api";
import { getAd21 } from "./aerodrome-aip-helpers";
import { AerodromePreviewCard } from "./aerodrome-preview-card";
import { buildAerodromePreview } from "./aerodrome-preview-utils";
import { AerodromeInfoContent } from "./aerodrome-section-views";
import { AerodromeTabPills, type AerodromeInfoTab } from "./aerodrome-tab-pills";
import { AerodromeNotamView } from "./aerodrome-notam-view";
import { AerodromeWeatherView } from "./aerodrome-weather-view";
import { runNotamIntelligence, runWeatherIntelligence } from "./flight-plan-api";
import type {
  IntelligenceRunResponse,
  NotamIntelligencePayload,
  WeatherIntelligencePayload,
} from "./types";

const TAB_OPTIONS = [
  { value: "general" as const, label: "General", icon: MapPin, tone: "sky" as const },
  { value: "runways" as const, label: "Pistas", icon: Plane, tone: "emerald" as const },
  { value: "operations" as const, label: "Operación", icon: Radio, tone: "amber" as const },
  { value: "aip" as const, label: "AIP", icon: BookOpen, tone: "violet" as const },
  { value: "weather" as const, label: "Meteo", icon: Cloud, tone: "blue" as const },
  { value: "notam" as const, label: "NOTAM", icon: ScrollText, tone: "rose" as const },
];

type AerodromeInfoSheetProps = {
  visible: boolean;
  accessToken: string;
  data: IntelligenceRunResponse | null;
  onClose: () => void;
};

export function AerodromeInfoSheet({
  visible,
  accessToken,
  data,
  onClose,
}: AerodromeInfoSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [activeTab, setActiveTab] = React.useState<AerodromeInfoTab>("general");
  const [weatherData, setWeatherData] = React.useState<WeatherIntelligencePayload | null>(null);
  const [weatherLoading, setWeatherLoading] = React.useState(false);
  const [weatherError, setWeatherError] = React.useState<string | null>(null);
  const [weatherFetched, setWeatherFetched] = React.useState(false);
  const [notamData, setNotamData] = React.useState<NotamIntelligencePayload | null>(null);
  const [notamLoading, setNotamLoading] = React.useState(false);
  const [notamError, setNotamError] = React.useState<string | null>(null);
  const [notamFetched, setNotamFetched] = React.useState(false);

  const payload = data?.aerodrome;
  const aipData = payload?.data ?? null;
  const meta = aipData?.current?._meta;
  const icao = aipData?.icao ?? "";

  React.useEffect(() => {
    if (!visible) {
      setActiveTab("general");
      setWeatherData(null);
      setWeatherError(null);
      setWeatherLoading(false);
      setWeatherFetched(false);
      setNotamData(null);
      setNotamError(null);
      setNotamLoading(false);
      setNotamFetched(false);
    }
  }, [visible]);

  React.useEffect(() => {
    setWeatherData(null);
    setWeatherError(null);
    setWeatherFetched(false);
    setNotamData(null);
    setNotamError(null);
    setNotamFetched(false);
  }, [icao]);

  const airportType = aipData ? getAd21(aipData.current.ad_sections)?.airport_type : null;

  const preview = React.useMemo(
    () => (aipData ? buildAerodromePreview(aipData) : null),
    [aipData],
  );

  const loadWeather = React.useCallback(
    async (forceRefresh = false) => {
      if (!icao) return;
      setWeatherLoading(true);
      setWeatherError(null);
      try {
        const response = await runWeatherIntelligence(accessToken, icao, forceRefresh);
        setWeatherData(response.weather);
        if (!response.weather?.metar && !response.weather?.taf) {
          setWeatherError("No se recibió METAR ni TAF para este aeródromo.");
        }
      } catch (error) {
        setWeatherError(getErrorMessage(error));
      } finally {
        setWeatherLoading(false);
        setWeatherFetched(true);
      }
    },
    [accessToken, icao],
  );

  const loadNotam = React.useCallback(
    async (forceRefresh = false) => {
      if (!icao) return;
      setNotamLoading(true);
      setNotamError(null);
      try {
        const response = await runNotamIntelligence(accessToken, icao, forceRefresh);
        setNotamData(response.notam);
        const count =
          (response.notam?.aerodrome_notams.length ?? 0) +
          (response.notam?.fir_notams.length ?? 0);
        if (!count) {
          setNotamError("No se recibieron NOTAM para este aeródromo.");
        }
      } catch (error) {
        setNotamError(getErrorMessage(error));
      } finally {
        setNotamLoading(false);
        setNotamFetched(true);
      }
    },
    [accessToken, icao],
  );

  React.useEffect(() => {
    if (!visible || activeTab !== "weather" || weatherFetched || weatherLoading) return;
    void loadWeather();
  }, [visible, activeTab, weatherFetched, weatherLoading, loadWeather]);

  React.useEffect(() => {
    if (!visible || activeTab !== "notam" || notamFetched || notamLoading) return;
    void loadNotam();
  }, [visible, activeTab, notamFetched, notamLoading, loadNotam]);

  if (!aipData || !preview) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable
          className="flex-col rounded-t-3xl bg-white"
          style={{ height: height * 0.88, paddingBottom: insets.bottom + 16 }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="shrink-0 items-center py-3">
            <View className="h-1 w-10 rounded-full bg-zinc-300" />
          </View>

          <View className="shrink-0 flex-row items-start justify-between gap-3 px-5 pb-3">
            <View className="min-w-0 flex-1 gap-1">
              <Text className="font-mono text-2xl font-bold text-zinc-950">{aipData.icao}</Text>
              <Text className="text-base text-zinc-700">{aipData.full_name || aipData.name}</Text>
              {airportType ? (
                <View className="mt-1 self-start rounded-full bg-sky-50 px-2.5 py-1">
                  <Text className="text-xs font-medium text-sky-800">{airportType}</Text>
                </View>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100"
              accessibilityLabel="Cerrar"
            >
              <X size={20} color="#52525b" />
            </Pressable>
          </View>

          <View className="z-10 shrink-0 bg-white pb-2">
            <AerodromeTabPills value={activeTab} onChange={setActiveTab} options={TAB_OPTIONS} />
          </View>

          <ScrollView
            className="min-h-0 flex-1 px-5"
            contentContainerClassName="gap-4 pb-6"
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            {activeTab === "general" ? (
              <AerodromePreviewCard preview={preview} section="general" />
            ) : null}

            {activeTab === "runways" ? (
              <AerodromePreviewCard preview={preview} section="runways" />
            ) : null}

            {activeTab === "operations" ? (
              <AerodromePreviewCard preview={preview} section="operations" />
            ) : null}

            {activeTab === "aip" ? (
              <AerodromeInfoContent
                sections={aipData.current.ad_sections}
                meta={meta}
                airacCycle={payload?.airac_cycle}
              />
            ) : null}

            {activeTab === "weather" ? (
              <AerodromeWeatherView
                weather={weatherData}
                isLoading={weatherLoading}
                error={weatherError}
                onRefresh={() => void loadWeather(true)}
              />
            ) : null}

            {activeTab === "notam" ? (
              <AerodromeNotamView
                notam={notamData}
                isLoading={notamLoading}
                error={notamError}
                onRefresh={() => void loadNotam(true)}
              />
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
