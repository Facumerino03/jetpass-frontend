import * as React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/features/auth/auth-context";
import { getErrorMessage } from "@/lib/api";

type AuthMode = "login" | "register";

const INITIAL_FORM = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
};

function validateForm(mode: AuthMode, form: typeof INITIAL_FORM) {
  if (!form.email.trim() || !form.password) {
    return "Ingresa email y contrasena.";
  }

  if (mode === "register") {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      return "Ingresa nombre y apellido.";
    }

    if (form.password.length < 8) {
      return "La contrasena debe tener al menos 8 caracteres.";
    }
  }

  return null;
}

export function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = React.useState<AuthMode>("login");
  const [form, setForm] = React.useState(INITIAL_FORM);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isRegister = mode === "register";

  function updateField(field: keyof typeof INITIAL_FORM, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
  }

  async function handleSubmit() {
    const validationError = validateForm(mode, form);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isRegister) {
        await register({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          phone: form.phone.trim() || null,
        });
      } else {
        await login({
          email: form.email.trim().toLowerCase(),
          password: form.password,
        });
      }
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="min-h-full justify-center px-6 py-10"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mx-auto w-full max-w-sm gap-6">
          <View className="gap-2">
            <Text variant="h1" className="text-left text-4xl">
              JetPass
            </Text>
            <Text variant="lead" className="text-base">
              Acceso simple para pilotos.
            </Text>
          </View>

          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle>
                {isRegister ? "Crear cuenta" : "Iniciar sesion"}
              </CardTitle>
              <CardDescription>
                {isRegister
                  ? "Registra tu cuenta piloto para continuar."
                  : "Ingresa con tu cuenta para continuar."}
              </CardDescription>
            </CardHeader>

            <CardContent className="gap-4">
              <View className="flex-row rounded-lg bg-muted p-1">
                <Button
                  className="flex-1"
                  size="sm"
                  variant={!isRegister ? "default" : "ghost"}
                  onPress={() => switchMode("login")}
                >
                  <Text>Login</Text>
                </Button>
                <Button
                  className="flex-1"
                  size="sm"
                  variant={isRegister ? "default" : "ghost"}
                  onPress={() => switchMode("register")}
                >
                  <Text>Register</Text>
                </Button>
              </View>

              {isRegister ? (
                <View className="gap-2">
                  <Label>Nombre</Label>
                  <Input
                    value={form.firstName}
                    onChangeText={(value) => updateField("firstName", value)}
                    autoCapitalize="words"
                    autoComplete="given-name"
                  />
                </View>
              ) : null}

              {isRegister ? (
                <View className="gap-2">
                  <Label>Apellido</Label>
                  <Input
                    value={form.lastName}
                    onChangeText={(value) => updateField("lastName", value)}
                    autoCapitalize="words"
                    autoComplete="family-name"
                  />
                </View>
              ) : null}

              <View className="gap-2">
                <Label>Email</Label>
                <Input
                  value={form.email}
                  onChangeText={(value) => updateField("email", value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholder="piloto@jetpass.com"
                />
              </View>

              <View className="gap-2">
                <Label>Contrasena</Label>
                <Input
                  value={form.password}
                  onChangeText={(value) => updateField("password", value)}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete={isRegister ? "new-password" : "password"}
                  placeholder={
                    isRegister ? "Minimo 8 caracteres" : "Tu contrasena"
                  }
                />
              </View>

              {isRegister ? (
                <View className="gap-2">
                  <Label>Telefono opcional</Label>
                  <Input
                    value={form.phone}
                    onChangeText={(value) => updateField("phone", value)}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                  />
                </View>
              ) : null}

              {error ? (
                <Text className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </Text>
              ) : null}
            </CardContent>

            <CardFooter className="flex-col gap-3">
              <Button
                className="w-full"
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text>
                  {isSubmitting
                    ? "Enviando..."
                    : isRegister
                      ? "Crear cuenta"
                      : "Ingresar"}
                </Text>
              </Button>
            </CardFooter>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
