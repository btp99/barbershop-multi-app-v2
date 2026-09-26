import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native"
import { Button } from "react-native-paper"
import { useRouter } from "expo-router"
import { useAuth } from "../context/AuthContext"

export default function SignUpScreen() {
  const router = useRouter()
  const { signUpEmail } = useAuth()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert("Campos obrigatórios", "Preenche todos os campos.")
      return
    }
    if (password !== confirm) {
      Alert.alert("Passwords diferentes", "As passwords não coincidem.")
      return
    }
    if (password.length < 8) {
      Alert.alert("Password curta", "A password deve ter pelo menos 8 caracteres.")
      return
    }

    setLoading(true)
    try {
      await signUpEmail(name.trim(), email.trim().toLowerCase(), password)
      // NavigationGuard in _layout will redirect to complete-profile if phone is missing
    } catch (err) {
      Alert.alert("Erro", err instanceof Error ? err.message : "Não foi possível criar a conta.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Criar conta</Text>
        <Text style={styles.sub}>Regista-te para fazeres marcações e acompanhar o teu histórico.</Text>

        <Text style={styles.label}>Nome</Text>
        <TextInput
          style={styles.input}
          placeholder="O teu nome"
          placeholderTextColor="#6b7280"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          placeholder="o.teu@email.com"
          placeholderTextColor="#6b7280"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Mínimo 8 caracteres"
          placeholderTextColor="#6b7280"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.label}>Confirmar password</Text>
        <TextInput
          style={styles.input}
          placeholder="Repete a password"
          placeholderTextColor="#6b7280"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
        />

        <Button
          mode="contained"
          onPress={() => void handleSignUp()}
          loading={loading}
          disabled={loading}
          style={styles.submitBtn}
          buttonColor="#18B549"
        >
          Criar conta
        </Button>

        <TouchableOpacity onPress={() => router.back()} style={styles.linkRow}>
          <Text style={styles.linkText}>
            Já tens conta?{" "}
            <Text style={styles.link}>Entrar</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#111216" },
  container: { padding: 24, paddingTop: 32, gap: 12 },
  title: { color: "#fff", fontFamily: "Outfit_700Bold", fontSize: 26, marginBottom: 4 },
  sub: { color: "#9ca3af", fontFamily: "Outfit_400Regular", fontSize: 14, marginBottom: 8 },

  label: { color: "#d1d5db", fontFamily: "Outfit_400Regular", fontSize: 13, marginTop: 4 },
  input: {
    backgroundColor: "#17191f",
    borderWidth: 1,
    borderColor: "#2a2d35",
    borderRadius: 10,
    color: "#fff",
    fontFamily: "Outfit_400Regular",
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  submitBtn: { marginTop: 8 },

  linkRow: { alignItems: "center", marginTop: 12 },
  linkText: { color: "#9ca3af", fontFamily: "Outfit_400Regular", fontSize: 14 },
  link: { color: "#18B549", fontFamily: "Outfit_600SemiBold" },
})
