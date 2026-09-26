import { Tabs } from "expo-router"
import { useTheme } from "react-native-paper"
import {
  HomeIcon,
  CalendarDaysIcon,
  UserIcon,
  ShieldCheckIcon,
} from "lucide-react-native"
import { useAuth } from "../../context/AuthContext"

export default function TabsLayout() {
  const { colors } = useTheme()
  const { user, isLoading } = useAuth()

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "#111216",
          borderTopColor: "#2a2d35",
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "#6b7280",
        tabBarLabelStyle: {
          fontFamily: "Outfit_400Regular",
          fontSize: 11,
        },
        headerStyle: { backgroundColor: "#111216" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontFamily: "Outfit_600SemiBold" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color, size }) => (
            <HomeIcon size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Marcações",
          tabBarIcon: ({ color, size }) => (
            <CalendarDaysIcon size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <UserIcon size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          href: !isLoading && user?.isAdmin ? undefined : null,
          title: "Admin",
          tabBarIcon: ({ color, size }) => (
            <ShieldCheckIcon size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
    </Tabs>
  )
}
