import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native"
import { useRouter } from "expo-router"
import { ActivityIndicator, FAB, Portal, Dialog, Button, TextInput } from "react-native-paper"
import { Calendar } from "react-native-calendars"
import { format, getDaysInMonth } from "date-fns"
import { pt } from "date-fns/locale"
import { trpc } from "../../../lib/trpc"
import { BookingCard } from "../../../components/BookingCard"
import { calendarTheme } from "../../../theme"
import { PlusIcon } from "lucide-react-native"

function localDateStr(d: Date) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-")
}

export default function AdminCalendarScreen() {
  const router = useRouter()
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 })
  const [selectedDate, setSelectedDate] = useState<string>(localDateStr(today))
  const [bookingCounts, setBookingCounts] = useState<Record<string, number>>({})
  const [dayBookings, setDayBookings] = useState<any[]>([])
  const [dayBlocks, setDayBlocks] = useState<any[]>([])
  const [loadingCounts, setLoadingCounts] = useState(true)
  const [loadingDay, setLoadingDay] = useState(false)
  const [fabOpen, setFabOpen] = useState(false)
  const [blockDialog, setBlockDialog] = useState(false)
  const [blockForm, setBlockForm] = useState({ startTime: "", endTime: "", reason: "" })
  const [savingBlock, setSavingBlock] = useState(false)

  const loadCounts = useCallback(async () => {
    setLoadingCounts(true)
    try {
      const counts = await trpc.admin.getBookingCounts.query(currentMonth)
      setBookingCounts(counts)
    } finally {
      setLoadingCounts(false)
    }
  }, [currentMonth.year, currentMonth.month])

  const loadDay = useCallback(async (dateStr: string) => {
    setLoadingDay(true)
    try {
      const [bookings, blocks] = await Promise.all([
        trpc.admin.getBookingsForDate.query({ date: new Date(dateStr + "T00:00:00") }),
        trpc.timeblock.getForDate.query({ date: new Date(dateStr + "T00:00:00") }),
      ])
      setDayBookings(bookings)
      setDayBlocks(blocks)
    } finally {
      setLoadingDay(false)
    }
  }, [])

  useEffect(() => { void loadCounts() }, [loadCounts])

  useEffect(() => { void loadDay(selectedDate) }, [selectedDate, loadDay])

  // Build markedDates with dots for days with bookings
  const markedDates: Record<string, any> = {}
  const days = getDaysInMonth(new Date(currentMonth.year, currentMonth.month - 1))
  for (let i = 1; i <= days; i++) {
    const key = `${currentMonth.year}-${String(currentMonth.month).padStart(2, "0")}-${String(i).padStart(2, "0")}`
    const count = bookingCounts[key] ?? 0
    markedDates[key] = {
      ...(count > 0 ? { marked: true, dotColor: "#18B549" } : {}),
      ...(key === selectedDate ? { selected: true, selectedColor: "#18B549" } : {}),
    }
  }

  const handleDeleteBlock = (blockId: string) => {
    Alert.alert("Remover bloqueio", "Tens a certeza?", [
      { text: "Não", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          try {
            await trpc.timeblock.delete.mutate({ id: blockId })
            await loadDay(selectedDate)
          } catch {
            Alert.alert("Erro", "Não foi possível remover o bloqueio.")
          }
        },
      },
    ])
  }

  const handleAddBlock = async () => {
    if (!blockForm.startTime || !blockForm.endTime) return
    setSavingBlock(true)
    try {
      await trpc.timeblock.create.mutate({
        date: selectedDate,
        startTime: blockForm.startTime,
        endTime: blockForm.endTime,
        reason: blockForm.reason || undefined,
      })
      setBlockDialog(false)
      setBlockForm({ startTime: "", endTime: "", reason: "" })
      await loadDay(selectedDate)
    } catch {
      Alert.alert("Erro", "Não foi possível adicionar o bloqueio.")
    } finally {
      setSavingBlock(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#111216" }}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Calendar */}
        <Calendar
          current={`${currentMonth.year}-${String(currentMonth.month).padStart(2, "0")}-01`}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          onMonthChange={(month) =>
            setCurrentMonth({ year: month.year, month: month.month })
          }
          markedDates={markedDates}
          markingType="dot"
          theme={calendarTheme}
          style={styles.calendar}
        />

        {/* Selected day header */}
        <Text style={styles.dayHeader}>
          {format(new Date(selectedDate + "T00:00:00"), "EEEE, d 'de' MMMM", { locale: pt })}
        </Text>

        {/* Time blocks for selected day */}
        {dayBlocks.length > 0 && (
          <View style={styles.blockSection}>
            <Text style={styles.blockTitle}>Bloqueios</Text>
            {dayBlocks.map((block) => (
              <View key={block.id} style={styles.blockRow}>
                <View style={styles.blockInfo}>
                  <Text style={styles.blockTime}>
                    {block.startTime} – {block.endTime}
                  </Text>
                  {block.reason && (
                    <Text style={styles.blockReason}>{block.reason}</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => handleDeleteBlock(block.id)}>
                  <Text style={styles.deleteText}>Remover</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Bookings for selected day */}
        {loadingDay ? (
          <ActivityIndicator color="#18B549" style={{ marginTop: 8 }} />
        ) : (() => {
          const active = dayBookings.filter((b: any) => b.status !== "CANCELLED")
          const cancelled = dayBookings.filter((b: any) => b.status === "CANCELLED")

          const renderCard = (b: any) => {
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
                  router.push({
                    pathname: "/(tabs)/admin/booking/[id]",
                    params: { id: b.id },
                  })
                }
                dimIfPast={false}
              />
            )
          }

          return (
            <>
              <Text style={styles.sectionTitle}>
                Marcações ({active.length})
              </Text>
              {active.length === 0 ? (
                <Text style={styles.empty}>Sem marcações para este dia.</Text>
              ) : (
                <View style={styles.bookingList}>
                  {active.map(renderCard)}
                </View>
              )}

              {cancelled.length > 0 && (
                <>
                  <Text style={styles.cancelledTitle}>
                    Canceladas ({cancelled.length})
                  </Text>
                  <View style={styles.bookingList}>
                    {cancelled.map((b: any) => {
                      const clientName = b.client?.name ?? b.user?.name ?? null
                      const services = b.services.map((bs: any) => ({
                        id: bs.id,
                        service: { name: bs.service.name },
                      }))
                      return (
                        <View key={b.id}>
                          <BookingCard
                            id={b.id}
                            date={b.date}
                            startTime={b.startTime}
                            endTime={b.endTime}
                            status={b.status}
                            services={services}
                            clientName={clientName}
                            onPress={() =>
                              router.push({
                                pathname: "/(tabs)/admin/booking/[id]",
                                params: { id: b.id },
                              })
                            }
                            dimIfPast={false}
                          />
                          {b.cancellationReason && (
                            <View style={styles.reasonTag}>
                              <Text style={styles.reasonTagText}>
                                Motivo: {b.cancellationReason}
                              </Text>
                            </View>
                          )}
                        </View>
                      )
                    })}
                  </View>
                </>
              )}
            </>
          )
        })()}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB group */}
      <FAB
        icon={() => <PlusIcon size={20} color="#fff" />}
        label="Nova marcação"
        style={styles.fab}
        onPress={() =>
          router.push({
            pathname: "/(tabs)/admin/booking/new",
            params: { date: selectedDate },
          })
        }
        color="#fff"
      />

      {/* Add time block dialog */}
      <Portal>
        <Dialog
          visible={blockDialog}
          onDismiss={() => setBlockDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>Adicionar bloqueio</Dialog.Title>
          <Dialog.Content style={{ gap: 12 }}>
            <TextInput
              label="Início (HH:MM)"
              value={blockForm.startTime}
              onChangeText={(v) => setBlockForm((f) => ({ ...f, startTime: v }))}
              mode="outlined"
              placeholder="09:00"
            />
            <TextInput
              label="Fim (HH:MM)"
              value={blockForm.endTime}
              onChangeText={(v) => setBlockForm((f) => ({ ...f, endTime: v }))}
              mode="outlined"
              placeholder="10:00"
            />
            <TextInput
              label="Motivo (opcional)"
              value={blockForm.reason}
              onChangeText={(v) => setBlockForm((f) => ({ ...f, reason: v }))}
              mode="outlined"
              placeholder="Almoço, manutenção..."
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setBlockDialog(false)} textColor="#9ca3af">
              Cancelar
            </Button>
            <Button onPress={() => void handleAddBlock()} loading={savingBlock}>
              Adicionar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  )
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 100 },
  calendar: {
    backgroundColor: "#17191f",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2a2d35",
    overflow: "hidden",
  },
  dayHeader: {
    color: "#fff",
    fontFamily: "Outfit_700Bold",
    fontSize: 17,
    textTransform: "capitalize",
  },
  blockSection: {
    backgroundColor: "#1c1f26",
    borderRadius: 10,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#2a2d35",
  },
  blockTitle: { color: "#ef4444", fontFamily: "Outfit_600SemiBold", fontSize: 13 },
  blockRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  blockInfo: { gap: 2 },
  blockTime: { color: "#fff", fontFamily: "Outfit_600SemiBold", fontSize: 13 },
  blockReason: { color: "#9ca3af", fontFamily: "Outfit_400Regular", fontSize: 12 },
  deleteText: { color: "#ef4444", fontFamily: "Outfit_400Regular", fontSize: 13 },
  sectionTitle: { color: "#fff", fontFamily: "Outfit_700Bold", fontSize: 16 },
  cancelledTitle: { color: "#ef4444", fontFamily: "Outfit_700Bold", fontSize: 15, marginTop: 4 },
  bookingList: { gap: 10 },
  empty: { color: "#6b7280", fontFamily: "Outfit_400Regular", fontSize: 14 },
  reasonTag: {
    marginTop: -4,
    marginHorizontal: 4,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "rgba(239,68,68,0.3)",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  reasonTagText: { color: "#ef4444", fontFamily: "Outfit_400Regular", fontSize: 12 },
  fab: { position: "absolute", bottom: 24, right: 16, backgroundColor: "#18B549" },
  dialog: { backgroundColor: "#17191f" },
  dialogTitle: { color: "#fff", fontFamily: "Outfit_600SemiBold" },
})
