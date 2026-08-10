import { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
  format,
  addMonths,
  subMonths,
} from "date-fns"
import { pt } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react-native"

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date) => void
  disabled?: (date: Date) => boolean
}

export function Calendar({ selected, onSelect, disabled }: CalendarProps) {
  const [month, setMonth] = useState<Date>(selected ?? new Date())

  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 0 }),
    end: endOfWeek(monthEnd, { weekStartsOn: 0 }),
  })

  const canGoPrev = !isBefore(
    startOfMonth(subMonths(month, 1)),
    startOfMonth(new Date())
  )

  return (
    <View style={styles.container}>
      {/* Month navigation */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setMonth(subMonths(month, 1))}
          disabled={!canGoPrev}
          style={styles.navBtn}
        >
          <ChevronLeft size={18} color={canGoPrev ? "#fff" : "#3a3d46"} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>
          {format(month, "MMMM yyyy", { locale: pt })}
        </Text>
        <TouchableOpacity onPress={() => setMonth(addMonths(month, 1))} style={styles.navBtn}>
          <ChevronRight size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Weekday headers */}
      <View style={styles.weekRow}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={styles.weekday}>
            {d}
          </Text>
        ))}
      </View>

      {/* Day grid */}
      <View style={styles.grid}>
        {days.map((day) => {
          if (!isSameMonth(day, month)) {
            return <View key={day.toISOString()} style={styles.cell} />
          }

          const isSelected = selected ? isSameDay(day, selected) : false
          const isDisabled = disabled ? disabled(day) : false
          const isTodayDay = isToday(day)

          return (
            <TouchableOpacity
              key={day.toISOString()}
              onPress={() => !isDisabled && onSelect?.(day)}
              disabled={isDisabled}
              style={[
                styles.cell,
                styles.dayCell,
                isSelected && styles.dayCellSelected,
                !isSelected && isTodayDay && styles.dayCellToday,
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayText,
                  isSelected && styles.dayTextSelected,
                  !isSelected && isTodayDay && styles.dayTextToday,
                  isDisabled && styles.dayTextDisabled,
                ]}
              >
                {format(day, "d")}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const CELL_SIZE = `${(100 / 7).toFixed(4)}%` as `${number}%`

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#17191f",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2a2d35",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2a2d35",
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: {
    color: "#fff",
    fontFamily: "Outfit_600SemiBold",
    fontSize: 15,
    textTransform: "capitalize",
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  weekday: {
    width: CELL_SIZE,
    textAlign: "center",
    color: "#6b7280",
    fontFamily: "Outfit_400Regular",
    fontSize: 11,
    paddingVertical: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: CELL_SIZE,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCell: {
    borderRadius: 8,
  },
  dayCellSelected: {
    backgroundColor: "#18B549",
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: "#18B549",
  },
  dayText: {
    color: "#fff",
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
  },
  dayTextSelected: {
    color: "#fff",
    fontFamily: "Outfit_600SemiBold",
  },
  dayTextToday: {
    color: "#18B549",
    fontFamily: "Outfit_600SemiBold",
  },
  dayTextDisabled: {
    color: "#3a3d46",
  },
})
