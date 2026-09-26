import { useEffect } from "react"
import { Stack, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { PaperProvider } from "react-native-paper"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { useFonts } from "expo-font"
import {
  Outfit_400Regular,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from "@expo-google-fonts/outfit"
import * as SplashScreen from "expo-splash-screen"
import { AuthProvider, useAuth } from "../context/AuthContext"
import { theme } from "../theme"

SplashScreen.preventAutoHideAsync()

function NavigationGuard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (user && !user.phone) {
      router.replace("/complete-profile")
    }
  }, [isLoading, user])

  return null
}

function RootStack() {
  return (
    <>
      <NavigationGuard />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#111216" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontFamily: "Outfit_600SemiBold" },
          contentStyle: { backgroundColor: "#111216" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="booking"
          options={{ title: "Escolher horário", presentation: "card" }}
        />
        <Stack.Screen name="sign-in" options={{ title: "Entrar" }} />
        <Stack.Screen name="sign-up" options={{ title: "Criar conta" }} />
        <Stack.Screen
          name="complete-profile"
          options={{ title: "Completa o teu perfil", headerBackVisible: false }}
        />
      </Stack>
    </>
  )
}

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <StatusBar style="light" />
          <RootStack />
        </AuthProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  )
}
