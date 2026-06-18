import * as React from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { ChevronLeft, ChevronRight, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { getErrorMessage } from "@/lib/api";
import { listAircraft } from "@/features/aircraft/aircraft-api";
import type { AircraftPublic } from "@/features/aircraft/types";
import { createFlightPlan, submitFlightPlan, updateFlightPlan } from "./flight-plan-api";
import { FplSubmitResultSheet, type FplSubmitSheetPhase } from "./fpl-submit-result-sheet";
import type { FlightPlanPublic, FlightPlanStatus, FlightRules, FlightType } from "./types";
import { step1DataToFlightDateAndTime } from "./eobt-utils";
import {
  EMPTY_STEP1_DATA,
  Step1Content,
  validateStep1SubStep,
} from "./step1-onboarding";
import type { Step1Data } from "./step1-onboarding";
import { Step2OperationType } from "./step2-operation-type";
import {
  AircraftFplConfirmSheet,
  aircraftFplFieldsToUpdate,
  EMPTY_AIRCRAFT_FPL_FIELDS,
  resolveAircraftFplFields,
  Step3AircraftSelect,
  type AircraftFplFields,
} from "./step3-aircraft";
import { Step4Route } from "./step4-route";
import { Step7Review } from "./step7-review";
import { parseEet } from "./route-eet-utils";

type FlightPlanWizardProps = { accessToken: string };

const TOTAL_STEPS = 7;
const STEP1_SUB_STEP_COUNT = 4;

const STEP_TITLES = [
  "El viaje",
  "Tipo de operacion",
  "Aeronave",
  "La ruta",
  "Velocidad y nivel",
  "Operacional del dia",
  "Revisión final",
];

function WizardProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <View className="w-full flex-row gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className={`h-1.5 flex-1 rounded-full ${i < current ? "bg-green-400" : "bg-zinc-100"}`}
        />
      ))}
    </View>
  );
}

function NavArrow({
  direction,
  onPress,
  disabled,
}: {
  direction: "back" | "forward";
  onPress: () => void;
  disabled?: boolean;
}) {
  const Icon = direction === "back" ? ChevronLeft : ChevronRight;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`h-14 w-14 items-center justify-center rounded-full ${
        disabled ? "bg-zinc-100 opacity-40" : "bg-zinc-900"
      }`}
    >
      <Icon size={28} color={disabled ? "#a1a1aa" : "#ffffff"} />
    </Pressable>
  );
}

