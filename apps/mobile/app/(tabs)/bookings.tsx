import { useEffect, useState, useCallback } from "react"
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from "react-native"
import { useFocusEffect } from "expo-router"
import { trpc } from "../../lib/trpc"
import { useAuth } from "../../context/AuthContext"
import { format } from "date-fns"
import { pt } from "date-fns/locale"

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
  const { token, signIn } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  const loadBookings = async () => {
    if (!token) { setLoading(false); return }
    setLoading(true)
    try {
      const [confirmed, concluded] = await Promise.all([
        trpc.booking.getUserBookings.query({ type: "confirmed" }),
        trpc.booking.getUserBookings.query({ type: "concluded" }),
      ])
      setBookings([...(confirmed as Booking[]), ...(concluded as Booking[])])
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(useCallback(() => { void loadBookings() }, [token]))

  const handleCancel = (bookingId: string) => {
    Alert.alert("Cancelar agendamento", "Tens a certeza?", [
      { text: "Não", style: "cancel" },
      {
        text: "Sim, cancelar",
        style: "destructive",
        onPress: async () => {
          try {
            await trpc.booking.delete.mutate({ bookingId })
            await loadBookings()
          } catch {
            Alert.alert("Erro", "Não foi possível cancelar o agendamento.")
          }
        },
      },
    ])
  }

  if (!token) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Inicia sessão para veres os teus agendamentos</Text>
        <TouchableOpacity style={styles.btn} onPress={() => void signIn()}>
          <Text style={styles.btnText}>Iniciar sessão com Google</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#18B549" /></View>
  }

  return (
    <FlatList
      data={bookings}
      keyExtractor={(b) => b.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const isPast = item.status !== "CONFIRMED"
        return (
          <View style={[styles.card, isPast && styles.cardDim]}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.dateText}>
                  {format(new Date(item.date), "EEEE, d 'de' MMMM", { locale: pt })}
                </Text>
                <Text style={styles.timeText}>{item.startTime} – {item.endTime}</Text>
              </View>
              <View style={[styles.badge, isPast ? styles.badgeDim : styles.badgeActive]}>
                <Text style={[styles.badgeText, isPast ? styles.badgeTextDim : styles.badgeTextActive]}>
                  {item.status === "COMPLETED" ? "Concluído" : item.status === "CANCELLED" ? "Cancelado" : "Confirmado"}
                </Text>
              </View>
            </View>
            {item.services.map((bs) => (
              <Text key={bs.id} style={styles.serviceName}>{bs.service.name}</Text>
            ))}
            {!isPast && (
              <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item.id)}>
                <Text style={styles.cancelText}>Cancelar agendamento</Text>
              </TouchableOpacity>
            )}
          </View>
        )
      }}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Nenhum agendamento</Text>
          <Text style={styles.empty}>Ainda não tens agendamentos.</Text>
        </View>
      }
    />
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#111216" },
  list: { padding: 16, gap: 12, backgroundColor: "#111216", flexGrow: 1 },
  card: { backgroundColor: "#1c1f26", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#2a2d35" },
  cardDim: { opacity: 0.6 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  dateText: { color: "#9ca3af", fontSize: 12, textTransform: "capitalize" },
  timeText: { color: "#fff", fontWeight: "bold", fontSize: 16, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  badgeActive: { backgroundColor: "rgba(24,181,73,0.15)" },
  badgeDim: { backgroundColor: "rgba(107,114,128,0.15)" },
  badgeText: { fontSize: 11, fontWeight: "600" },
  badgeTextActive: { color: "#18B549" },
  badgeTextDim: { color: "#6b7280" },
  serviceName: { color: "#9ca3af", fontSize: 13, marginTop: 2 },
  cancelBtn: { marginTop: 12, borderWidth: 1, borderColor: "rgba(239,68,68,0.4)", borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  cancelText: { color: "#ef4444", fontSize: 13, fontWeight: "600" },
  emptyTitle: { color: "#fff", fontWeight: "bold", fontSize: 18, marginBottom: 8, textAlign: "center" },
  empty: { color: "#6b7280", textAlign: "center" },
  btn: { marginTop: 16, backgroundColor: "#18B549", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  btnText: { color: "#fff", fontWeight: "bold" },
})
