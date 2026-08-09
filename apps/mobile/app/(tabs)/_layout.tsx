import { Tabs } from "expo-router"
import { ScissorsIcon, CalendarIcon, UserIcon } from "lucide-react-native"

export default function TabsLayout() {
  return (
    <Tabs
      sceneContainerStyle={{ backgroundColor: "#111216" }}
      screenOptions={{
        headerStyle: { backgroundColor: "#111216" },
        headerTintColor: "#fff",
        tabBarStyle: { backgroundColor: "#111216", borderTopColor: "#2a2d35" },
        tabBarActiveTintColor: "#18B549",
        tabBarInactiveTintColor: "#6b7280",
        contentStyle: { backgroundColor: "#111216" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Barbearia",
          tabBarIcon: ({ color, size }) => <ScissorsIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Agendamentos",
          tabBarIcon: ({ color, size }) => <CalendarIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => <UserIcon color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}
