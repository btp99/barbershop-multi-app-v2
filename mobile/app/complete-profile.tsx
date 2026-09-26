import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native"
import { Button } from "react-native-paper"
import { useRouter } from "expo-router"
import { useAuth } from "../context/AuthContext"
import { trpc } from "../lib/trpc"

export default function CompleteProfileScreen() {
  const router = useRouter()
  const { refreshUser } = useAuth()

  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    const cleaned = phone.trim().replace(/\s/g, "")
    if (cleaned.length < 7) {
      Alert.alert("Número inválido", "Introduz um número de telefone válido.")
      return
    }
    setLoading(true)
    try {
      await trpc.user.updatePhone.mutate({ phone: cleaned })
      await refreshUser()
      router.replace("/(tabs)")
    } catch {
      Alert.alert("Erro", "Não foi possível guardar o número. Tenta novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Falta um detalhe</Text>
        <Text style={styles.sub}>
          O teu número de telefone é necessário para que possamos contactar-te caso haja alguma alteração à tua marcação.
        </Text>
        <Text style={styles.sub2}>Não enviaremos SMS nem partilharemos o número com terceiros.</Text>

        <Text style={styles.label}>Número de telefone</Text>
        <TextInput
          style={styles.input}
          placeholder="+351 912 345 678"
          placeholderTextColor="#6b7280"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoFocus
        />

        <Button
          mode="contained"
          onPress={() => void handleSave()}
          loading={loading}
          disabled={loading}
          style={styles.btn}
          buttonColor="#18B549"
        >
          Guardar e continuar
        </Button>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#111216" },
  container: { flex: 1, padding: 24, paddingTop: 32, gap: 14 },
  title: { color: "#fff", fontFamily: "Outfit_700Bold", fontSize: 26, marginBottom: 4 },
  sub: { color: "#9ca3af", fontFamily: "Outfit_400Regular", fontSize: 14, lineHeight: 21 },
  sub2: { color: "#6b7280", fontFamily: "Outfit_400Regular", fontSize: 12 },
  label: { color: "#d1d5db", fontFamily: "Outfit_400Regular", fontSize: 13, marginTop: 8 },
  input: {
    backgroundColor: "#17191f",
    borderWidth: 1,
    borderColor: "#2a2d35",
    borderRadius: 10,
    color: "#fff",
    fontFamily: "Outfit_400Regular",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  btn: { marginTop: 8 },
})
