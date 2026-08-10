import { useEffect, useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native"
import { useAuth } from "../../context/AuthContext"
import { trpc } from "../../lib/trpc"
import { format } from "date-fns"
import { pt } from "date-fns/locale"

interface Me {
  id: string
  name: string | null
  email: string
  image: string | null
  createdAt: string | Date
}

export default function ProfileScreen() {
  const { token, signIn, signOut } = useAuth()
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
          Inicia sessão para acederes ao teu perfil e agendamentos.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => void signIn()}>
          <Text style={styles.primaryBtnText}>Iniciar sessão com Google</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#18B549" />
      </View>
    )
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      "Eliminar conta",
      "Tens a certeza? Esta ação é permanente. Os teus dados pessoais serão removidos conforme o RGPD.",
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar + info */}
      <View style={styles.card}>
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
      </View>

      {/* Sign out */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sessão</Text>
        <TouchableOpacity style={styles.outlineBtn} onPress={() => void signOut()}>
          <Text style={styles.outlineBtnText}>Terminar sessão</Text>
        </TouchableOpacity>
      </View>

      {/* Danger zone */}
      <View style={[styles.section, styles.dangerSection]}>
        <Text style={styles.dangerTitle}>Zona de perigo</Text>
        <Text style={styles.dangerSub}>
          A eliminação da conta é permanente. O teu histórico de agendamentos é anonimizado
          conforme o RGPD.
        </Text>
        <TouchableOpacity
          style={styles.dangerBtn}
          onPress={handleDeleteAccount}
          disabled={deleting}
        >
          <Text style={styles.dangerBtnText}>
            {deleting ? "A eliminar..." : "Eliminar conta"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111216" },
  content: { padding: 20, gap: 16 },
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
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: "#18B549",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
  },
  primaryBtnText: { color: "#fff", fontFamily: "Outfit_600SemiBold", fontSize: 15 },

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
    backgroundColor: "#18B54933",
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
  outlineBtn: {
    borderWidth: 1,
    borderColor: "#2a2d35",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  outlineBtnText: { color: "#9ca3af", fontFamily: "Outfit_400Regular", fontSize: 14 },

  dangerSection: { borderColor: "#7f1d1d55" },
  dangerTitle: {
    color: "#ef4444",
    fontFamily: "Outfit_600SemiBold",
    fontSize: 15,
  },
  dangerSub: {
    color: "#9ca3af",
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
    lineHeight: 19,
  },
  dangerBtn: {
    backgroundColor: "#7f1d1d33",
    borderWidth: 1,
    borderColor: "#ef444455",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  dangerBtnText: { color: "#ef4444", fontFamily: "Outfit_400Regular", fontSize: 14 },
})
