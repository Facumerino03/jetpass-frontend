import * as React from "react";
import { ActivityIndicator, Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertTriangle, Check, Send } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { FPL_STATUS_LABELS, type FlightPlanStatus } from "./types";

export type FplSubmitSheetPhase = "submitting" | "success" | "error";

type FplSubmitResultSheetProps = {
  visible: boolean;
  phase: FplSubmitSheetPhase;
  status?: FlightPlanStatus | null;
  errorMessage?: string | null;
  onRetry: () => void;
  onGoHome: () => void;
  onClose: () => void;
};

function successCopy(status: FlightPlanStatus | null | undefined): {
  title: string;
  description: string;
} {
  switch (status) {
    case "pending_approval":
      return {
        title: "Plan enviado",
        description:
          "Tu plan de vuelo fue enviado correctamente y queda pendiente de aprobación.",
      };
    case "filed":
      return {
        title: "Plan presentado",
        description: "Tu plan de vuelo fue presentado correctamente.",
      };
    case "accepted":
      return {
        title: "Plan aceptado",
        description: "Tu plan de vuelo fue aceptado.",
      };
    default:
      return {
        title: "Plan enviado",
        description: status
          ? `Tu plan de vuelo fue enviado. Estado: ${FPL_STATUS_LABELS[status] ?? status}.`
          : "Tu plan de vuelo fue enviado correctamente.",
      };
  }
}

export function FplSubmitResultSheet({
  visible,
  phase,
  status,
  errorMessage,
  onRetry,
  onGoHome,
  onClose,
}: FplSubmitResultSheetProps) {
  const insets = useSafeAreaInsets();
  const success = successCopy(status);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={phase === "submitting" ? () => {} : onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable
          className="absolute inset-0 bg-black/40"
          onPress={phase === "submitting" ? undefined : onClose}
        />

        <View
          className="items-center rounded-t-3xl border border-border border-b-0 bg-card px-6 pt-8"
          style={{
            paddingBottom: insets.bottom + 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          {phase === "submitting" ? (
            <>
              <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-sky-50">
                <Send size={36} color="#0ea5e9" strokeWidth={1.75} />
              </View>
              <Text className="text-center text-xl font-bold text-zinc-950">Enviando tu plan</Text>
              <Text className="mt-2 text-center text-sm leading-relaxed text-zinc-600">
                Estamos transmitiendo el plan de vuelo...
              </Text>
              <Button disabled className="mt-8 h-14 w-full rounded-2xl">
                <ActivityIndicator color="#ffffff" />
                <Text className="text-base font-semibold text-primary-foreground">Enviando...</Text>
              </Button>
            </>
          ) : null}

          {phase === "success" ? (
            <>
              <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
                <View className="h-14 w-14 items-center justify-center rounded-full bg-emerald-500">
                  <Check size={28} color="#ffffff" strokeWidth={2.5} />
                </View>
              </View>
              <Text className="text-center text-xl font-bold text-zinc-950">{success.title}</Text>
              <Text className="mt-2 text-center text-sm leading-relaxed text-zinc-600">
                {success.description}
              </Text>
              <Button onPress={onGoHome} className="mt-8 h-14 w-full rounded-2xl">
                <Text className="text-base font-semibold text-primary-foreground">
                  Volver al menú principal
                </Text>
              </Button>
            </>
          ) : null}

          {phase === "error" ? (
            <>
              <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-amber-50">
                <AlertTriangle size={40} color="#d97706" strokeWidth={1.75} />
              </View>
              <Text className="text-center text-xl font-bold text-zinc-950">Hubo un problema</Text>
              <Text className="mt-2 text-center text-sm leading-relaxed text-zinc-600">
                {errorMessage?.trim() ||
                  "No pudimos enviar el plan. Verificá tu conexión e intentá de nuevo."}
              </Text>
              <View className="mt-8 w-full flex-row gap-3">
                <Button
                  variant="outline"
                  onPress={onClose}
                  className="h-14 flex-1 rounded-2xl"
                >
                  <Text className="text-base font-semibold text-foreground">Cerrar</Text>
                </Button>
                <Button onPress={onRetry} className="h-14 flex-1 rounded-2xl">
                  <Text className="text-base font-semibold text-primary-foreground">
                    Reintentar
                  </Text>
                </Button>
              </View>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
