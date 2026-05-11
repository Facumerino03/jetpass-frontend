import { ScrollView, View } from "react-native";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/features/auth/auth-context";

export function HomeScreen() {
  const { logout, user } = useAuth();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="min-h-full justify-center gap-6 px-6 py-10"
      contentInsetAdjustmentBehavior="automatic"
    >
      <View className="gap-2">
        <Text variant="h1" className="text-left text-4xl">
          JetPass
        </Text>
        <Text variant="lead" className="text-base">
          Home principal
        </Text>
      </View>

      <Card className="border-primary/10 bg-card">
        <CardHeader>
          <CardTitle>Sesion activa</CardTitle>
          <CardDescription>
            {user
              ? `${user.first_name} ${user.last_name}`
              : "Usuario autenticado"}
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-2">
          <Text variant="muted">
            {user?.email ?? "El contenido principal se disenara despues."}
          </Text>
          <Text className="rounded-md bg-secondary px-3 py-2 text-secondary-foreground">
            El home queda vacio por ahora para trabajar el diseno mas adelante.
          </Text>
        </CardContent>
        <CardFooter>
          <Button className="w-full" variant="outline" onPress={logout}>
            <Text>Cerrar sesion</Text>
          </Button>
        </CardFooter>
      </Card>
    </ScrollView>
  );
}
