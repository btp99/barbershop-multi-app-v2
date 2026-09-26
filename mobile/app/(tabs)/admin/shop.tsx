import { useCallback, useState } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native"
import { useFocusEffect } from "expo-router"
import { ActivityIndicator, Button, Surface, TextInput, Divider } from "react-native-paper"
import { trpc } from "../../../lib/trpc"

interface ShopForm {
  name: string
  address: string
  description: string
  phones: string
  imageUrl: string
  logoUrl: string
  amenities: string
}

export default function AdminShopScreen() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ShopForm>({
    name: "",
    address: "",
    description: "",
    phones: "",
    imageUrl: "",
    logoUrl: "",
    amenities: "",
  })

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      trpc.shop.get
        .query()
        .then((shop) => {
          if (shop) {
            setForm({
              name: shop.name,
              address: shop.address,
              description: shop.description,
              phones: shop.phones.join(", "),
              imageUrl: shop.imageUrl,
              logoUrl: shop.logoUrl ?? "",
              amenities: shop.amenities.join(", "),
            })
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }, [])
  )

  const handleSave = async () => {
    setSaving(true)
    try {
      await trpc.admin.updateBarbershop.mutate({
        name: form.name.trim(),
        address: form.address.trim(),
        description: form.description.trim(),
        phones: form.phones
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean),
        imageUrl: form.imageUrl.trim(),
        logoUrl: form.logoUrl.trim() || undefined,
        amenities: form.amenities
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
      })
      Alert.alert("Guardado", "Definições atualizadas com sucesso.")
    } catch {
      Alert.alert("Erro", "Não foi possível guardar as definições.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#18B549" />
      </View>
    )
  }

  const f = (field: keyof ShopForm) => ({
    value: form[field],
    onChangeText: (v: string) => setForm((prev) => ({ ...prev, [field]: v })),
    mode: "outlined" as const,
  })

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Surface style={styles.section} elevation={0}>
        <Text style={styles.sectionTitle}>Informações gerais</Text>
        <Divider style={styles.divider} />
        <TextInput label="Nome" {...f("name")} />
        <TextInput label="Morada" {...f("address")} />
        <TextInput label="Descrição" {...f("description")} multiline numberOfLines={3} />
      </Surface>

      <Surface style={styles.section} elevation={0}>
        <Text style={styles.sectionTitle}>Contacto</Text>
        <Divider style={styles.divider} />
        <Text style={styles.hint}>Telefones separados por vírgula</Text>
        <TextInput label="Telefones" {...f("phones")} placeholder="912 345 678, 912 987 654" />
      </Surface>

      <Surface style={styles.section} elevation={0}>
        <Text style={styles.sectionTitle}>Imagens</Text>
        <Divider style={styles.divider} />
        <TextInput label="URL da imagem de capa" {...f("imageUrl")} autoCapitalize="none" />
        <TextInput label="URL do logótipo (opcional)" {...f("logoUrl")} autoCapitalize="none" />
      </Surface>

      <Surface style={styles.section} elevation={0}>
        <Text style={styles.sectionTitle}>Comodidades</Text>
        <Divider style={styles.divider} />
        <Text style={styles.hint}>Comodidades separadas por vírgula</Text>
        <TextInput
          label="Comodidades"
          {...f("amenities")}
          placeholder="Wi-Fi, Café, Parque, TV"
          multiline
          numberOfLines={2}
        />
      </Surface>

      <Button
        mode="contained"
        onPress={() => void handleSave()}
        loading={saving}
        style={styles.saveBtn}
      >
        Guardar definições
      </Button>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#111216" },
  scroll: { flex: 1, backgroundColor: "#111216" },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  section: {
    backgroundColor: "#17191f",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2d35",
    padding: 16,
    gap: 12,
  },
  sectionTitle: { color: "#fff", fontFamily: "Outfit_700Bold", fontSize: 15 },
  divider: { backgroundColor: "#2a2d35" },
  hint: { color: "#6b7280", fontFamily: "Outfit_400Regular", fontSize: 12 },
  saveBtn: { borderRadius: 10 },
})
