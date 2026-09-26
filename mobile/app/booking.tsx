import { useEffect, useState, useMemo, useRef } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { ActivityIndicator, Surface } from "react-native-paper"
import { Calendar } from "react-native-calendars"
import { isBefore, startOfDay, format } from "date-fns"
import { pt } from "date-fns/locale"
import { trpc } from "../lib/trpc"
import { calendarTheme } from "../theme"

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
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-")
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(price)
}
function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

interface Slot { time: string; available: boolean }
interface Service { id: string; name: string; duration: number; price: number }

export default function BookingScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>()
  const [service, setService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined)
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [closedDays, setClosedDays] = useState<number[]>([])
  const [booking, setBooking] = useState(false)
  const bookingInFlight = useRef(false)
  const router = useRouter()

  useEffect(() => {
    if (!serviceId) return
    void Promise.all([
      trpc.shop.get.query().then((shop) => {
        const svc = shop?.services.find((s) => s.id === serviceId)
        if (svc) {
          setService({
            id: svc.id,
            name: svc.name,
            duration: svc.duration,
            price: Number(svc.price),
          })
        }
      }),
      trpc.slots.getClosedDays.query().then((d) => setClosedDays(d.closedDaysOfWeek)),
    ])
  }, [serviceId])

  useEffect(() => {
    if (!selectedDate || !service) return
    setSlotsLoading(true)
    setSelectedSlot(null)
    trpc.slots.getSlots
      .query({ date: selectedDate, duration: service.duration })
      .then((r) => setSlots(r.slots))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [selectedDate, service])

  const availableSlots = useMemo(() => {
    if (!selectedDate) return []
    const isToday = selectedDate === localDateStr(new Date())
    return slots.filter((s) => {
      if (!s.available) return false
      if (isToday) {
        const now = new Date()
        return timeToMinutes(s.time) >= now.getHours() * 60 + now.getMinutes() + 15
      }
      return true
    })
  }, [slots, selectedDate])

  const groupedSlots = useMemo(() => {
    const acc: Record<string, Slot[]> = {}
    for (const s of availableSlots) {
      const h = s.time.split(":")[0]
      ;(acc[h] ??= []).push(s)
    }
    return Object.entries(acc).sort(([a], [b]) => parseInt(a) - parseInt(b))
  }, [availableSlots])

  // Build markedDates for react-native-calendars
  const markedDates = useMemo(() => {
    const marks: Record<string, { disabled?: boolean; selected?: boolean; selectedColor?: string }> = {}
    if (selectedDate) {
      marks[selectedDate] = { selected: true, selectedColor: "#18B549" }
    }
    return marks
  }, [selectedDate])

  const handleBook = async () => {
    if (!selectedSlot || !service || !selectedDate) return
    if (bookingInFlight.current) return
    bookingInFlight.current = true
    setBooking(true)
    try {
      const end = minutesToTime(timeToMinutes(selectedSlot) + service.duration)
      await trpc.booking.create.mutate({
        date: new Date(selectedDate + "T00:00:00"),
        services: [{ serviceId: service.id, startTime: selectedSlot, endTime: end }],
      })
      router.replace("/(tabs)/bookings")
    } catch {
      Alert.alert("Erro", "Não foi possível realizar a marcação. Tenta novamente.")
      bookingInFlight.current = false
      setBooking(false)
    }
  }

  if (!service) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#18B549" />
      </View>
    )
  }

  const isDateDisabled = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00")
    if (isBefore(d, startOfDay(new Date()))) return true
    if (closedDays.includes(d.getDay())) return true
    return false
  }

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Service summary */}
        <Surface style={styles.summaryCard} elevation={0}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.serviceMeta}>
            {formatDuration(service.duration)} · {formatPrice(service.price)}
          </Text>
        </Surface>

        {/* Calendar */}
        <Text style={styles.label}>Escolhe um dia</Text>
        <Calendar
          current={localDateStr(new Date())}
          onDayPress={(day) => {
            if (!isDateDisabled(day.dateString)) {
              setSelectedDate(day.dateString)
            }
          }}
          markedDates={markedDates}
          dayComponent={({ date, state }) => {
            if (!date) return null
            const disabled = !date.dateString || isDateDisabled(date.dateString)
            const selected = selectedDate === date.dateString
            return (
              <TouchableOpacity
                onPress={() => {
                  if (!disabled && date.dateString) setSelectedDate(date.dateString)
                }}
                style={[
                  styles.dayCell,
                  selected && styles.dayCellSelected,
                  state === "today" && !selected && styles.dayCellToday,
                ]}
                disabled={disabled}
              >
                <Text
                  style={[
                    styles.dayText,
                    selected && styles.dayTextSelected,
                    state === "today" && !selected && styles.dayTextToday,
                    disabled && styles.dayTextDisabled,
                  ]}
                >
                  {date.day}
                </Text>
              </TouchableOpacity>
            )
          }}
          theme={calendarTheme}
          style={styles.calendar}
        />

        {/* Slots */}
        {selectedDate && (
          <View style={styles.slotsSection}>
            <Text style={styles.label}>
              Horário para{" "}
              <Text style={styles.labelAccent}>
                {format(new Date(selectedDate + "T00:00:00"), "d 'de' MMMM", { locale: pt })}
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

      {selectedSlot && selectedDate && (
        <View style={styles.footer}>
          <View style={{ flex: 1 }}>
            <Text style={styles.footerTime}>{selectedSlot}</Text>
            <Text style={styles.footerDate}>
              {format(new Date(selectedDate + "T00:00:00"), "EEEE, d 'de' MMMM", { locale: pt })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => void handleBook()}
            disabled={booking}
          >
            {booking ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.confirmBtnText}>Confirmar</Text>
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

  label: { color: "#9ca3af", fontFamily: "Outfit_400Regular", fontSize: 13 },
  labelAccent: { color: "#fff", fontFamily: "Outfit_600SemiBold" },

  calendar: {
    backgroundColor: "#17191f",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2a2d35",
    overflow: "hidden",
  },
  dayCell: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCellSelected: { backgroundColor: "#18B549" },
  dayCellToday: { borderWidth: 1, borderColor: "#18B549" },
  dayText: { color: "#fff", fontFamily: "Outfit_400Regular", fontSize: 14 },
  dayTextSelected: { color: "#fff", fontFamily: "Outfit_600SemiBold" },
  dayTextToday: { color: "#18B549", fontFamily: "Outfit_600SemiBold" },
  dayTextDisabled: { color: "#2a2d35" },

  slotsSection: { gap: 8 },
  hourGroups: { gap: 14 },
  hourGroup: { gap: 8 },
  hourLabel: { color: "#6b7280", fontFamily: "Outfit_400Regular", fontSize: 12 },
  slotRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slotPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2d35",
    backgroundColor: "#17191f",
  },
  slotPillSelected: { backgroundColor: "#18B549", borderColor: "#18B549" },
  slotText: { color: "#fff", fontFamily: "Outfit_400Regular", fontSize: 14 },
  slotTextSelected: { fontFamily: "Outfit_600SemiBold" },
  empty: { color: "#6b7280", fontFamily: "Outfit_400Regular", fontSize: 13 },

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
  footerTime: { color: "#fff", fontFamily: "Outfit_700Bold", fontSize: 18 },
  footerDate: {
    color: "#9ca3af",
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
    marginTop: 2,
    textTransform: "capitalize",
  },
  confirmBtn: {
    backgroundColor: "#18B549",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 24,
    alignItems: "center",
    minWidth: 110,
  },
  confirmBtnText: { color: "#fff", fontFamily: "Outfit_700Bold", fontSize: 15 },
})
