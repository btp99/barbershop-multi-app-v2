import { useCallback, useState } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native"
import { useRouter, useFocusEffect } from "expo-router"
import { ActivityIndicator, Surface } from "react-native-paper"
import {
  CalendarIcon,
  UsersIcon,
  ScissorsIcon,
  ClockIcon,
  BarChartIcon,
  SettingsIcon,
  PlusIcon,
} from "lucide-react-native"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { trpc } from "../../../lib/trpc"
import { BookingCard } from "../../../components/BookingCard"

const TODAY = new Date()

export default function AdminDashboard() {
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      trpc.admin.getBookingsForDate
        .query({ date: TODAY })
        .then((data) => setBookings(data))
        .catch(() => {})
        .finally(() => setLoading(false))
    }, [])
  )

  const quickActions = [
    { label: "Calendário", icon: CalendarIcon, route: "/(tabs)/admin/calendar" },
    { label: "Nova Marcação", icon: PlusIcon, route: "/(tabs)/admin/booking/new" },
    { label: "Clientes", icon: UsersIcon, route: "/(tabs)/admin/clients" },
    { label: "Serviços", icon: ScissorsIcon, route: "/(tabs)/admin/services" },
    { label: "Horário", icon: ClockIcon, route: "/(tabs)/admin/hours" },
    { label: "Estatísticas", icon: BarChartIcon, route: "/(tabs)/admin/stats" },
    { label: "Definições", icon: SettingsIcon, route: "/(tabs)/admin/settings" },
  ]

  const confirmedToday = bookings.filter((b) => b.status === "CONFIRMED")
  const completedToday = bookings.filter((b) => b.status === "COMPLETED")

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Date header */}
      <Text style={styles.dateLabel}>
        {format(TODAY, "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt })}
      </Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <Surface style={styles.statCard} elevation={0}>
          <Text style={styles.statNumber}>{bookings.length}</Text>
          <Text style={styles.statLabel}>Marcações hoje</Text>
        </Surface>
        <Surface style={styles.statCard} elevation={0}>
          <Text style={[styles.statNumber, { color: "#18B549" }]}>{confirmedToday.length}</Text>
          <Text style={styles.statLabel}>Confirmadas</Text>
        </Surface>
        <Surface style={styles.statCard} elevation={0}>
          <Text style={[styles.statNumber, { color: "#9ca3af" }]}>{completedToday.length}</Text>
          <Text style={styles.statLabel}>Concluídas</Text>
        </Surface>
      </View>

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>Acções rápidas</Text>
      <View style={styles.actionsGrid}>
        {quickActions.map(({ label, icon: Icon, route }) => (
          <TouchableOpacity
            key={label}
            style={styles.actionCard}
            onPress={() => router.push(route as any)}
            activeOpacity={0.7}
          >
            <Icon size={22} color="#18B549" />
            <Text style={styles.actionLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Today's bookings */}
      <Text style={styles.sectionTitle}>Marcações de hoje</Text>
      {loading ? (
        <ActivityIndicator color="#18B549" />
      ) : bookings.length === 0 ? (
        <Text style={styles.empty}>Sem marcações para hoje.</Text>
      ) : (
        <View style={styles.bookingList}>
          {bookings.map((b) => {
            const clientName = b.client?.name ?? b.user?.name ?? null
            const services = b.services.map((bs: any) => ({
              id: bs.id,
              service: { name: bs.service.name },
            }))
            return (
              <BookingCard
                key={b.id}
                id={b.id}
                date={b.date}
                startTime={b.startTime}
                endTime={b.endTime}
                status={b.status}
                services={services}
                clientName={clientName}
                onPress={() =>
                  router.push({ pathname: "/(tabs)/admin/booking/[id]", params: { id: b.id } })
                }
                dimIfPast={false}
              />
            )
          })}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#111216" },
  content: { padding: 16, gap: 16, paddingBottom: 40 },

  dateLabel: {
    color: "#9ca3af",
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
    textTransform: "capitalize",
  },

  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: "#17191f",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2d35",
    padding: 14,
    alignItems: "center",
  },
  statNumber: { color: "#fff", fontFamily: "Outfit_700Bold", fontSize: 24 },
  statLabel: {
    color: "#9ca3af",
    fontFamily: "Outfit_400Regular",
    fontSize: 11,
    textAlign: "center",
    marginTop: 2,
  },

  sectionTitle: { color: "#fff", fontFamily: "Outfit_700Bold", fontSize: 16 },

  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionCard: {
    width: "30%",
    backgroundColor: "#17191f",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2d35",
    padding: 14,
    alignItems: "center",
    gap: 8,
  },
  actionLabel: {
    color: "#9ca3af",
    fontFamily: "Outfit_400Regular",
    fontSize: 11,
    textAlign: "center",
  },

  bookingList: { gap: 10 },
  empty: { color: "#6b7280", fontFamily: "Outfit_400Regular", fontSize: 14 },
})
