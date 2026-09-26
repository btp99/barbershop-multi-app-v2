import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { StatusBadge } from "./StatusBadge"

interface BookingService {
  id: string
  service: { name: string; price?: number | string }
}

interface BookingCardProps {
  id: string
  date: string | Date
  startTime: string
  endTime: string
  status: string
  services: BookingService[]
  clientName?: string | null
  onPress?: () => void
  onCancel?: () => void
  dimIfPast?: boolean
}

export function BookingCard({
  date,
  startTime,
  endTime,
  status,
  services,
  clientName,
  onPress,
  onCancel,
  dimIfPast = true,
}: BookingCardProps) {
  const isPast = status !== "CONFIRMED"
  const dim = dimIfPast && isPast

  return (
    <TouchableOpacity
      style={[styles.card, dim && styles.cardDim]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.date}>
            {format(new Date(date), "EEEE, d 'de' MMMM", { locale: pt })}
          </Text>
          <Text style={styles.time}>
            {startTime} – {endTime}
          </Text>
        </View>
        <StatusBadge status={status} />
      </View>

      {clientName && (
        <Text style={styles.client}>{clientName}</Text>
      )}

      <View style={styles.services}>
        {services.map((bs) => (
          <Text key={bs.id} style={styles.service}>
            {bs.service.name}
          </Text>
        ))}
      </View>

      {onCancel && status === "CONFIRMED" && (
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancelar marcação</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1c1f26",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2d35",
    gap: 6,
  },
  cardDim: { opacity: 0.6 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  date: {
    color: "#9ca3af",
    fontSize: 12,
    fontFamily: "Outfit_400Regular",
    textTransform: "capitalize",
  },
  time: {
    color: "#fff",
    fontFamily: "Outfit_700Bold",
    fontSize: 17,
    marginTop: 2,
  },
  client: {
    color: "#18B549",
    fontFamily: "Outfit_600SemiBold",
    fontSize: 13,
  },
  services: { gap: 2 },
  service: {
    color: "#9ca3af",
    fontSize: 13,
    fontFamily: "Outfit_400Regular",
  },
  cancelBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.4)",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  cancelText: {
    color: "#ef4444",
    fontSize: 13,
    fontFamily: "Outfit_600SemiBold",
  },
})
