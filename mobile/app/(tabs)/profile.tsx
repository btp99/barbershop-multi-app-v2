import { useEffect, useState } from "react"
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  Share,
} from "react-native"
import { Button, Surface, Divider, ActivityIndicator } from "react-native-paper"
import { useRouter } from "expo-router"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { trpc } from "../../lib/trpc"
import { useAuth } from "../../context/AuthContext"

interface Me {
  id: string
  name: string | null
  email: string
  image: string | null
  createdAt: string | Date
}

export default function ProfileScreen() {
  const { token, signOut } = useAuth()
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    trpc.user.getMe
      .query()
      .then((data) => setMe(data as Me))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  if (!token) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>A tua conta</Text>
        <Text style={styles.sub}>
          Inicia sessão para acederes ao teu perfil e marcações.
        </Text>
        <Button mode="contained" onPress={() => router.push("/sign-in")} style={{ marginTop: 20 }}>
          Entrar
        </Button>
      </View>
    )
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#18B549" /></View>
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      "Eliminar conta",
      "Tens a certeza? Esta ação é permanente. Os teus dados pessoais serão removidos conforme o RGPD. O histórico de marcações será anonimizado.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setDeleting(true)
            try {
              await trpc.user.deleteAccount.mutate()
              await signOut()
            } catch {
              Alert.alert("Erro", "Não foi possível eliminar a conta. Tenta novamente.")
              setDeleting(false)
            }
          },
        },
      ]
    )
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const data = await trpc.user.exportData.query()
      await Share.share({
        title: "Os meus dados pessoais",
        message: JSON.stringify(data, null, 2),
      })
    } catch {
      Alert.alert("Erro", "Não foi possível exportar os dados.")
    } finally {
      setExporting(false)
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Avatar + info */}
      <Surface style={styles.card} elevation={0}>
        {me?.image ? (
          <Image source={{ uri: me.image }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {(me?.name ?? me?.email ?? "?")[0].toUpperCase()}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{me?.name ?? "—"}</Text>
          <Text style={styles.email}>{me?.email}</Text>
          {me?.createdAt && (
            <Text style={styles.since}>
              Membro desde{" "}
              {format(new Date(me.createdAt), "MMMM 'de' yyyy", { locale: pt })}
            </Text>
          )}
        </View>
      </Surface>

      {/* Session */}
      <Surface style={styles.section} elevation={0}>
        <Text style={styles.sectionTitle}>Sessão</Text>
        <Divider style={styles.divider} />
        <Button
          mode="outlined"
          onPress={() => void signOut()}
          style={styles.outlineBtn}
          textColor="#9ca3af"
        >
          Terminar sessão
        </Button>
      </Surface>

      {/* Data export */}
      <Surface style={styles.section} elevation={0}>
        <Text style={styles.sectionTitle}>Os meus dados</Text>
        <Text style={styles.sectionSub}>
          Exporta uma cópia de todos os teus dados pessoais conforme o artigo 20.º do RGPD.
        </Text>
        <Divider style={styles.divider} />
        <Button
          mode="outlined"
          onPress={() => void handleExport()}
          loading={exporting}
          style={styles.outlineBtn}
          textColor="#9ca3af"
        >
          {exporting ? "A exportar..." : "Exportar dados"}
        </Button>
      </Surface>

      {/* Danger zone */}
      <Surface style={[styles.section, styles.dangerSection]} elevation={0}>
        <Text style={styles.dangerTitle}>Zona de perigo</Text>
        <Text style={styles.sectionSub}>
          A eliminação é permanente. O histórico de marcações é anonimizado conforme o RGPD.
        </Text>
        <Divider style={[styles.divider, { backgroundColor: "#7f1d1d44" }]} />
        <Button
          mode="outlined"
          onPress={handleDeleteAccount}
          loading={deleting}
          style={[styles.outlineBtn, styles.dangerBtn]}
          textColor="#ef4444"
        >
          {deleting ? "A eliminar..." : "Eliminar conta"}
        </Button>
      </Surface>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#111216" },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#111216",
  },
  title: { color: "#fff", fontFamily: "Outfit_700Bold", fontSize: 24, marginBottom: 8 },
  sub: {
    color: "#9ca3af",
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    textAlign: "center",
  },

  card: {
    backgroundColor: "#17191f",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2d35",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(24,181,73,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { color: "#18B549", fontFamily: "Outfit_700Bold", fontSize: 22 },
  name: { color: "#fff", fontFamily: "Outfit_600SemiBold", fontSize: 16 },
  email: { color: "#9ca3af", fontFamily: "Outfit_400Regular", fontSize: 13, marginTop: 2 },
  since: { color: "#6b7280", fontFamily: "Outfit_400Regular", fontSize: 12, marginTop: 4 },

  section: {
    backgroundColor: "#17191f",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2d35",
    padding: 16,
    gap: 10,
  },
  sectionTitle: { color: "#fff", fontFamily: "Outfit_600SemiBold", fontSize: 15 },
  sectionSub: { color: "#9ca3af", fontFamily: "Outfit_400Regular", fontSize: 13, lineHeight: 19 },
  divider: { backgroundColor: "#2a2d35" },
  outlineBtn: { alignSelf: "flex-start", borderColor: "#2a2d35" },

  dangerSection: { borderColor: "#7f1d1d55" },
  dangerTitle: { color: "#ef4444", fontFamily: "Outfit_600SemiBold", fontSize: 15 },
  dangerBtn: { borderColor: "rgba(239,68,68,0.4)" },
})
