import { Stack } from "expo-router"
import { AuthProvider } from "../context/AuthContext"
import { StatusBar } from "expo-status-bar"
import { useFonts } from "expo-font"
import { Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold } from "@expo-google-fonts/outfit"
import * as SplashScreen from "expo-splash-screen"
import { useEffect } from "react"

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
  })

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#111216" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontFamily: "Outfit_600SemiBold" },
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
