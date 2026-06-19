import * as React from "react";
import { ActivityIndicator, Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SignatureCanvas, { type SignatureViewRef } from "react-native-signature-canvas";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { getErrorMessage } from "@/lib/api";
import {
  getFlightPlanOfficialPdf,
  requestFlightPlanSignaturePresign,
  submitFlightPlan,
  updateFlightPlan,
  uploadFlightPlanSignature,
} from "./flight-plan-api";
import type { FlightPlanSubmitResponse } from "./types";

type FplSignatureSheetProps = {
  visible: boolean;
  flightPlanId: string;
  accessToken: string;
  onClose: () => void;
  onSubmitSuccess: (result: FlightPlanSubmitResponse, officialPdfUrl: string | null) => void;
  onSubmitError: (message: string) => void;
};

export function FplSignatureSheet({
  visible,
  flightPlanId,
  accessToken,
  onClose,
  onSubmitSuccess,
  onSubmitError,
}: FplSignatureSheetProps) {
  const insets = useSafeAreaInsets();
  const signatureRef = React.useRef<SignatureViewRef>(null);

  const [signature, setSignature] = React.useState<string | null>(null);
  const [isEmpty, setIsEmpty] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleOK = React.useCallback((sig: string) => {
    setSignature(sig);
    setIsEmpty(false);
    setError(null);
  }, []);

  const handleEmpty = React.useCallback(() => {
    setSignature(null);
    setIsEmpty(true);
  }, []);

  const handleEnd = React.useCallback(() => {
    signatureRef.current?.readSignature();
  }, []);

  const handleClear = React.useCallback(() => {
    signatureRef.current?.clearSignature();
    setSignature(null);
    setIsEmpty(true);
    setError(null);
  }, []);

  const handleSubmit = React.useCallback(async () => {
    if (!signature) {
      setError("Dibujá tu firma antes de enviar.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const presign = await requestFlightPlanSignaturePresign(accessToken, flightPlanId, "image/png");
      await uploadFlightPlanSignature(presign.upload_url, signature, "image/png");
      await updateFlightPlan(accessToken, flightPlanId, { signature_key: presign.signature_key });
      const result = await submitFlightPlan(accessToken, flightPlanId);
      const pdfResponse = await getFlightPlanOfficialPdf(accessToken, flightPlanId);
      onSubmitSuccess(result, pdfResponse.official_pdf_url);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      onSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [accessToken, flightPlanId, signature, onSubmitSuccess, onSubmitError]);

  const handleClose = React.useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/40" onPress={handleClose} />

        <View
          className="rounded-t-3xl border border-border border-b-0 bg-card px-6 pt-6"
          style={{
            paddingBottom: insets.bottom + 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <Text className="mb-1 text-center text-xl font-bold text-zinc-950">
            Firmá el plan de vuelo
          </Text>
          <Text className="mb-5 text-center text-sm leading-relaxed text-zinc-600">
            Tu firma digital certifica la información del plan de vuelo.
          </Text>

          <View className="mb-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white" style={{ height: 220 }}>
            <SignatureCanvas
              ref={signatureRef}
              onOK={handleOK}
              onEmpty={handleEmpty}
              onEnd={handleEnd}
              onBegin={() => setError(null)}
              imageType="image/png"
              backgroundColor="rgba(255,255,255,0)"
              penColor="#000000"
              minWidth={1}
              maxWidth={2.5}
              style={{ flex: 1 }}
            />
          </View>

          {error ? (
            <Text className="mb-4 text-center text-sm text-red-600">{error}</Text>
          ) : null}

          <View className="gap-3">
            <Button
              onPress={handleSubmit}
              disabled={isEmpty || isSubmitting}
              className="h-14 w-full rounded-2xl"
            >
              {isSubmitting ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator color="#ffffff" />
                  <Text className="text-base font-semibold text-primary-foreground">
                    Enviando...
                  </Text>
                </View>
              ) : (
                <Text className="text-base font-semibold text-primary-foreground">
                  Firmar y enviar
                </Text>
              )}
            </Button>

            <View className="flex-row gap-3">
              <Button
                variant="outline"
                onPress={handleClear}
                disabled={isSubmitting}
                className="h-12 flex-1 rounded-2xl"
              >
                <Text className="text-base font-semibold text-foreground">Limpiar</Text>
              </Button>
              <Button
                variant="ghost"
                onPress={handleClose}
                disabled={isSubmitting}
                className="h-12 flex-1 rounded-2xl"
              >
                <Text className="text-base font-semibold text-zinc-500">Cancelar</Text>
              </Button>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
