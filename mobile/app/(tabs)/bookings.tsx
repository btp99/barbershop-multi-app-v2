import { useState, useCallback } from "react"
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native"
import { useRouter, useFocusEffect } from "expo-router"
import { ActivityIndicator, Button, SegmentedButtons } from "react-native-paper"
import { trpc } from "../../lib/trpc"
import { useAuth } from "../../context/AuthContext"
import { BookingCard } from "../../components/BookingCard"

type Tab = "confirmed" | "concluded"

interface BookingService {
  id: string
  service: { name: string }
}

interface Booking {
  id: string
  date: string
  startTime: string
  endTime: string
  status: string
  services: BookingService[]
}

export default function BookingsScreen() {
  const { token } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("confirmed")
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!token) { setLoading(false); return }
    setLoading(true)
    try {
      const data = await trpc.booking.getUserBookings.query({ type: tab })
      setBookings(data as Booking[])
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(useCallback(() => { void load() }, [token, tab]))

  const handleCancel = (bookingId: string) => {
    Alert.alert("Cancelar marcação", "Tens a certeza de que pretendes cancelar?", [
      { text: "Não", style: "cancel" },
      {
        text: "Sim, cancelar",
        style: "destructive",
        onPress: async () => {
          try {
            await trpc.booking.delete.mutate({ bookingId })
            await load()
          } catch {
            Alert.alert("Erro", "Não foi possível cancelar a marcação.")
          }
        },
      },
    ])
  }

  if (!token) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>As tuas marcações</Text>
        <Text style={styles.sub}>Inicia sessão para veres as tuas marcações.</Text>
        <Button mode="contained" onPress={() => router.push("/sign-in")} style={{ marginTop: 16 }}>
          Entrar
        </Button>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={tab}
        onValueChange={(v) => setTab(v as Tab)}
        style={styles.tabs}
        buttons={[
          { value: "confirmed", label: "Próximas" },
          { value: "concluded", label: "Passadas" },
        ]}
        theme={{ colors: { secondaryContainer: "rgba(24,181,73,0.2)" } }}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#18B549" />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <BookingCard
              id={item.id}
              date={item.date}
              startTime={item.startTime}
              endTime={item.endTime}
              status={item.status}
              services={item.services}
              onCancel={() => handleCancel(item.id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {tab === "confirmed" ? "Sem marcações próximas" : "Sem marcações passadas"}
              </Text>
              <Text style={styles.sub}>
                {tab === "confirmed"
                  ? "Vai ao início e agenda o teu próximo corte."
                  : "As tuas marcações concluídas aparecerão aqui."}
              </Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111216" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#111216",
  },
  tabs: { margin: 16, marginBottom: 8 },
  list: { padding: 16, gap: 12, flexGrow: 1 },
  title: { color: "#fff", fontFamily: "Outfit_700Bold", fontSize: 22, marginBottom: 8 },
  sub: {
    color: "#9ca3af",
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    textAlign: "center",
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { color: "#fff", fontFamily: "Outfit_600SemiBold", fontSize: 17 },
})
