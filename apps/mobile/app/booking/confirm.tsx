import { useEffect, useState, useMemo, useRef } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { isBefore, startOfDay, format } from "date-fns"
import { pt } from "date-fns/locale"
import { trpc } from "../../lib/trpc"
import { Calendar } from "../../components/Calendar"
import { formatPrice, formatDuration } from "@barberlab/ui"

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}
function minutesToTime(mins: number) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}
function localDateStr(d: Date) {
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-")
}

interface Slot { time: string; available: boolean }
interface Service { id: string; name: string; duration: number; price: number }

export default function BookingConfirmScreen() {
  const { barbershopId, serviceId } = useLocalSearchParams<{ barbershopId: string; serviceId: string }>()
  const [service, setService] = useState<Service | null>(null)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [closedDays, setClosedDays] = useState<number[]>([])
  const [booking, setBooking] = useState(false)
  const bookingInFlight = useRef(false)
  const router = useRouter()

  // Load service info + closed days
  useEffect(() => {
    if (!barbershopId) return
    void Promise.all([
      trpc.barbershop.getById.query({ id: barbershopId }).then((bs) => {
        const svc = bs?.services.find((s) => s.id === serviceId)
        if (svc) setService({ id: svc.id, name: svc.name, duration: svc.duration, price: Number(svc.price) })
      }),
      trpc.slots.getClosedDays.query().then((d) => setClosedDays(d.closedDaysOfWeek)),
    ])
  }, [barbershopId, serviceId])

  // Load slots whenever date changes
  useEffect(() => {
    if (!date || !service) return
    setSlotsLoading(true)
    setSelectedSlot(null)
    trpc.slots.getSlots
      .query({ date: localDateStr(date), duration: service.duration })
      .then((r) => setSlots(r.slots))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [date, service])

  // Filter out past slots when today is selected
  const availableSlots = useMemo(() => {
    return slots.filter((s) => {
      if (!s.available) return false
      if (date && localDateStr(date) === localDateStr(new Date())) {
        const now = new Date()
        return timeToMinutes(s.time) >= now.getHours() * 60 + now.getMinutes() + 15
      }
      return true
    })
  }, [slots, date])

  // Group by hour, sorted
  const groupedSlots = useMemo(() => {
    const acc: Record<string, Slot[]> = {}
    for (const s of availableSlots) {
      const h = s.time.split(":")[0]
      ;(acc[h] ??= []).push(s)
    }
    return Object.entries(acc).sort(([a], [b]) => parseInt(a) - parseInt(b))
  }, [availableSlots])

  const handleBook = async () => {
    if (!selectedSlot || !service || !date) return
    if (bookingInFlight.current) return
    bookingInFlight.current = true
    setBooking(true)
    try {
      const end = minutesToTime(timeToMinutes(selectedSlot) + service.duration)
      await trpc.booking.create.mutate({
        date,
        services: [{ serviceId: service.id, startTime: selectedSlot, endTime: end }],
      })
      router.replace("/(tabs)/bookings")
    } catch {
      Alert.alert("Erro", "Não foi possível realizar o agendamento. Tenta novamente.")
      bookingInFlight.current = false
      setBooking(false)
    }
  }

  if (!service) {
    return <View style={styles.center}><ActivityIndicator color="#18B549" /></View>
  }

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Service summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.serviceMeta}>
            {formatDuration(service.duration)} · {formatPrice(service.price)}
          </Text>
        </View>

        {/* Calendar */}
        <Text style={styles.sectionLabel}>Escolhe um dia</Text>
        <Calendar
          selected={date}
          onSelect={(d) => {
            setDate(d)
            setSelectedSlot(null)
          }}
          disabled={(d) =>
            isBefore(d, startOfDay(new Date())) || closedDays.includes(d.getDay())
          }
        />

        {/* Time slots */}
        {date && (
          <View style={styles.slotsSection}>
            <Text style={styles.sectionLabel}>
              Horário para{" "}
              <Text style={styles.sectionLabelAccent}>
                {format(date, "d 'de' MMMM", { locale: pt })}
              </Text>
            </Text>

            {slotsLoading ? (
              <ActivityIndicator color="#18B549" style={{ marginTop: 16 }} />
            ) : groupedSlots.length === 0 ? (
              <Text style={styles.empty}>Sem horários disponíveis para este dia.</Text>
            ) : (
              <View style={styles.hourGroups}>
                {groupedSlots.map(([hour, hourSlots]) => (
                  <View key={hour} style={styles.hourGroup}>
                    <Text style={styles.hourLabel}>{parseInt(hour)}h</Text>
                    <View style={styles.slotRow}>
                      {hourSlots.map((s) => (
                        <TouchableOpacity
                          key={s.time}
                          onPress={() => setSelectedSlot(s.time)}
                          style={[
                            styles.slotPill,
                            selectedSlot === s.time && styles.slotPillSelected,
                          ]}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.slotText,
                              selectedSlot === s.time && styles.slotTextSelected,
                            ]}
                          >
                            {s.time}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky confirm footer */}
      {selectedSlot && (
        <View style={styles.footer}>
          <View style={styles.footerInfo}>
            <Text style={styles.footerTime}>{selectedSlot}</Text>
            <Text style={styles.footerDate}>
              {date ? format(date, "EEEE, d 'de' MMMM", { locale: pt }) : ""}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => void handleBook()}
            disabled={booking}
          >
            {booking ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.bookBtnText}>Confirmar</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#111216" },
  scroll: { flex: 1, backgroundColor: "#111216" },
  content: { padding: 16, gap: 16 },

  summaryCard: {
    backgroundColor: "#17191f",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2d35",
    padding: 14,
  },
  serviceName: { color: "#fff", fontFamily: "Outfit_600SemiBold", fontSize: 16 },
  serviceMeta: { color: "#9ca3af", fontFamily: "Outfit_400Regular", fontSize: 13, marginTop: 2 },

  sectionLabel: {
    color: "#9ca3af",
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
    marginBottom: 4,
  },
  sectionLabelAccent: { color: "#fff", fontFamily: "Outfit_600SemiBold" },

  slotsSection: { gap: 8 },
  hourGroups: { gap: 14 },
  hourGroup: { gap: 8 },
  hourLabel: { color: "#6b7280", fontFamily: "Outfit_400Regular", fontSize: 12 },
  slotRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slotPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2d35",
    backgroundColor: "#17191f",
  },
  slotPillSelected: {
    backgroundColor: "#18B549",
    borderColor: "#18B549",
  },
  slotText: { color: "#fff", fontFamily: "Outfit_400Regular", fontSize: 14 },
  slotTextSelected: { fontFamily: "Outfit_600SemiBold" },
  empty: { color: "#6b7280", fontFamily: "Outfit_400Regular", fontSize: 13, marginTop: 8 },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: "#17191f",
    borderTopWidth: 1,
    borderTopColor: "#2a2d35",
  },
  footerInfo: { flex: 1 },
  footerTime: { color: "#fff", fontFamily: "Outfit_700Bold", fontSize: 18 },
  footerDate: {
    color: "#9ca3af",
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
    marginTop: 1,
    textTransform: "capitalize",
  },
  bookBtn: {
    backgroundColor: "#18B549",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  bookBtnText: { color: "#fff", fontFamily: "Outfit_700Bold", fontSize: 15 },
})
