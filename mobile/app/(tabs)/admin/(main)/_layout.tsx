import { Tabs } from "expo-router"
import { useTheme } from "react-native-paper"
import {
  CalendarDaysIcon,
  UsersIcon,
  BarChartIcon,
  SettingsIcon,
} from "lucide-react-native"

export default function AdminTabsLayout() {
  const { colors } = useTheme()

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
        name="calendar"
        options={{
          title: "Calendário",
          tabBarLabel: "Início",
          tabBarIcon: ({ color, size }) => (
            <CalendarDaysIcon size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: "Clientes",
          tabBarIcon: ({ color, size }) => (
            <UsersIcon size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Estatísticas",
          tabBarIcon: ({ color, size }) => (
            <BarChartIcon size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Definições",
          tabBarIcon: ({ color, size }) => (
            <SettingsIcon size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
