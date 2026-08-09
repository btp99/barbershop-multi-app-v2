import { Stack } from "expo-router"
import { AuthProvider } from "../context/AuthContext"
import { StatusBar } from "expo-status-bar"

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#111216" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle: { backgroundColor: "#111216" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="barbershop/[id]" options={{ title: "Barbearia" }} />
        <Stack.Screen name="booking/confirm" options={{ title: "Confirmar agendamento" }} />
      </Stack>
    </AuthProvider>
  )
}
