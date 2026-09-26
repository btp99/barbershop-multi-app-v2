import { useEffect, useState } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { ActivityIndicator, Button, Surface, Divider } from "react-native-paper"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { trpc } from "../../../../lib/trpc"
import { StatusBadge } from "../../../../components/StatusBadge"

function formatPrice(price: number | string) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(Number(price))
}
function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export default function AdminBookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [booking, setBooking] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  const load = () => {
    if (!id) return
    setLoading(true)
    trpc.admin.getBookingById
      .query({ bookingId: id })
      .then((b) => setBooking(b))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const handleCancel = () => {
    Alert.alert("Cancelar marcação", "Tens a certeza?", [
      { text: "Não", style: "cancel" },
      {
        text: "Cancelar marcação",
        style: "destructive",
        onPress: async () => {
          setActing(true)
          try {
            await trpc.admin.cancelBooking.mutate({ bookingId: id! })
            load()
          } catch {
            Alert.alert("Erro", "Não foi possível cancelar.")
          } finally {
            setActing(false)
          }
        },
      },
    ])
  }

  const handleComplete = () => {
    Alert.alert("Marcar como concluída", "Marcar esta marcação como concluída?", [
      { text: "Não", style: "cancel" },
      {
        text: "Concluir",
        onPress: async () => {
          setActing(true)
          try {
            await trpc.admin.completeBooking.mutate({ bookingId: id! })
            load()
          } catch {
            Alert.alert("Erro", "Não foi possível concluir.")
          } finally {
            setActing(false)
          }
        },
      },
    ])
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#18B549" />
      </View>
    )
  }

  if (!booking) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Marcação não encontrada.</Text>
      </View>
    )
  }

  const clientName = booking.client?.name ?? booking.user?.name ?? "Cliente sem nome"
  const clientEmail = booking.client?.email ?? booking.user?.email ?? null
  const clientPhone = booking.client?.phone ?? null
  const totalPrice = booking.services.reduce(
    (s: number, bs: any) => s + Number(bs.service.price),
    0
  )

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Status + date */}
      <Surface style={styles.card} elevation={0}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.dateText}>
              {format(new Date(booking.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt })}
            </Text>
            <Text style={styles.timeText}>
              {booking.startTime} – {booking.endTime}
            </Text>
          </View>
          <StatusBadge status={booking.status} />
        </View>
      </Surface>

      {/* Client info */}
      <Surface style={styles.card} elevation={0}>
        <Text style={styles.label}>Cliente</Text>
        <Divider style={styles.divider} />
        <Text style={styles.clientName}>{clientName}</Text>
        {clientEmail && <Text style={styles.clientDetail}>{clientEmail}</Text>}
        {clientPhone && <Text style={styles.clientDetail}>{clientPhone}</Text>}
        {booking.client && (
          <Button
            mode="text"
            onPress={() =>
              router.push({
                pathname: "/(tabs)/admin/client/[id]",
                params: { id: booking.client.id },
              })
            }
            style={{ alignSelf: "flex-start", marginTop: 4 }}
            textColor="#18B549"
          >
            Ver ficha do cliente
          </Button>
        )}
      </Surface>

      {/* Services */}
      <Surface style={styles.card} elevation={0}>
        <Text style={styles.label}>Serviços</Text>
        <Divider style={styles.divider} />
        {booking.services.map((bs: any) => (
          <View key={bs.id} style={styles.serviceRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceName}>{bs.service.name}</Text>
              <Text style={styles.serviceMeta}>
                {bs.startTime} – {bs.endTime} · {formatDuration(bs.service.duration)}
              </Text>
            </View>
            <Text style={styles.price}>{formatPrice(bs.service.price)}</Text>
          </View>
        ))}
        <Divider style={[styles.divider, { marginTop: 8 }]} />
        <View style={[styles.row, { marginTop: 8 }]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>{formatPrice(totalPrice)}</Text>
        </View>
      </Surface>

      {/* Notes */}
      {(booking.note || booking.clientMessage) && (
        <Surface style={styles.card} elevation={0}>
          <Text style={styles.label}>Notas</Text>
          <Divider style={styles.divider} />
          {booking.note && (
            <Text style={styles.noteText}><Text style={{ color: "#9ca3af" }}>Admin: </Text>{booking.note}</Text>
          )}
          {booking.clientMessage && (
            <Text style={styles.noteText}><Text style={{ color: "#9ca3af" }}>Cliente: </Text>{booking.clientMessage}</Text>
          )}
        </Surface>
      )}

      {/* Actions */}
      {booking.status === "CONFIRMED" && (
        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={handleComplete}
            loading={acting}
            style={[styles.actionBtn, { flex: 1 }]}
          >
            Concluir
          </Button>
          <Button
            mode="outlined"
            onPress={handleCancel}
            loading={acting}
            style={[styles.actionBtn, { flex: 1 }]}
            textColor="#ef4444"
            buttonColor="transparent"
          >
            Cancelar
          </Button>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#111216" },
  scroll: { flex: 1, backgroundColor: "#111216" },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  muted: { color: "#9ca3af", fontFamily: "Outfit_400Regular", fontSize: 14 },
  card: {
    backgroundColor: "#17191f",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2d35",
    padding: 16,
    gap: 8,
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dateText: {
    color: "#9ca3af",
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
    textTransform: "capitalize",
  },
  timeText: { color: "#fff", fontFamily: "Outfit_700Bold", fontSize: 20, marginTop: 2 },
  label: { color: "#6b7280", fontFamily: "Outfit_600SemiBold", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 },
  divider: { backgroundColor: "#2a2d35" },
  clientName: { color: "#fff", fontFamily: "Outfit_600SemiBold", fontSize: 16 },
  clientDetail: { color: "#9ca3af", fontFamily: "Outfit_400Regular", fontSize: 13 },
  serviceRow: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  serviceName: { color: "#fff", fontFamily: "Outfit_600SemiBold", fontSize: 14 },
  serviceMeta: { color: "#9ca3af", fontFamily: "Outfit_400Regular", fontSize: 12, marginTop: 1 },
  price: { color: "#18B549", fontFamily: "Outfit_700Bold", fontSize: 14 },
  totalLabel: { color: "#9ca3af", fontFamily: "Outfit_400Regular", fontSize: 14 },
  totalPrice: { color: "#fff", fontFamily: "Outfit_700Bold", fontSize: 16 },
  noteText: { color: "#fff", fontFamily: "Outfit_400Regular", fontSize: 13, lineHeight: 19 },
  actions: { flexDirection: "row", gap: 10 },
  actionBtn: { borderRadius: 10 },
})
