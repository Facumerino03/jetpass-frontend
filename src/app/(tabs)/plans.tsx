import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/features/auth/auth-context";
import { FlightPlanList } from "@/features/flight-plans/flight-plan-list";

export default function PlansScreen() {
  const { session } = useAuth();

  if (!session) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-center text-muted-foreground">Inicia sesion para ver tus planes.</Text>
      </View>
    );
  }

  return <FlightPlanList accessToken={session.access_token} />;
}
