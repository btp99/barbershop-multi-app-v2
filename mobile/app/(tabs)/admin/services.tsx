import { useCallback, useState } from "react"
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native"
import { useFocusEffect } from "expo-router"
import {
  ActivityIndicator,
  FAB,
  Portal,
  Dialog,
  Button,
  TextInput,
  Divider,
} from "react-native-paper"
import { PlusIcon, EditIcon, TrashIcon } from "lucide-react-native"
import { trpc } from "../../../lib/trpc"

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
  imageUrl: string
  popular: boolean
}

const EMPTY_FORM = { id: "", name: "", description: "", price: "", duration: "30", imageUrl: "" }

function formatPrice(p: number) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(p)
}

export default function AdminServicesScreen() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    trpc.shop.get
      .query()
      .then((shop) => {
        const svcs = (shop?.services ?? []).map((s) => ({
          ...s,
          price: Number(s.price),
        }))
        setServices(svcs)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useFocusEffect(load)

  const openEdit = (svc: Service) => {
    setForm({
      id: svc.id,
      name: svc.name,
      description: svc.description,
      price: String(svc.price),
      duration: String(svc.duration),
      imageUrl: svc.imageUrl,
    })
    setDialog(true)
  }

  const openNew = () => {
    setForm(EMPTY_FORM)
    setDialog(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.description.trim()) return
    setSaving(true)
    try {
      await trpc.service.upsert.mutate({
        id: form.id || undefined,
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price) || 0,
        duration: parseInt(form.duration) || 30,
        imageUrl: form.imageUrl.trim() || undefined,
      })
      setDialog(false)
      load()
    } catch {
      Alert.alert("Erro", "Não foi possível guardar o serviço.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (svc: Service) => {
    Alert.alert("Eliminar serviço", `Eliminar "${svc.name}"? Esta ação é irreversível.`, [
      { text: "Não", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await trpc.service.delete.mutate({ id: svc.id })
            load()
          } catch {
            Alert.alert("Erro", "Não foi possível eliminar o serviço.")
          }
        },
      },
    ])
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#111216" }}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#18B549" />
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={{ uri: item.imageUrl }} style={styles.serviceImg} />
              <View style={styles.serviceBody}>
                <Text style={styles.serviceName}>{item.name}</Text>
                <Text style={styles.serviceDesc} numberOfLines={2}>{item.description}</Text>
                <Text style={styles.serviceMeta}>
                  {formatPrice(item.price)} · {item.duration} min
                </Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}>
                  <EditIcon size={16} color="#9ca3af" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconBtn}>
                  <TrashIcon size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>Sem serviços configurados.</Text>
            </View>
          }
        />
      )}

      <FAB
        icon={() => <PlusIcon size={20} color="#fff" />}
        style={styles.fab}
        onPress={openNew}
        color="#fff"
      />

      <Portal>
        <Dialog
          visible={dialog}
          onDismiss={() => setDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>
            {form.id ? "Editar serviço" : "Novo serviço"}
          </Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 420 }}>
            <ScrollView style={{ gap: 10 }}>
              <View style={{ gap: 12, paddingVertical: 8 }}>
                <TextInput
                  label="Nome *"
                  value={form.name}
                  onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                  mode="outlined"
                />
                <TextInput
                  label="Descrição *"
                  value={form.description}
                  onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                  mode="outlined"
                  multiline
                  numberOfLines={2}
                />
                <TextInput
                  label="Preço (€)"
                  value={form.price}
                  onChangeText={(v) => setForm((f) => ({ ...f, price: v }))}
                  mode="outlined"
                  keyboardType="decimal-pad"
                />
                <TextInput
                  label="Duração (min)"
                  value={form.duration}
                  onChangeText={(v) => setForm((f) => ({ ...f, duration: v }))}
                  mode="outlined"
                  keyboardType="number-pad"
                />
                <TextInput
                  label="URL da imagem"
                  value={form.imageUrl}
                  onChangeText={(v) => setForm((f) => ({ ...f, imageUrl: v }))}
                  mode="outlined"
                  autoCapitalize="none"
                />
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setDialog(false)} textColor="#9ca3af">Cancelar</Button>
            <Button
              onPress={() => void handleSave()}
              loading={saving}
              disabled={!form.name.trim() || !form.description.trim()}
            >
              Guardar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  )
}

import { ScrollView } from "react-native"

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  card: {
    backgroundColor: "#17191f",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#2a2d35",
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  serviceImg: { width: 64, height: 64, borderRadius: 8 },
  serviceBody: { flex: 1, gap: 2 },
  serviceName: { color: "#fff", fontFamily: "Outfit_600SemiBold", fontSize: 14 },
  serviceDesc: { color: "#9ca3af", fontFamily: "Outfit_400Regular", fontSize: 12 },
  serviceMeta: { color: "#18B549", fontFamily: "Outfit_700Bold", fontSize: 13, marginTop: 4 },
  actions: { gap: 8 },
  iconBtn: { padding: 6 },
  empty: { color: "#6b7280", fontFamily: "Outfit_400Regular", fontSize: 14 },
  fab: { position: "absolute", bottom: 24, right: 16, backgroundColor: "#18B549" },
  dialog: { backgroundColor: "#17191f" },
  dialogTitle: { color: "#fff", fontFamily: "Outfit_600SemiBold" },
})
