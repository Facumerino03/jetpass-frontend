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

export function HomeScreen() {
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="min-h-full justify-center gap-6 px-6 py-10"
      contentInsetAdjustmentBehavior="automatic"
    >
      <View className="gap-3">
        <Text variant="h1" className="text-left text-4xl">
          JetPass
        </Text>
        <Text variant="lead" className="text-base">
          Proyecto inicial con Expo SDK 55, NativeWind v4 y React Native Reusables.
        </Text>
      </View>

      <Card className="border-primary/10 bg-card">
        <CardHeader>
          <CardTitle>Setup listo</CardTitle>
          <CardDescription>
            Esta tarjeta y el boton vienen de React Native Reusables.
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-2">
          <Text className="rounded-md bg-secondary px-3 py-2 text-secondary-foreground">
            Si ves estilos, NativeWind esta funcionando.
          </Text>
          <Text variant="muted">Estructura basada en `src/app` y pantallas en `src/screens`.</Text>
        </CardContent>
        <CardFooter>
          <Button className="w-full">
            <Text>Continuar</Text>
          </Button>
        </CardFooter>
      </Card>
    </ScrollView>
  );
}
