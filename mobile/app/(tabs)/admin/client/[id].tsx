import { useEffect, useState } from "react"
import { View, Text, ScrollView, StyleSheet } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { ActivityIndicator, Surface, Divider } from "react-native-paper"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { trpc } from "../../../../lib/trpc"
import { BookingCard } from "../../../../components/BookingCard"

export default function AdminClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    trpc.client.getById
      .query({ id })
      .then((c) => setClient(c))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#18B549" />
      </View>
    )
  }

  if (!client) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Cliente não encontrado.</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Client info */}
      <Surface style={styles.card} elevation={0}>
        <Text style={styles.label}>Informação</Text>
        <Divider style={styles.divider} />
        <Text style={styles.name}>{client.name}</Text>
        {client.email && <Text style={styles.detail}>{client.email}</Text>}
        {client.phone && <Text style={styles.detail}>{client.phone}</Text>}
        {client.notes && (
          <Text style={[styles.detail, { marginTop: 6, fontStyle: "italic" }]}>
            {client.notes}
          </Text>
        )}
        <Text style={[styles.detail, { marginTop: 6 }]}>
          Registado em{" "}
          {format(new Date(client.createdAt), "d 'de' MMMM 'de' yyyy", { locale: pt })}
        </Text>
      </Surface>

      {/* Booking history */}
      <Text style={styles.sectionTitle}>
        Histórico de marcações ({client.bookings.length})
      </Text>

      {client.bookings.length === 0 ? (
        <Text style={styles.muted}>Sem marcações registadas.</Text>
      ) : (
        <View style={{ gap: 10 }}>
          {client.bookings.map((b: any) => {
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
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/admin/booking/[id]",
                    params: { id: b.id },
                  })
                }
                dimIfPast={true}
              />
            )
          })}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#111216" },
  scroll: { flex: 1, backgroundColor: "#111216" },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  muted: { color: "#9ca3af", fontFamily: "Outfit_400Regular", fontSize: 14 },
  card: {
    backgroundColor: "#17191f",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2d35",
    padding: 16,
    gap: 4,
  },
  label: { color: "#6b7280", fontFamily: "Outfit_600SemiBold", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 },
  divider: { backgroundColor: "#2a2d35", marginVertical: 8 },
  name: { color: "#fff", fontFamily: "Outfit_700Bold", fontSize: 20 },
  detail: { color: "#9ca3af", fontFamily: "Outfit_400Regular", fontSize: 13 },
  sectionTitle: { color: "#fff", fontFamily: "Outfit_700Bold", fontSize: 16 },
})
