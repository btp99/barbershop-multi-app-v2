import { useEffect, useState } from "react"
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { trpc } from "../../lib/trpc"
import { format } from "date-fns"
import { pt } from "date-fns/locale"

function minutesToTime(mins: number) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

interface Slot { time: string; available: boolean }

export default function BookingConfirmScreen() {
  const { barbershopId, serviceId } = useLocalSearchParams<{ barbershopId: string; serviceId: string }>()
  const [service, setService] = useState<{ name: string; duration: number } | null>(null)
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [booking, setBooking] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (barbershopId) {
      trpc.barbershop.getById.query({ id: barbershopId }).then((bs) => {
        const svc = bs?.services.find((s) => s.id === serviceId)
        if (svc) setService({ name: svc.name, duration: svc.duration })
      })
    }
  }, [barbershopId, serviceId])

  useEffect(() => {
    if (!service) return
    setSlotsLoading(true)
    setSelectedSlot(null)
    trpc.slots.getSlots.query({ date, duration: service.duration }).then((r) => {
      setSlots(r.slots)
      setSlotsLoading(false)
    })
  }, [date, service])

  const today = new Date().toISOString().split("T")[0]

  const changeDate = (delta: number) => {
    const d = new Date(date + "T00:00:00")
    d.setDate(d.getDate() + delta)
    const next = d.toISOString().split("T")[0]
    if (next >= today) setDate(next)
  }

  const handleBook = async () => {
    if (!selectedSlot || !service) return
    setBooking(true)
    try {
      const start = timeToMinutes(selectedSlot)
      const end = start + service.duration
      await trpc.booking.create.mutate({
        date: new Date(date),
        services: [{ serviceId: serviceId!, startTime: selectedSlot, endTime: minutesToTime(end) }],
      })
      Alert.alert("Agendamento confirmado!", "O teu agendamento foi realizado com sucesso.", [
        { text: "OK", onPress: () => router.push("/(tabs)/bookings") },
      ])
    } catch {
      Alert.alert("Erro", "Não foi possível realizar o agendamento. Tenta novamente.")
    } finally {
      setBooking(false)
    }
  }

  if (!service) {
    return <View style={styles.center}><ActivityIndicator color="#18B549" /></View>
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{service.name}</Text>

      {/* Date picker */}
      <View style={styles.section}>
        <Text style={styles.label}>Data</Text>
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.arrow} onPress={() => changeDate(-1)} disabled={date === today}>
            <Text style={[styles.arrowText, date === today && styles.disabled]}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.dateText}>
            {format(new Date(date + "T00:00:00"), "EEEE, d 'de' MMMM", { locale: pt })}
          </Text>
          <TouchableOpacity style={styles.arrow} onPress={() => changeDate(1)}>
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Slots */}
      <View style={styles.section}>
        <Text style={styles.label}>Horário</Text>
        {slotsLoading ? (
          <ActivityIndicator color="#18B549" style={{ marginTop: 16 }} />
        ) : slots.length === 0 ? (
          <Text style={styles.empty}>Sem horários disponíveis.</Text>
        ) : (
          <View style={styles.grid}>
            {slots.map((slot) => (
              <TouchableOpacity
                key={slot.time}
                disabled={!slot.available}
                onPress={() => setSelectedSlot(slot.time)}
                style={[
                  styles.slot,
                  !slot.available && styles.slotDisabled,
                  selectedSlot === slot.time && styles.slotSelected,
                ]}
              >
                <Text style={[styles.slotText, !slot.available && styles.slotTextDisabled, selectedSlot === slot.time && styles.slotTextSelected]}>
                  {slot.time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {selectedSlot && (
        <TouchableOpacity style={styles.bookBtn} onPress={() => void handleBook()} disabled={booking}>
          {booking ? <ActivityIndicator color="#fff" /> : <Text style={styles.bookBtnText}>Confirmar agendamento</Text>}
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  content: { padding: 20 },
  title: { color: "#fff", fontWeight: "bold", fontSize: 22, marginBottom: 20 },
  section: { marginBottom: 24 },
  label: { color: "#9ca3af", fontSize: 13, fontWeight: "500", marginBottom: 10 },
  dateRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1c1f26", borderRadius: 10, padding: 12 },
  arrow: { padding: 4 },
  arrowText: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  disabled: { color: "#4b5563" },
  dateText: { color: "#fff", fontWeight: "600", fontSize: 14, textTransform: "capitalize" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slot: { width: "22%", borderWidth: 1, borderColor: "#2a2d35", borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  slotDisabled: { opacity: 0.3 },
  slotSelected: { backgroundColor: "#18B549", borderColor: "#18B549" },
  slotText: { color: "#fff", fontSize: 12, fontWeight: "500" },
  slotTextDisabled: { color: "#6b7280" },
  slotTextSelected: { color: "#fff" },
  bookBtn: { backgroundColor: "#18B549", borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  bookBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  empty: { color: "#6b7280", fontSize: 13 },
})
