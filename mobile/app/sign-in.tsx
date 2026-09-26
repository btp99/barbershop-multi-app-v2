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
import { Button, ActivityIndicator } from "react-native-paper"
import { useRouter } from "expo-router"
import { useAuth } from "../context/AuthContext"

export default function SignInScreen() {
  const router = useRouter()
  const { signInGoogle, signInEmail } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Campos obrigatórios", "Preenche o e-mail e a password.")
      return
    }
    setLoading(true)
    try {
      await signInEmail(email.trim().toLowerCase(), password)
      router.replace("/(tabs)")
    } catch (err) {
      Alert.alert("Erro", err instanceof Error ? err.message : "Não foi possível iniciar sessão.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    try {
      await signInGoogle()
      // Navigation handled by _layout guard after user state updates
    } catch (err) {
      Alert.alert("Erro", err instanceof Error ? err.message : "Não foi possível autenticar com Google.")
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Entrar</Text>
        <Text style={styles.sub}>Acede à tua conta para gerir as tuas marcações.</Text>

        {/* Google */}
        <Button
          mode="outlined"
          icon="google"
          onPress={() => void handleGoogleSignIn()}
          loading={googleLoading}
          style={styles.googleBtn}
          textColor="#fff"
          contentStyle={styles.googleContent}
        >
          Continuar com Google
        </Button>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email / password */}
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
          placeholder="A tua password"
          placeholderTextColor="#6b7280"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Button
          mode="contained"
          onPress={() => void handleEmailSignIn()}
          loading={loading}
          disabled={loading}
          style={styles.submitBtn}
          buttonColor="#18B549"
        >
          Entrar
        </Button>

        <TouchableOpacity onPress={() => router.push("/sign-up")} style={styles.linkRow}>
          <Text style={styles.linkText}>
            Não tens conta?{" "}
            <Text style={styles.link}>Criar conta</Text>
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

  googleBtn: { borderColor: "#2a2d35" },
  googleContent: { height: 48 },

  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#2a2d35" },
  dividerText: { color: "#6b7280", fontFamily: "Outfit_400Regular", fontSize: 13 },

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
