import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { useAuth } from "../../context/AuthContext"

export default function ProfileScreen() {
  const { token, signIn, signOut } = useAuth()

  if (!token) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>A tua conta</Text>
        <Text style={styles.sub}>Inicia sessão para acederes ao teu perfil e agendamentos.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => void signIn()}>
          <Text style={styles.btnText}>Iniciar sessão com Google</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.sub}>Sessão iniciada.</Text>
      <TouchableOpacity style={styles.outlineBtn} onPress={() => void signOut()}>
        <Text style={styles.outlineBtnText}>Terminar sessão</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#111216" },
  container: { flex: 1, padding: 24, backgroundColor: "#111216" },
  title: { color: "#fff", fontWeight: "bold", fontSize: 24, marginBottom: 8 },
  sub: { color: "#9ca3af", fontSize: 14, textAlign: "center", marginBottom: 24 },
  btn: { backgroundColor: "#18B549", paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  outlineBtn: { borderWidth: 1, borderColor: "#2a2d35", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, marginTop: 24, alignSelf: "flex-start" },
  outlineBtnText: { color: "#9ca3af", fontSize: 14 },
})
