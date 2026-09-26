import { useCallback, useState } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native"
import { useFocusEffect } from "expo-router"
import { ActivityIndicator, Switch, Button, TextInput, Surface, Divider } from "react-native-paper"
import { trpc } from "../../../lib/trpc"

const DAY_NAMES = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"]

interface BusinessHour {
  id: string
  dayOfWeek: number
  closed: boolean
  morningOpen: string | null
  morningClose: string | null
  afternoonOpen: string | null
  afternoonClose: string | null
}

export default function AdminHoursScreen() {
  const [hours, setHours] = useState<BusinessHour[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [edits, setEdits] = useState<Record<string, BusinessHour>>({})

  const load = useCallback(() => {
    setLoading(true)
    trpc.shop.get
      .query()
      .then((shop) => {
        const bh = shop?.businessHours ?? []
        setHours(bh)
        const initial: Record<string, BusinessHour> = {}
        for (const h of bh) {
          initial[h.id] = { ...h }
        }
        setEdits(initial)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useFocusEffect(load)

  const update = (id: string, patch: Partial<BusinessHour>) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  const handleSave = async (id: string) => {
    const h = edits[id]
    if (!h) return
    setSaving(id)
    try {
      await trpc.admin.updateBusinessHours.mutate({
        id: h.id,
        closed: h.closed,
        morningOpen: h.morningOpen,
        morningClose: h.morningClose,
        afternoonOpen: h.afternoonOpen,
        afternoonClose: h.afternoonClose,
      })
      load()
    } catch {
      Alert.alert("Erro", "Não foi possível guardar o horário.")
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#18B549" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {hours.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((h) => {
        const edit = edits[h.id] ?? h
        return (
          <Surface key={h.id} style={styles.card} elevation={0}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayName}>{DAY_NAMES[h.dayOfWeek]}</Text>
              <View style={styles.closedRow}>
                <Text style={styles.closedLabel}>Fechado</Text>
                <Switch
                  value={edit.closed}
                  onValueChange={(v) => update(h.id, { closed: v })}
                  color="#18B549"
                />
              </View>
            </View>

            {!edit.closed && (
              <>
                <Divider style={styles.divider} />

                <Text style={styles.sessionLabel}>Manhã</Text>
                <View style={styles.timeRow}>
                  <TextInput
                    label="Abertura"
                    value={edit.morningOpen ?? ""}
                    onChangeText={(v) => update(h.id, { morningOpen: v || null })}
                    mode="outlined"
                    placeholder="09:00"
                    style={styles.timeInput}
                  />
                  <Text style={styles.timeSep}>–</Text>
                  <TextInput
                    label="Fecho"
                    value={edit.morningClose ?? ""}
                    onChangeText={(v) => update(h.id, { morningClose: v || null })}
                    mode="outlined"
                    placeholder="13:00"
                    style={styles.timeInput}
                  />
                </View>

                <Text style={styles.sessionLabel}>Tarde</Text>
                <View style={styles.timeRow}>
                  <TextInput
                    label="Abertura"
                    value={edit.afternoonOpen ?? ""}
                    onChangeText={(v) => update(h.id, { afternoonOpen: v || null })}
                    mode="outlined"
                    placeholder="14:00"
                    style={styles.timeInput}
                  />
                  <Text style={styles.timeSep}>–</Text>
                  <TextInput
                    label="Fecho"
                    value={edit.afternoonClose ?? ""}
                    onChangeText={(v) => update(h.id, { afternoonClose: v || null })}
                    mode="outlined"
                    placeholder="19:00"
                    style={styles.timeInput}
                  />
                </View>
              </>
            )}

            <Button
              mode="contained"
              onPress={() => void handleSave(h.id)}
              loading={saving === h.id}
              style={styles.saveBtn}
              compact
            >
              Guardar
            </Button>
          </Surface>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#111216" },
  scroll: { flex: 1, backgroundColor: "#111216" },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: "#17191f",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2d35",
    padding: 16,
    gap: 10,
  },
  dayHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dayName: { color: "#fff", fontFamily: "Outfit_600SemiBold", fontSize: 15 },
  closedRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  closedLabel: { color: "#9ca3af", fontFamily: "Outfit_400Regular", fontSize: 13 },
  divider: { backgroundColor: "#2a2d35" },
  sessionLabel: { color: "#6b7280", fontFamily: "Outfit_600SemiBold", fontSize: 11, textTransform: "uppercase" },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  timeInput: { flex: 1 },
  timeSep: { color: "#6b7280", fontFamily: "Outfit_400Regular", fontSize: 16 },
  saveBtn: { alignSelf: "flex-end", borderRadius: 8 },
})
