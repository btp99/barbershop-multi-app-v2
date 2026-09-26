import { Redirect } from "expo-router"
import { Stack } from "expo-router"
import { useAuth } from "../../../context/AuthContext"
import { View, ActivityIndicator } from "react-native"

export default function AdminLayout() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#111216" }}>
        <ActivityIndicator color="#18B549" />
      </View>
    )
  }

  if (!user?.isAdmin) {
    return <Redirect href="/(tabs)" />
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#111216" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontFamily: "Outfit_600SemiBold" },
        contentStyle: { backgroundColor: "#111216" },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(main)" options={{ headerShown: false }} />
      <Stack.Screen name="booking/new" options={{ title: "Nova Marcação" }} />
      <Stack.Screen name="booking/[id]" options={{ title: "Marcação" }} />
      <Stack.Screen name="client/[id]" options={{ title: "Cliente" }} />
      <Stack.Screen name="services" options={{ title: "Serviços" }} />
      <Stack.Screen name="hours" options={{ title: "Horário" }} />
      <Stack.Screen name="shop" options={{ title: "Barbearia" }} />
    </Stack>
  )
}
