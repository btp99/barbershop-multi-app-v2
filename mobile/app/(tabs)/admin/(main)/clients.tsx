import { useEffect, useState, useCallback } from "react"
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native"
import { useRouter, useFocusEffect } from "expo-router"
import {
  ActivityIndicator,
  Searchbar,
  FAB,
  Portal,
  Dialog,
  Button,
  TextInput,
} from "react-native-paper"
import { PlusIcon } from "lucide-react-native"
import { trpc } from "../../../../lib/trpc"

interface Client {
  id: string
  name: string
  phone: string | null
  email: string | null
  source: "client" | "user"
}

export default function AdminClientsScreen() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [newDialog, setNewDialog] = useState(false)
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" })
  const [saving, setSaving] = useState(false)

  const load = useCallback((query = search) => {
    setLoading(true)
    trpc.client.search
      .query({ query })
      .then((r) => setClients(r as Client[]))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [search])

  useFocusEffect(useCallback(() => { load("") }, []))

  useEffect(() => {
    const t = setTimeout(() => load(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const handleCreate = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await trpc.client.create.mutate({
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        notes: form.notes.trim() || undefined,
      })
      setNewDialog(false)
      setForm({ name: "", phone: "", email: "", notes: "" })
      load(search)
    } catch {
      // silently fail
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#111216" }}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Pesquisar clientes..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchbar}
          inputStyle={{ color: "#fff", fontFamily: "Outfit_400Regular" }}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#18B549" />
        </View>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(c) => `${c.source}:${c.id}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.clientCard}
              onPress={() =>
                item.source === "client"
                  ? router.push({
                      pathname: "/(tabs)/admin/client/[id]",
                      params: { id: item.id },
                    })
                  : undefined
              }
              activeOpacity={item.source === "client" ? 0.7 : 1}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.clientName}>{item.name}</Text>
                {item.email && <Text style={styles.clientDetail}>{item.email}</Text>}
                {item.phone && <Text style={styles.clientDetail}>{item.phone}</Text>}
              </View>
              <View style={[styles.sourceBadge, item.source === "client" && styles.sourceBadgeClient]}>
                <Text style={styles.sourceBadgeText}>{item.source}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>
                {search ? "Nenhum cliente encontrado." : "Sem clientes registados."}
              </Text>
            </View>
          }
        />
      )}

      <FAB
        icon={() => <PlusIcon size={20} color="#fff" />}
        style={styles.fab}
        onPress={() => setNewDialog(true)}
        color="#fff"
      />

      <Portal>
        <Dialog
          visible={newDialog}
          onDismiss={() => setNewDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>Novo cliente</Dialog.Title>
          <Dialog.Content style={{ gap: 12 }}>
            <TextInput
              label="Nome *"
              value={form.name}
              onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              mode="outlined"
            />
            <TextInput
              label="Telefone"
              value={form.phone}
              onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
              mode="outlined"
              keyboardType="phone-pad"
            />
            <TextInput
              label="Email"
              value={form.email}
              onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              label="Notas"
              value={form.notes}
              onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
              mode="outlined"
              multiline
              numberOfLines={2}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setNewDialog(false)} textColor="#9ca3af">
              Cancelar
            </Button>
            <Button
              onPress={() => void handleCreate()}
              loading={saving}
              disabled={!form.name.trim()}
            >
              Criar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  )
}

const styles = StyleSheet.create({
  searchContainer: { padding: 16, paddingBottom: 8 },
  searchbar: { backgroundColor: "#17191f", borderRadius: 10 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  list: { padding: 16, paddingTop: 8, gap: 10, flexGrow: 1 },
  clientCard: {
    backgroundColor: "#17191f",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2a2d35",
    flexDirection: "row",
    alignItems: "center",
  },
  clientName: { color: "#fff", fontFamily: "Outfit_600SemiBold", fontSize: 15 },
  clientDetail: { color: "#9ca3af", fontFamily: "Outfit_400Regular", fontSize: 13, marginTop: 1 },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    backgroundColor: "#1c1f26",
  },
  sourceBadgeClient: { backgroundColor: "rgba(24,181,73,0.1)" },
  sourceBadgeText: { color: "#9ca3af", fontFamily: "Outfit_400Regular", fontSize: 11 },
  empty: { color: "#6b7280", fontFamily: "Outfit_400Regular", fontSize: 14 },
  fab: { position: "absolute", bottom: 24, right: 16, backgroundColor: "#18B549" },
  dialog: { backgroundColor: "#17191f" },
  dialogTitle: { color: "#fff", fontFamily: "Outfit_600SemiBold" },
})
