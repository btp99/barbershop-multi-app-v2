"use client"

import { useEffect, useRef } from "react"
import { format, isSameDay } from "date-fns"

export interface BookingBlock {
  id: string
  startTime: string
  endTime: string
  clientName: string
  serviceName: string
  color?: string
  cancelled?: boolean
  completed?: boolean
}

interface CalendarViewProps {
  date: Date
  bookings: BookingBlock[]
  onBookingClick: (bookingId: string) => void
  onTimeClick?: (time: string) => void
}

const HOUR_HEIGHT = 80
const START_HOUR = 8
const END_HOUR = 22

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

function minutesToPx(minutes: number) {
  return (minutes / 60) * HOUR_HEIGHT
}

function pxToTime(y: number): string {
  const totalMinutes =
    Math.round(((y / HOUR_HEIGHT) * 60) / 5) * 5 + START_HOUR * 60
  const clamped = Math.max(
    START_HOUR * 60,
    Math.min((END_HOUR - 1) * 60 + 55, totalMinutes),
  )
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

export default function CalendarView({
  date,
  bookings,
  onBookingClick,
  onTimeClick,
}: CalendarViewProps) {
  const nowRef = useRef<HTMLDivElement>(null)

  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i,
  )

  const now = new Date()
  const isToday = isSameDay(date, now)
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const nowOffset = minutesToPx(nowMinutes - START_HOUR * 60)

  useEffect(() => {
    if (isToday && nowRef.current) {
      nowRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [isToday])

  const totalHeight = minutesToPx((END_HOUR - START_HOUR) * 60)

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="relative flex" style={{ height: totalHeight }}>
        {/* Time labels */}
        <div className="relative w-14 flex-shrink-0">
          {hours.map((hour) => {
            const top = minutesToPx((hour - START_HOUR) * 60)
            return (
              <div
                key={hour}
                className="absolute right-2 text-xs text-muted-foreground"
                style={{ top: top - 8 }}
              >
                {hour === START_HOUR
                  ? null
                  : `${hour.toString().padStart(2, "0")}:00`}
              </div>
            )
          })}

          {isToday && nowOffset >= 0 && (
            <div
              className="absolute right-1 text-xs font-semibold text-red-500"
              style={{ top: nowOffset - 8 }}
            >
              {format(now, "HH:mm")}
            </div>
          )}
        </div>

        {/* Grid + bookings */}
        <div
          className="relative flex-1 border-l border-border"
          onClick={(e) => {
            if (!onTimeClick) return
            const rect = e.currentTarget.getBoundingClientRect()
            const y = e.clientY - rect.top
            onTimeClick(pxToTime(y))
          }}
        >
          {/* Hour lines */}
          {hours.map((hour) => {
            const top = minutesToPx((hour - START_HOUR) * 60)
            return (
              <div key={hour}>
                <div
                  className="absolute inset-x-0 border-t border-border"
                  style={{ top }}
                />
                <div
                  className="absolute inset-x-0 border-t border-dashed border-border/40"
                  style={{ top: top + HOUR_HEIGHT / 2 }}
                />
              </div>
            )
          })}

          {/* Now line */}
          {isToday && nowOffset >= 0 && (
            <div
              ref={nowRef}
              className="pointer-events-none absolute inset-x-0 flex items-center"
              style={{ top: nowOffset }}
            >
              <div className="-ml-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-red-500" />
              <div className="h-px flex-1 bg-red-500" />
            </div>
          )}

          {/* Booking blocks */}
          {bookings.map((booking) => {
            const startMin = timeToMinutes(booking.startTime)
            const endMin = timeToMinutes(booking.endTime)
            const top = minutesToPx(startMin - START_HOUR * 60)
            const height = Math.max(minutesToPx(endMin - startMin), 36)

            if (booking.cancelled) {
              return (
                <button
                  key={booking.id}
                  className="absolute left-1 right-1 overflow-hidden rounded-md border border-dashed border-border px-2 py-1 text-left opacity-40"
                  style={{ top, height }}
                  onClick={(e) => { e.stopPropagation(); onBookingClick(booking.id) }}
                >
                  <p className="text-xs font-semibold leading-tight text-muted-foreground line-through">
                    {booking.startTime} - {booking.endTime}
                  </p>
                  <p className="truncate text-xs leading-tight text-muted-foreground">{booking.clientName}</p>
                </button>
              )
            }

            if (booking.completed) {
              return (
                <button
                  key={booking.id}
                  className="absolute left-1 right-1 overflow-hidden rounded-md px-2 py-1 text-left text-white opacity-60"
                  style={{ top, height, backgroundColor: booking.color ?? "#6B7280" }}
                  onClick={(e) => { e.stopPropagation(); onBookingClick(booking.id) }}
                >
                  <p className="text-xs font-semibold leading-tight">✓ {booking.startTime} - {booking.endTime}</p>
                  <p className="truncate text-xs leading-tight">{booking.clientName}</p>
                  <p className="truncate text-xs leading-tight opacity-80">{booking.serviceName}</p>
                </button>
              )
            }

            return (
              <button
                key={booking.id}
                className="absolute left-1 right-1 overflow-hidden rounded-md px-2 py-1 text-left text-white shadow-sm transition-opacity hover:opacity-90"
                style={{ top, height, backgroundColor: booking.color ?? "#E57373" }}
                onClick={(e) => { e.stopPropagation(); onBookingClick(booking.id) }}
              >
                <p className="text-xs font-semibold leading-tight">{booking.startTime} - {booking.endTime}</p>
                <p className="truncate text-xs leading-tight">{booking.clientName}</p>
                <p className="truncate text-xs leading-tight opacity-80">{booking.serviceName}</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
