import { useCallback, useState } from "react"
import { View, Text, ScrollView, StyleSheet } from "react-native"
import { useFocusEffect } from "expo-router"
import { ActivityIndicator, Surface } from "react-native-paper"
import { format, getDaysInMonth } from "date-fns"
import { pt } from "date-fns/locale"
import { trpc } from "../../../lib/trpc"

export default function AdminStatsScreen() {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      trpc.admin.getBookingCounts
        .query({ year, month })
        .then((data) => setCounts(data))
        .catch(() => {})
        .finally(() => setLoading(false))
    }, [year, month])
  )

  const days = getDaysInMonth(today)
  const dayKeys = Array.from({ length: days }, (_, i) => {
    const d = new Date(year, month - 1, i + 1)
    return format(d, "yyyy-MM-dd")
  })

  const total = Object.values(counts).reduce((s, v) => s + v, 0)
  const maxDay = Math.max(...Object.values(counts), 1)
  const avg = total > 0 ? (total / days).toFixed(1) : "0"

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#18B549" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.monthLabel}>
        {format(today, "MMMM 'de' yyyy", { locale: pt })}
      </Text>

      {/* Summary */}
      <View style={styles.statsRow}>
        <Surface style={styles.statCard} elevation={0}>
          <Text style={styles.statNumber}>{total}</Text>
          <Text style={styles.statLabel}>Marcações este mês</Text>
        </Surface>
        <Surface style={[styles.statCard, { borderColor: "#18B54944" }]} elevation={0}>
          <Text style={[styles.statNumber, { color: "#18B549" }]}>{avg}</Text>
          <Text style={styles.statLabel}>Média por dia</Text>
        </Surface>
      </View>

      {/* Per-day chart */}
      <Text style={styles.sectionTitle}>Por dia</Text>

      {total === 0 ? (
        <Text style={styles.empty}>Sem marcações este mês.</Text>
      ) : (
        <View style={styles.chart}>
          {dayKeys.map((key) => {
            const count = counts[key] ?? 0
            if (count === 0) return null
            const d = new Date(key + "T00:00:00")
            const width = `${(count / maxDay) * 100}%` as `${number}%`
            return (
              <View key={key} style={styles.chartRow}>
                <Text style={styles.chartDate} numberOfLines={1}>
                  {format(d, "d 'de' MMMM", { locale: pt })}
                </Text>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { width }]} />
                </View>
                <Text style={styles.chartCount}>{count}</Text>
              </View>
            )
          })}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#111216" },
  scroll: { flex: 1, backgroundColor: "#111216" },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  monthLabel: {
    color: "#9ca3af",
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
    textTransform: "capitalize",
  },
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: "#17191f",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2d35",
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  statNumber: { color: "#fff", fontFamily: "Outfit_700Bold", fontSize: 28 },
  statLabel: {
    color: "#9ca3af",
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
    textAlign: "center",
  },
  sectionTitle: { color: "#fff", fontFamily: "Outfit_700Bold", fontSize: 16 },
  chart: { gap: 10 },
  chartRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  chartDate: {
    color: "#9ca3af",
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
    width: 100,
    textTransform: "capitalize",
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: "#1c1f26",
    borderRadius: 100,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    backgroundColor: "#18B549",
    borderRadius: 100,
  },
  chartCount: {
    color: "#fff",
    fontFamily: "Outfit_600SemiBold",
    fontSize: 12,
    width: 20,
    textAlign: "right",
  },
  empty: { color: "#6b7280", fontFamily: "Outfit_400Regular", fontSize: 14 },
})
