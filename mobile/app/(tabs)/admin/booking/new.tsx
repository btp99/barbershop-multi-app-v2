import { useEffect, useState, useMemo } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import {
  ActivityIndicator,
  Button,
  Surface,
  TextInput,
  Portal,
  Dialog,
  Searchbar,
  List,
  Divider,
} from "react-native-paper"
import { Calendar } from "react-native-calendars"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { trpc } from "../../../../lib/trpc"
import { calendarTheme } from "../../../../theme"

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}
function minutesToTime(mins: number) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

interface Slot { time: string; available: boolean }
interface Service { id: string; name: string; duration: number; price: number }
interface ClientResult {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  source: "client" | "user"
}

export default function AdminNewBookingScreen() {
  const { date: initialDate } = useLocalSearchParams<{ date?: string }>()
  const router = useRouter()

  const [shop, setShop] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate ?? new Date().toISOString().split("T")[0]
  )
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [closedDays, setClosedDays] = useState<number[]>([])
  const [note, setNote] = useState("")
  const [clientMessage, setClientMessage] = useState("")

  // Client selection
  const [clientSearch, setClientSearch] = useState("")
  const [clientResults, setClientResults] = useState<ClientResult[]>([])
  const [selectedClient, setSelectedClient] = useState<ClientResult | null>(null)
  const [showClientPicker, setShowClientPicker] = useState(false)

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void Promise.all([
      trpc.shop.get.query().then((s) => setShop(s)),
      trpc.slots.getClosedDays.query().then((d) => setClosedDays(d.closedDaysOfWeek)),
    ])
  }, [])

  // Load slots when date + service change
  useEffect(() => {
    if (!selectedDate || !selectedService) return
    setSlotsLoading(true)
    setSelectedSlot(null)
    trpc.slots.getSlots
      .query({ date: selectedDate, duration: selectedService.duration })
      .then((r) => setSlots(r.slots))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [selectedDate, selectedService])

  // Search clients
  useEffect(() => {
    const timer = setTimeout(() => {
      trpc.client.search
        .query({ query: clientSearch })
        .then((r) => setClientResults(r as ClientResult[]))
        .catch(() => {})
    }, 300)
    return () => clearTimeout(timer)
  }, [clientSearch])

  const availableSlots = useMemo(
    () => slots.filter((s) => s.available),
    [slots]
  )

  const groupedSlots = useMemo(() => {
    const acc: Record<string, Slot[]> = {}
    for (const s of availableSlots) {
      const h = s.time.split(":")[0]
      ;(acc[h] ??= []).push(s)
    }
    return Object.entries(acc).sort(([a], [b]) => parseInt(a) - parseInt(b))
  }, [availableSlots])

  const markedDates = selectedDate
    ? { [selectedDate]: { selected: true, selectedColor: "#18B549" } }
    : {}

  const isDateDisabled = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00")
    return closedDays.includes(d.getDay())
  }

  const handleSave = async () => {
    if (!selectedService || !selectedDate || !selectedSlot) {
      Alert.alert("Falta informação", "Seleciona um serviço, dia e horário.")
      return
    }
    setSaving(true)
    try {
      const end = minutesToTime(timeToMinutes(selectedSlot) + selectedService.duration)
      await trpc.admin.createBooking.mutate({
        date: new Date(selectedDate + "T00:00:00"),
        services: [{ serviceId: selectedService.id, startTime: selectedSlot, endTime: end }],
        clientId: selectedClient?.source === "client" ? selectedClient.id : undefined,
        userId: selectedClient?.source === "user" ? selectedClient.id : undefined,
        note: note || undefined,
        clientMessage: clientMessage || undefined,
      })
      router.back()
    } catch (e: any) {
      const msg = e?.message?.includes("overlap")
        ? "Já existe uma marcação neste horário."
        : "Não foi possível criar a marcação."
      Alert.alert("Erro", msg)
    } finally {
      setSaving(false)
    }
  }

  if (!shop) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#18B549" />
      </View>
    )
  }

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Client selection */}
        <Surface style={styles.card} elevation={0}>
          <Text style={styles.sectionLabel}>Cliente</Text>
          {selectedClient ? (
            <View style={styles.selectedClient}>
              <View style={{ flex: 1 }}>
                <Text style={styles.clientName}>{selectedClient.name}</Text>
                {selectedClient.email && (
                  <Text style={styles.clientDetail}>{selectedClient.email}</Text>
                )}
              </View>
              <Button
                mode="text"
                onPress={() => setSelectedClient(null)}
                textColor="#ef4444"
                compact
              >
                Remover
              </Button>
            </View>
          ) : (
            <Button
              mode="outlined"
              onPress={() => setShowClientPicker(true)}
              style={styles.selectClientBtn}
              textColor="#9ca3af"
            >
              Selecionar cliente (opcional)
            </Button>
          )}
        </Surface>

        {/* Service selection */}
        <Surface style={styles.card} elevation={0}>
          <Text style={styles.sectionLabel}>Serviço</Text>
          <View style={styles.serviceList}>
            {shop.services.map((svc: any) => {
              const isSelected = selectedService?.id === svc.id
              return (
                <TouchableOpacity
                  key={svc.id}
                  style={[styles.serviceRow, isSelected && styles.serviceRowActive]}
                  onPress={() => setSelectedService(
                    isSelected ? null : { id: svc.id, name: svc.name, duration: svc.duration, price: Number(svc.price) }
                  )}
                  activeOpacity={0.7}
                >
                  <Text style={styles.serviceName}>{svc.name}</Text>
                  <Text style={styles.serviceMeta}>{svc.duration} min</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </Surface>

        {/* Date */}
        <Text style={styles.sectionLabel}>Data</Text>
        <Calendar
          current={selectedDate}
          onDayPress={(day) => {
            if (!isDateDisabled(day.dateString)) setSelectedDate(day.dateString)
          }}
          markedDates={markedDates}
          theme={calendarTheme}
          style={styles.calendar}
        />

        {/* Slots */}
        {selectedService && selectedDate && (
          <View style={{ gap: 8 }}>
            <Text style={styles.sectionLabel}>
              Horário para{" "}
              <Text style={styles.sectionLabelAccent}>
                {format(new Date(selectedDate + "T00:00:00"), "d 'de' MMMM", { locale: pt })}
              </Text>
            </Text>

            {slotsLoading ? (
              <ActivityIndicator color="#18B549" />
            ) : groupedSlots.length === 0 ? (
              <Text style={styles.empty}>Sem horários disponíveis.</Text>
            ) : (
              <View style={{ gap: 14 }}>
                {groupedSlots.map(([hour, hourSlots]) => (
                  <View key={hour} style={{ gap: 8 }}>
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

        {/* Notes */}
        <Surface style={styles.card} elevation={0}>
          <Text style={styles.sectionLabel}>Notas (opcional)</Text>
          <TextInput
            label="Nota interna"
            value={note}
            onChangeText={setNote}
            mode="outlined"
            multiline
            numberOfLines={2}
            style={{ marginTop: 4 }}
          />
          <TextInput
            label="Mensagem para o cliente"
            value={clientMessage}
            onChangeText={setClientMessage}
            mode="outlined"
            multiline
            numberOfLines={2}
            style={{ marginTop: 8 }}
          />
        </Surface>

        <View style={{ height: 100 }} />
      </ScrollView>

      {selectedService && selectedDate && selectedSlot && (
        <View style={styles.footer}>
          <View style={{ flex: 1 }}>
            <Text style={styles.footerTime}>{selectedSlot}</Text>
            <Text style={styles.footerMeta}>{selectedService.name}</Text>
          </View>
          <Button
            mode="contained"
            onPress={() => void handleSave()}
            loading={saving}
            style={styles.saveBtn}
          >
            Criar marcação
          </Button>
        </View>
      )}

      {/* Client picker dialog */}
      <Portal>
        <Dialog
          visible={showClientPicker}
          onDismiss={() => setShowClientPicker(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>Selecionar cliente</Dialog.Title>
          <Dialog.Content>
            <Searchbar
              placeholder="Pesquisar..."
              value={clientSearch}
              onChangeText={setClientSearch}
              style={styles.searchbar}
              inputStyle={{ color: "#fff" }}
            />
            <View style={{ maxHeight: 300, marginTop: 8 }}>
              <ScrollView>
                {clientResults.map((c, i) => (
                  <View key={c.id}>
                    {i > 0 && <Divider style={{ backgroundColor: "#2a2d35" }} />}
                    <List.Item
                      title={c.name ?? "Sem nome"}
                      description={c.email ?? c.phone ?? c.source}
                      titleStyle={{ color: "#fff", fontFamily: "Outfit_600SemiBold" }}
                      descriptionStyle={{ color: "#9ca3af", fontFamily: "Outfit_400Regular" }}
                      onPress={() => {
                        setSelectedClient(c)
                        setShowClientPicker(false)
                        setClientSearch("")
                      }}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowClientPicker(false)} textColor="#9ca3af">
              Fechar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#111216" },
  scroll: { flex: 1, backgroundColor: "#111216" },
  content: { padding: 16, gap: 16, paddingBottom: 100 },
  card: {
    backgroundColor: "#17191f",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2d35",
    padding: 14,
    gap: 10,
  },
  sectionLabel: { color: "#9ca3af", fontFamily: "Outfit_400Regular", fontSize: 13 },
  sectionLabelAccent: { color: "#fff", fontFamily: "Outfit_600SemiBold" },
  selectedClient: { flexDirection: "row", alignItems: "center" },
  clientName: { color: "#fff", fontFamily: "Outfit_600SemiBold", fontSize: 14 },
  clientDetail: { color: "#9ca3af", fontFamily: "Outfit_400Regular", fontSize: 12 },
  selectClientBtn: { alignSelf: "flex-start", borderColor: "#2a2d35" },
  serviceList: { gap: 8 },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2d35",
    backgroundColor: "#1c1f26",
  },
  serviceRowActive: { borderColor: "#18B549", backgroundColor: "rgba(24,181,73,0.05)" },
  serviceName: { color: "#fff", fontFamily: "Outfit_400Regular", fontSize: 14 },
  serviceMeta: { color: "#9ca3af", fontFamily: "Outfit_400Regular", fontSize: 12 },
  calendar: {
    backgroundColor: "#17191f",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2a2d35",
    overflow: "hidden",
  },
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
  footerMeta: { color: "#9ca3af", fontFamily: "Outfit_400Regular", fontSize: 12 },
  saveBtn: { borderRadius: 10 },
  dialog: { backgroundColor: "#17191f" },
  dialogTitle: { color: "#fff", fontFamily: "Outfit_600SemiBold" },
  searchbar: { backgroundColor: "#1c1f26" },
})
