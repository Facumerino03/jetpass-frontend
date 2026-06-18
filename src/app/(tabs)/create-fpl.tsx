import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/features/auth/auth-context";
import { FlightPlanWizard } from "@/features/flight-plans/flight-plan-wizard";

export default function CreateFplScreen() {
  const { session } = useAuth();

  if (!session) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-center text-muted-foreground">Inicia sesion para crear un FPL.</Text>
      </View>
    );
  }

  return <FlightPlanWizard accessToken={session.access_token} />;
}
