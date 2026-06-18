import * as React from "react";
import { Pressable, View } from "react-native";
import { ChevronRight, Search } from "lucide-react-native";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandGroupHeading,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { CascadeSpinner } from "@/components/ui/cascade-spinner";
import { Text } from "@/components/ui/text";
import { AerodromeInfoSheet } from "./aerodrome-info-sheet";
import { listControlledAerodromes, runAerodromeIntelligence } from "./flight-plan-api";
import type { ControlledAerodrome, IntelligenceRunResponse } from "./types";

const SEARCH_DEBOUNCE_MS = 280;

type AerodromeComboboxProps = {
  accessToken: string;
  selected: ControlledAerodrome | null;
  onSelect: (aerodrome: ControlledAerodrome) => void;
  placeholder?: string;
  label?: string;
  groupHeading?: string;
};

export function AerodromeCombobox({
  accessToken,
  selected,
  onSelect,
  placeholder = "Buscar aerodromo o codigo ICAO...",
  label,
  groupHeading = "Aerodromos",
}: AerodromeComboboxProps) {
  const [query, setQuery] = React.useState(selected?.icao_code ?? "");
  const [results, setResults] = React.useState<ControlledAerodrome[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [highlightId, setHighlightId] = React.useState<string | null>(selected?.id ?? null);
  const [aipData, setAipData] = React.useState<IntelligenceRunResponse | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [aipLoading, setAipLoading] = React.useState(false);
  const aipTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const isCatalogMatch = Boolean(selected && selected.icao_code === query);
  const hasAipSections = Boolean(aipData?.aerodrome?.data?.current?.ad_sections?.length);

  React.useEffect(() => {
    setQuery(selected ? selected.icao_code : "");
    setHighlightId(selected?.id ?? null);
  }, [selected]);

  React.useEffect(() => {
    if (!selected) {
      setAipData(null);
      setIsSheetOpen(false);
      setAipLoading(false);
    }
    return () => {
      if (aipTimeoutRef.current) {
        clearTimeout(aipTimeoutRef.current);
      }
    };
  }, [selected]);

  const search = React.useCallback(
    async (nextQuery: string) => {
      setIsLoading(true);
      try {
        const data = await listControlledAerodromes(accessToken, {
          query: nextQuery,
          limit: 20,
        });
        setResults(data.filter((item) => item.is_active));
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken],
  );

  React.useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      void search(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, isOpen, search]);

  const handleChangeText = React.useCallback((text: string) => {
    setQuery(text.toUpperCase());
    setIsOpen(true);
    setHighlightId(null);
  }, []);

  const handleFocus = React.useCallback(() => {
    setIsOpen(true);
    void search(query);
  }, [query, search]);

  const handleSelect = React.useCallback(
    (aerodrome: ControlledAerodrome) => {
      onSelect(aerodrome);
      setQuery(aerodrome.icao_code);
      setHighlightId(aerodrome.id);
      setIsOpen(false);
      setAipData(null);
      setIsSheetOpen(false);
      setAipLoading(true);

      if (aipTimeoutRef.current) {
        clearTimeout(aipTimeoutRef.current);
        aipTimeoutRef.current = null;
      }

      void runAerodromeIntelligence(accessToken, aerodrome.icao_code)
        .then((response) => {
          setAipData(response);
          const hasSections = Boolean(response?.aerodrome?.data?.current?.ad_sections?.length);
          if (hasSections) {
            aipTimeoutRef.current = setTimeout(() => {
              setAipLoading(false);
            }, 3000);
          }
        })
        .catch(() => {
          setAipData(null);
        });
    },
    [accessToken, onSelect],
  );

  const showList = isOpen;

  return (
    <View className="gap-2">
      {label ? <Text className="text-sm font-medium text-muted-foreground">{label}</Text> : null}

      <Command>
        <CommandInput
          value={query}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          placeholder={placeholder}
          autoCapitalize="characters"
          autoCorrect={false}
          icon={<Search size={16} color="hsl(240 3.8% 46.1%)" strokeWidth={2} />}
          rightIcon={aipLoading ? <CascadeSpinner size={16} color="hsl(240 3.8% 46.1%)" /> : null}
          valueBadge={
            selected?.icao_code ? (
              <View className="rounded-md bg-zinc-100 px-2.5 py-1">
                <Text className="text-xs font-semibold text-zinc-800">{selected.icao_code}</Text>
              </View>
            ) : null
          }
        />

        {showList ? (
          <>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <CommandGroupHeading>{groupHeading}</CommandGroupHeading>

                {isLoading ? (
                  <CommandEmpty>Buscando aerodromos...</CommandEmpty>
                ) : null}

                {!isLoading && results.length === 0 ? (
                  <CommandEmpty>
                    {query?.trim() ? "Sin resultados para esa busqueda." : "Escribe para buscar en el catalogo."}
                  </CommandEmpty>
                ) : null}

                {!isLoading
                  ? results.map((item) => {
                      const isHighlighted = highlightId === item.id || selected?.id === item.id;
                      return (
                        <CommandItem
                          key={item.id}
                          selected={isHighlighted}
                          onPress={() => handleSelect(item)}
                          onPressIn={() => setHighlightId(item.id)}
                        >
                          <View className="min-w-0 flex-1 flex-row items-center gap-3">
                            <View className="rounded-md bg-zinc-100 px-2.5 py-1">
                              <Text className="text-xs font-semibold text-zinc-800">{item.icao_code}</Text>
                            </View>
                            <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                              {item.name?.toUpperCase() ?? ""}
                            </Text>
                          </View>
                        </CommandItem>
                      );
                    })
                  : null}
              </CommandGroup>
            </CommandList>
          </>
        ) : null}

        {isCatalogMatch && !aipLoading && hasAipSections ? (
          <>
            <CommandSeparator />
            <Pressable
              onPress={() => setIsSheetOpen(true)}
              className="flex-row items-center justify-between gap-2 px-3 py-3 active:bg-accent"
              accessibilityRole="button"
              accessibilityLabel="Ver información técnica del aeródromo"
            >
              <View className="flex-row items-center gap-2">
                <View className="h-2 w-2 rounded-full bg-emerald-500" />
                <Text className="text-xs font-medium text-emerald-800">Información técnica disponible</Text>
              </View>
              <ChevronRight size={14} color="#047857" />
            </Pressable>
          </>
        ) : null}
      </Command>

      <AerodromeInfoSheet
        visible={isSheetOpen}
        accessToken={accessToken}
        data={aipData}
        onClose={() => setIsSheetOpen(false)}
      />
    </View>
  );
}
