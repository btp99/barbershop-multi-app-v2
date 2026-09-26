import { View, Text, StyleSheet } from "react-native"

type Status = "CONFIRMED" | "COMPLETED" | "CANCELLED"

const LABELS: Record<Status, string> = {
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
}

const COLORS: Record<Status, { bg: string; text: string }> = {
  CONFIRMED: { bg: "rgba(24,181,73,0.15)", text: "#18B549" },
  COMPLETED: { bg: "rgba(107,114,128,0.15)", text: "#9ca3af" },
  CANCELLED: { bg: "rgba(239,68,68,0.15)", text: "#ef4444" },
}

export function StatusBadge({ status }: { status: string }) {
  const s = status as Status
  const colors = COLORS[s] ?? COLORS.CONFIRMED

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        {LABELS[s] ?? status}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  text: {
    fontSize: 11,
    fontFamily: "Outfit_600SemiBold",
  },
})
