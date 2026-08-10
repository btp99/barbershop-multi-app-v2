"use client"

import { useState } from "react"
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
  addMonths,
  subMonths,
} from "date-fns"
import { pt } from "date-fns/locale"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

const WEEKDAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date) => void
  disabled?: (date: Date) => boolean
  className?: string
}

export function Calendar({ selected, onSelect, disabled, className }: CalendarProps) {
  const [month, setMonth] = useState(selected ?? new Date())

  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  return (
    <div className={`w-full select-none ${className ?? ""}`}>
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setMonth(subMonths(month, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-colors hover:bg-accent"
          aria-label="Mês anterior"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold capitalize">
          {format(month, "MMMM yyyy", { locale: pt })}
        </span>
        <button
          onClick={() => setMonth(addMonths(month, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-colors hover:bg-accent"
          aria-label="Próximo mês"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7">
        {WEEKDAY_NAMES.map((d) => (
          <div key={d} className="py-1 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((day) => {
          const inMonth = isSameMonth(day, month)
          const isSelected = selected ? isSameDay(day, selected) : false
          const isDisabled = disabled ? disabled(day) : false
          const isTodayDay = isToday(day)

          if (!inMonth) {
            return <div key={day.toISOString()} />
          }

          return (
            <button
              key={day.toISOString()}
              onClick={() => { if (!isDisabled) onSelect?.(day) }}
              disabled={isDisabled}
              className={[
                "h-9 w-full rounded-lg text-sm font-medium transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : isDisabled
                    ? "cursor-not-allowed text-muted-foreground/30"
                    : isTodayDay
                      ? "font-bold text-primary hover:bg-accent"
                      : "hover:bg-accent",
              ].join(" ")}
            >
              {format(day, "d")}
            </button>
          )
        })}
      </div>
    </div>
  )
}