export function FlightPlanWizard({ accessToken }: FlightPlanWizardProps) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = React.useState(1);
  const [step1SubStep, setStep1SubStep] = React.useState(0);
  const [step1Data, setStep1Data] = React.useState<Step1Data>(EMPTY_STEP1_DATA);
  const [flightPlan, setFlightPlan] = React.useState<FlightPlanPublic | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [flightRules, setFlightRules] = React.useState<FlightRules | "">("");
  const [flightType, setFlightType] = React.useState<FlightType | "">("");
  const [aircraftSheetOpen, setAircraftSheetOpen] = React.useState(false);
  const [aircraft, setAircraft] = React.useState<AircraftPublic[]>([]);
  const [aircraftListLoading, setAircraftListLoading] = React.useState(false);
  const [selectedAircraftId, setSelectedAircraftId] = React.useState("");
  const [aircraftFplFields, setAircraftFplFields] =
    React.useState<AircraftFplFields>(EMPTY_AIRCRAFT_FPL_FIELDS);
  const [flightStep, setFlightStep] = React.useState({
    cruising_speed: "",
    cruising_level: "",
    route: "",
    total_eet: "",
  });
  const [operationalStep, setOperationalStep] = React.useState({
    endurance: "",
    persons_on_board: "1",
  });
  const [otherInformation, setOtherInformation] = React.useState("");
  const [submitSheet, setSubmitSheet] = React.useState<{
    visible: boolean;
    phase: FplSubmitSheetPhase;
    status: FlightPlanStatus | null;
    errorMessage: string | null;
  }>({
    visible: false,
    phase: "submitting",
    status: null,
    errorMessage: null,
  });

  const handleStep1Complete = React.useCallback(
    async (data: Step1Data) => {
      setError(null);
      const dateAndTime = step1DataToFlightDateAndTime(data);
      if (!dateAndTime) {
        setError("Completa fecha y hora de salida en UTC.");
        return;
      }

      setIsSaving(true);
      try {
        const created = await createFlightPlan(accessToken, {
          departure_aerodrome_icao: data.departure!.icao_code,
          departure_time_utc: dateAndTime.departure_time_utc,
          flight_date: dateAndTime.flight_date,
          destination_aerodrome_icao: data.destination!.icao_code,
          alternate1_aerodrome_icao: data.alternate1!.icao_code,
          alternate2_aerodrome_icao: data.alternate2!.icao_code,
        });
        setFlightPlan(created);
        setStep(2);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsSaving(false);
      }
    },
    [accessToken],
  );

  const saveOperation = React.useCallback(async () => {
    setError(null);
    if (!flightPlan) {
      setError("Primero completa el viaje.");
      setStep(1);
      return;
    }
    if (!flightRules || !flightType) {
      setError("Selecciona reglas de vuelo y tipo de operacion.");
      return;
    }
    setIsSaving(true);
    try {
      const updated = await updateFlightPlan(accessToken, flightPlan.id, {
        flight_rules: flightRules,
        flight_type: flightType,
      });
      setFlightPlan(updated);
      setStep(3);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }, [accessToken, flightPlan, flightRules, flightType]);

  React.useEffect(() => {
    if (step !== 3) {
      setAircraftSheetOpen(false);
      return;
    }
    let isMounted = true;
    setAircraftListLoading(true);
    listAircraft(accessToken)
      .then((data) => {
        if (isMounted) setAircraft(data.filter((item) => item.is_active));
      })
      .catch((err) => setError(getErrorMessage(err, "No se pudieron cargar aeronaves.")))
      .finally(() => {
        if (isMounted) setAircraftListLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [accessToken, step]);

  React.useEffect(() => {
    if (step !== 3 || !flightPlan?.aircraft_id) return;
    setSelectedAircraftId(flightPlan.aircraft_id);
  }, [step, flightPlan?.aircraft_id]);

  const openAircraftConfirmSheet = React.useCallback(async () => {
    setError(null);
    if (!flightPlan) {
      setError("Primero completa los pasos anteriores.");
      setStep(1);
      return;
    }
    if (!selectedAircraftId) {
      setError("Selecciona una aeronave.");
      return;
    }
    setIsSaving(true);
    try {
      const updated = await updateFlightPlan(accessToken, flightPlan.id, {
        aircraft_id: selectedAircraftId,
      });
      setFlightPlan(updated);
      const selected = aircraft.find((item) => item.id === selectedAircraftId) ?? null;
      setAircraftFplFields(resolveAircraftFplFields(updated, selected));
      setAircraftSheetOpen(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }, [accessToken, aircraft, flightPlan, selectedAircraftId]);

  const confirmAircraftStep = React.useCallback(async () => {
    if (!flightPlan || !selectedAircraftId) {
      setError("Selecciona una aeronave.");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const updated = await updateFlightPlan(
        accessToken,
        flightPlan.id,
        aircraftFplFieldsToUpdate(aircraftFplFields),
      );
      setFlightPlan(updated);
      setAircraftSheetOpen(false);
      setStep(4);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }, [accessToken, flightPlan, selectedAircraftId, aircraftFplFields]);

  const saveRouteStep = React.useCallback(async () => {
    if (!flightPlan) return;
    if (!flightStep.route.trim()) {
      setError("Ingresa la ruta del plan de vuelo.");
      return;
    }
    if (!parseEet(flightStep.total_eet)) {
      setError("Ingresa el EET en formato HHMM (4 digitos).");
      return;
    }
    setIsSaving(true);
    try {
      const updated = await updateFlightPlan(accessToken, flightPlan.id, {
        route: flightStep.route.trim(),
        total_eet: flightStep.total_eet,
      });
      setFlightPlan(updated);
      setStep(5);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }, [accessToken, flightPlan, flightStep.route, flightStep.total_eet]);

  const saveFlightStep = React.useCallback(async () => {
    if (!flightPlan) return;
    if (!flightStep.cruising_speed || !flightStep.cruising_level) {
      setError("Completa velocidad y nivel de crucero.");
      return;
    }
    setIsSaving(true);
    try {
      const updated = await updateFlightPlan(accessToken, flightPlan.id, {
        cruising_speed: flightStep.cruising_speed,
        cruising_level: flightStep.cruising_level,
      });
      setFlightPlan(updated);
      setStep(6);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }, [accessToken, flightPlan, flightStep]);

  const saveOperationalStep = React.useCallback(async () => {
    if (!flightPlan) return;
    const persons = Number.parseInt(operationalStep.persons_on_board, 10);
    if (operationalStep.endurance.length !== 4 || Number.isNaN(persons) || persons < 1) {
      setError("Completa autonomia de 4 digitos y personas a bordo mayor o igual a 1.");
      return;
    }
    setIsSaving(true);
    try {
      const updated = await updateFlightPlan(accessToken, flightPlan.id, {
        endurance: operationalStep.endurance,
        persons_on_board: persons,
      });
      setFlightPlan(updated);
      setStep(7);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }, [accessToken, flightPlan, operationalStep]);

  const submitCurrentFlightPlan = React.useCallback(async () => {
    if (!flightPlan) return;
    setError(null);
    setSubmitSheet({
      visible: true,
      phase: "submitting",
      status: null,
      errorMessage: null,
    });
    setIsSaving(true);
    try {
      if (otherInformation !== (flightPlan.other_information ?? "")) {
        const updated = await updateFlightPlan(accessToken, flightPlan.id, {
          other_information: otherInformation.trim() || null,
        });
        setFlightPlan(updated);
      }
      const result = await submitFlightPlan(accessToken, flightPlan.id);
      setSubmitSheet({
        visible: true,
        phase: "success",
        status: result.status,
        errorMessage: null,
      });
    } catch (err) {
      const message = getErrorMessage(err);
      const lower = message.toLowerCase();
      const needsOperationalFix =
        lower.includes("endurance") || lower.includes("autonomia");

      if (needsOperationalFix) {
        setSubmitSheet({
          visible: false,
          phase: "error",
          status: null,
          errorMessage: null,
        });
        setError(message);
        setStep(6);
      } else {
        setSubmitSheet({
          visible: true,
          phase: "error",
          status: null,
          errorMessage: message,
        });
      }
    } finally {
      setIsSaving(false);
    }
  }, [accessToken, flightPlan, otherInformation]);

  const handleGoHome = React.useCallback(() => {
    setSubmitSheet({
      visible: false,
      phase: "submitting",
      status: null,
      errorMessage: null,
    });
    router.replace("/(tabs)");
  }, []);

  const closeSubmitSheet = React.useCallback(() => {
    setSubmitSheet({
      visible: false,
      phase: "submitting",
      status: null,
      errorMessage: null,
    });
  }, []);

  const handleClose = React.useCallback(() => {
    router.back();
  }, []);

  const handleBack = React.useCallback(() => {
    setError(null);
    if (step === 1) {
      if (step1SubStep === 0) return;
      setStep1SubStep((prev) => prev - 1);
      return;
    }
    setStep((prev) => Math.max(1, prev - 1));
  }, [step, step1SubStep]);

  const advanceStep1 = React.useCallback(() => {
    const validationError = validateStep1SubStep(step1SubStep, step1Data);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    if (step1SubStep < STEP1_SUB_STEP_COUNT - 1) {
      setStep1SubStep((prev) => prev + 1);
      return;
    }
    void handleStep1Complete(step1Data);
  }, [step1SubStep, step1Data, handleStep1Complete]);

  const handleForward = React.useCallback(() => {
    if (step === 1) {
      advanceStep1();
    } else if (step === 2) {
      void saveOperation();
    } else if (step === 3) {
      if (aircraftSheetOpen) return;
      void openAircraftConfirmSheet();
    } else if (step === 4) {
      void saveRouteStep();
    } else if (step === 5) {
      void saveFlightStep();
    } else if (step === 6) {
      void saveOperationalStep();
    } else if (step === 7) {
      void submitCurrentFlightPlan();
    }
  }, [
    step,
    advanceStep1,
    saveOperation,
    openAircraftConfirmSheet,
    saveRouteStep,
    saveFlightStep,
    saveOperationalStep,
    submitCurrentFlightPlan,
    aircraftSheetOpen,
  ]);

  const canGoBack = step > 1 || (step === 1 && step1SubStep > 0);

  const canGoForward = React.useMemo(() => {
    if (isSaving) return false;
    if (aircraftSheetOpen) return false;
    if (submitSheet.visible && submitSheet.phase !== "error") return false;
    return true;
  }, [isSaving, aircraftSheetOpen, submitSheet]);

  const isImmersiveStep = step === 4;

  if (isImmersiveStep && flightPlan) {
    return (
      <View style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <Step4Route
            departureIcao={flightPlan.departure_aerodrome_icao}
            destinationIcao={flightPlan.destination_aerodrome_icao}
            departureName={step1Data.departure?.name}
            destinationName={step1Data.destination?.name}
            departureTimeUtc={flightPlan.departure_time_utc}
            departureLat={step1Data.departure?.latitude ?? null}
            departureLon={step1Data.departure?.longitude ?? null}
            destinationLat={step1Data.destination?.latitude ?? null}
            destinationLon={step1Data.destination?.longitude ?? null}
            route={flightStep.route}
            totalEet={flightStep.total_eet}
            topInset={insets.top}
            bottomInset={insets.bottom}
            onRouteChange={(value) => setFlightStep((prev) => ({ ...prev, route: value }))}
            onTotalEetChange={(value) => setFlightStep((prev) => ({ ...prev, total_eet: value }))}
            footer={
              <>
                {canGoBack ? (
                  <NavArrow direction="back" onPress={handleBack} disabled={isSaving} />
                ) : (
                  <View className="h-14 w-14" />
                )}
                {isSaving ? (
                  <ActivityIndicator color="#18181b" />
                ) : canGoForward ? (
                  <NavArrow direction="forward" onPress={handleForward} />
                ) : (
                  <View className="h-14 w-14" />
                )}
              </>
            }
          />
        </KeyboardAvoidingView>

        <Pressable
          onPress={handleClose}
          style={{
            position: "absolute",
            top: insets.top + 12,
            right: 16,
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: "rgba(0,0,0,0.12)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={22} color="#ffffff" strokeWidth={2.5} />
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View
        style={{ paddingTop: insets.top + 12 }}
        className="flex-row items-center px-4 pb-6"
      >
        <View className="min-w-0 flex-1 justify-center pr-28">
          <WizardProgressBar current={step} total={TOTAL_STEPS} />
        </View>
        <Pressable
          onPress={handleClose}
          className="h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100"
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
        >
          <X size={22} color="#3f3f46" strokeWidth={3} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="grow px-6 pb-6"
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-2 pb-4">
            {error && !aircraftSheetOpen ? (
              <Text className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</Text>
            ) : null}
          </View>

          {step === 1 ? (
            <Step1Content
              accessToken={accessToken}
              subStep={step1SubStep}
              data={step1Data}
              onDataChange={setStep1Data}
            />
          ) : (
            <View className="gap-8">
              {step !== 2 && step !== 4 ? (
                <Text className="text-4xl font-bold leading-tight text-zinc-950">
                  {STEP_TITLES[step - 1]}
                </Text>
              ) : null}

              {step === 2 ? (
                <Step2OperationType
                  flightRules={flightRules}
                  flightType={flightType}
                  onFlightRulesChange={setFlightRules}
                  onFlightTypeChange={setFlightType}
                />
              ) : null}

              {step === 3 ? (
                <Step3AircraftSelect
                  aircraft={aircraft}
                  selectedAircraftId={selectedAircraftId}
                  isLoading={aircraftListLoading}
                  onSelect={(aircraftId) => {
                    setSelectedAircraftId(aircraftId);
                    setError(null);
                  }}
                />
              ) : null}


              {step === 5 ? (
                <View className="gap-6">
                  <View className="flex-row gap-3">
                    <View className="flex-1 gap-2">
                      <Text className="text-sm font-medium text-zinc-600">Velocidad</Text>
                      <Input
                        value={flightStep.cruising_speed}
                        onChangeText={(value) =>
                          setFlightStep((prev) => ({ ...prev, cruising_speed: value.toUpperCase() }))
                        }
                        placeholder="N0120"
                        autoCapitalize="characters"
                        className="h-14 rounded-2xl border-zinc-200"
                      />
                    </View>
                    <View className="flex-1 gap-2">
                      <Text className="text-sm font-medium text-zinc-600">Nivel</Text>
                      <Input
                        value={flightStep.cruising_level}
                        onChangeText={(value) =>
                          setFlightStep((prev) => ({ ...prev, cruising_level: value.toUpperCase() }))
                        }
                        placeholder="A045"
                        autoCapitalize="characters"
                        className="h-14 rounded-2xl border-zinc-200"
                      />
                    </View>
                  </View>
                  {(flightRules === "Y" || flightRules === "Z") ? (
                    <View className="rounded-2xl bg-zinc-50 p-4">
                      <Text className="text-sm text-zinc-500">
                        Para reglas Y/Z, incluí el punto de cambio dentro de la ruta (Paso 4).
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {step === 6 ? (
                <View className="gap-4">
                  <View className="gap-2">
                    <Text className="text-sm font-medium text-zinc-600">Autonomia</Text>
                    <Input
                      value={operationalStep.endurance}
                      onChangeText={(value) =>
                        setOperationalStep((prev) => ({
                          ...prev,
                          endurance: value.replace(/\D/g, "").slice(0, 4),
                        }))
                      }
                      placeholder="0230"
                      keyboardType="number-pad"
                      className="h-14 rounded-2xl border-zinc-200"
                    />
                  </View>
                  <View className="gap-2">
                    <Text className="text-sm font-medium text-zinc-600">Personas a bordo</Text>
                    <Input
                      value={operationalStep.persons_on_board}
                      onChangeText={(value) =>
                        setOperationalStep((prev) => ({
                          ...prev,
                          persons_on_board: value.replace(/\D/g, ""),
                        }))
                      }
                      placeholder="2"
                      keyboardType="number-pad"
                      className="h-14 rounded-2xl border-zinc-200"
                    />
                  </View>
                </View>
              ) : null}

              {step === 7 && flightPlan ? (
                <Step7Review
                  flightPlan={flightPlan}
                  step1Data={step1Data}
                  flightRules={flightRules}
                  flightType={flightType}
                  flightStep={{
                    cruising_speed: flightStep.cruising_speed,
                    cruising_level: flightStep.cruising_level,
                    route: flightStep.route,
                    total_eet: flightStep.total_eet,
                  }}
                  operationalStep={operationalStep}
                  otherInformation={otherInformation}
                  onOtherInformationChange={setOtherInformation}
                />
              ) : null}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View
        style={{ paddingBottom: insets.bottom + 24 }}
        className="flex-row items-center gap-3 px-6 pt-2"
      >
        {step === 1 && step1SubStep === 0 ? (
          <Button
            className="h-14 flex-1"
            onPress={handleForward}
            disabled={isSaving || !canGoForward}
          >
            <Text>{isSaving ? "Guardando..." : "Seguir"}</Text>
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="h-14 w-14 rounded-full"
              onPress={handleBack}
              disabled={isSaving}
            >
              <ChevronLeft size={24} color="#3f3f46" />
            </Button>
            <Button
              className="h-14 flex-1"
              onPress={handleForward}
              disabled={isSaving || !canGoForward}
            >
              <Text>{isSaving ? "Guardando..." : "Seguir"}</Text>
            </Button>
          </>
        )}
      </View>

      <AircraftFplConfirmSheet
        visible={aircraftSheetOpen}
        flightPlan={flightPlan}
        aircraft={aircraft.find((item) => item.id === selectedAircraftId) ?? null}
        fields={aircraftFplFields}
        isSaving={isSaving}
        error={aircraftSheetOpen ? error : null}
        onChange={(patch) => setAircraftFplFields((prev) => ({ ...prev, ...patch }))}
        onClose={() => {
          setAircraftSheetOpen(false);
          setError(null);
        }}
        onConfirm={() => void confirmAircraftStep()}
      />

      <FplSubmitResultSheet
        visible={submitSheet.visible}
        phase={submitSheet.phase}
        status={submitSheet.status}
        errorMessage={submitSheet.errorMessage}
        onRetry={() => void submitCurrentFlightPlan()}
        onGoHome={handleGoHome}
        onClose={closeSubmitSheet}
      />
    </View>
  );
}
