import * as React from "react";
import { Platform, Pressable, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Calendar, CalendarDays, Sun } from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { InputWithSelect } from "@/components/ui/input-with-select";
import { SelectionCardGrid } from "@/components/ui/selection-card";
import { Text } from "@/components/ui/text";
import {
  formatDateDisplay,
  formatDateOnly,
  formatEobtUtcPreview,
  formatTime24h,
  parseDateOnly,
  parseTime24h,
  todayDateOnly,
} from "./eobt-utils";
import type { EobtWhen, Step1Data } from "./step1-onboarding";

const TIME_FORMAT_OPTIONS = [
  { value: "utc", label: "UTC", description: "Hora coordinada" },
  { value: "lcl", label: "LCL", description: "Hora local" },
] as const;

const WHEN_OPTIONS: {
  value: EobtWhen;
  badge: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "today",
    badge: "HOY",
    description: "Salgo en el dia de hoy",
    icon: <Sun size={16} color="hsl(240 5.9% 10%)" strokeWidth={2} />,
  },
  {
    value: "other",
    badge: "OTRO",
    description: "Programo otra fecha",
    icon: <CalendarDays size={16} color="hsl(240 5.9% 10%)" strokeWidth={2} />,
  },
];

type EobtFieldsProps = {
  data: Step1Data;
  onChange: (patch: Partial<Step1Data>) => void;
};

function timeStringToDate(time: string): Date {
  const parsed = parseTime24h(time);
  const base = new Date();
  base.setHours(parsed?.hours ?? 12, parsed?.minutes ?? 0, 0, 0);
  return base;
}

export function EobtFields({ data, onChange }: EobtFieldsProps) {
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showTimePicker, setShowTimePicker] = React.useState(false);

  const isToday = data.eobtWhen === "today";
  const today = todayDateOnly();

  React.useEffect(() => {
    if (!isToday || data.eobtDate === today) return;
    onChange({ eobtDate: today });
  }, [isToday, today, data.eobtDate, onChange]);

  const dateValue = React.useMemo(
    () => parseDateOnly(data.eobtDate) ?? parseDateOnly(today) ?? new Date(),
    [data.eobtDate, today],
  );

  const timeValue = React.useMemo(
    () => timeStringToDate(data.eobtTime || "12:00"),
    [data.eobtTime],
  );

  const utcPreview = formatEobtUtcPreview(
    isToday && !data.eobtDate ? { ...data, eobtDate: today } : data,
  );
  const timeFormat = data.eobtUseLocalTime ? "lcl" : "utc";

  const handleWhenChange = React.useCallback(
    (when: EobtWhen) => {
      if (when === "today") {
        onChange({ eobtWhen: "today", eobtDate: todayDateOnly() });
        return;
      }
      onChange({ eobtWhen: "other", eobtDate: "" });
    },
    [onChange],
  );

  const handleDateChange = React.useCallback(
    (event: DateTimePickerEvent, selected?: Date) => {
      if (Platform.OS === "android") setShowDatePicker(false);
      if (event.type === "dismissed" || !selected) return;
      onChange({ eobtDate: formatDateOnly(selected) });
    },
    [onChange],
  );

  const handleTimeChange = React.useCallback(
    (event: DateTimePickerEvent, selected?: Date) => {
      if (Platform.OS === "android") setShowTimePicker(false);
      if (event.type === "dismissed" || !selected) return;
      onChange({ eobtTime: formatTime24h(selected) });
    },
    [onChange],
  );

  const handleUtcTimeText = React.useCallback(
    (text: string) => {
      const digits = text.replace(/\D/g, "").slice(0, 4);
      if (digits.length <= 2) {
        onChange({ eobtTime: digits });
        return;
      }
      onChange({ eobtTime: `${digits.slice(0, 2)}:${digits.slice(2)}` });
    },
    [onChange],
  );

  const handleFormatChange = React.useCallback(
    (format: string) => {
      onChange({
        eobtUseLocalTime: format === "lcl",
        eobtTime: "",
      });
    },
    [onChange],
  );

  return (
    <View className="gap-5">
      <View className="gap-3">
        <Text className="text-lg font-semibold text-foreground">¿Para cuando es el vuelo?</Text>
        <SelectionCardGrid
          options={WHEN_OPTIONS}
          value={data.eobtWhen}
          onChange={handleWhenChange}
        />
      </View>

      {!isToday ? (
        <View className="gap-2">
          <Text className="text-sm font-medium text-muted-foreground">Fecha de salida</Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            className="flex-row items-center gap-3 rounded-lg border border-border bg-background px-3 py-3.5 active:bg-accent"
          >
            <Calendar size={18} color="hsl(240 3.8% 46.1%)" strokeWidth={2} />
            <Text
              className={`flex-1 text-base ${data.eobtDate ? "text-foreground" : "text-muted-foreground"}`}
            >
              {formatDateDisplay(data.eobtDate) ?? "dd/mm/aaaa"}
            </Text>
          </Pressable>
          {showDatePicker ? (
            <DateTimePicker
              value={dateValue}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              minimumDate={new Date()}
              onChange={handleDateChange}
            />
          ) : null}
        </View>
      ) : null}

      <View className="gap-2">
        <Text className="text-sm font-medium text-muted-foreground">Hora de salida</Text>

        <InputWithSelect
          value={timeFormat}
          options={[...TIME_FORMAT_OPTIONS]}
          onValueChange={handleFormatChange}
        >
          {data.eobtUseLocalTime ? (
            <Pressable
              onPress={() => setShowTimePicker(true)}
              className="flex-1 px-3 py-3.5 active:bg-accent"
            >
              <Text
                className={`text-base ${data.eobtTime ? "text-foreground" : "text-muted-foreground"}`}
              >
                {data.eobtTime || "Seleccionar hora"}
              </Text>
            </Pressable>
          ) : (
            <Input
              value={data.eobtTime}
              onChangeText={handleUtcTimeText}
              placeholder="14:30"
              keyboardType="numbers-and-punctuation"
              className="h-full min-h-0 flex-1 border-0 bg-transparent px-3 py-3.5 text-base leading-5"
              maxLength={5}
            />
          )}
        </InputWithSelect>

        {showTimePicker && data.eobtUseLocalTime ? (
          <DateTimePicker
            value={timeValue}
            mode="time"
            is24Hour
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleTimeChange}
          />
        ) : null}

        <Text className="text-xs text-muted-foreground">
          {data.eobtUseLocalTime ? "Hora local de tu zona." : "Formato 24 horas (UTC)."}
        </Text>
      </View>

      {utcPreview && data.eobtUseLocalTime ? (
        <View className="rounded-lg bg-zinc-50 px-3 py-2.5">
          <Text className="text-xs font-medium text-muted-foreground">EOBT (UTC)</Text>
          <Text className="mt-0.5 text-sm font-medium text-foreground">{utcPreview}</Text>
        </View>
      ) : null}
    </View>
  );
}
