"use client"

import { useState, useEffect, useCallback } from "react"
import { trpc } from "@/lib/trpc"
import { format, addDays, subDays, isToday } from "date-fns"
import { pt } from "date-fns/locale"
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, RefreshCwIcon, PlusIcon } from "lucide-react"
import CalendarView, { type BookingBlock } from "./CalendarView"
import AdminBookingSheet from "./AdminBookingSheet"
import AdminBookingCard from "./AdminBookingCard"
import TimeBlockSection from "./TimeBlockSection"
import { Calendar } from "@/app/_components/Calendar"

interface Service {
  id: string
  name: string
  duration: number
  price: number
}

interface Booking {
  id: string
  date: Date | string
  startTime: string
  endTime: string
  status: string
  note: string | null
  services: Array<{
    id: string
    startTime: string
    endTime: string
    service: { id: string; name: string; duration: number; price: number | string }
  }>
  client: { id: string; name: string; phone: string | null } | null
  user: { id: string; name: string | null; image: string | null } | null
}

interface AdminCalendarClientProps {
  initialDate: Date
  initialBookings: Booking[]
  services: Service[]
}

const BOOKING_COLORS = [
  "#EF5350", "#E57373", "#FF7043", "#EC407A",
  "#AB47BC", "#5C6BC0", "#29B6F6", "#26A69A",
]

export default function AdminCalendarClient({
  initialDate,
  initialBookings,
  services,
}: AdminCalendarClientProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [loading, setLoading] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showNewBooking, setShowNewBooking] = useState(false)
  const [initialTime, setInitialTime] = useState<string | undefined>()
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [view, setView] = useState<"calendar" | "list">("calendar")

  const fetchBookings = useCallback(async (date: Date) => {
    setLoading(true)
    try {
      const data = await trpc.admin.getBookingsForDate.query({ date })
      setBookings(data as Booking[])
    } catch {
      // keep previous
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchBookings(selectedDate)
  }, [selectedDate, fetchBookings])

  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
    setShowDatePicker(false)
  }

  const handleTimeClick = (time: string) => {
    setInitialTime(time)
    setShowNewBooking(true)
  }

  let colorIndex = 0
  const calendarBookings: BookingBlock[] = bookings.map((b) => ({
    id: b.id,
    startTime: b.startTime,
    endTime: b.endTime,
    clientName: b.client?.name ?? b.user?.name ?? "Chegada espontânea",
    serviceName: b.services[0]?.service.name ?? "",
    color: b.status === "CANCELLED" ? undefined : BOOKING_COLORS[colorIndex++ % BOOKING_COLORS.length],
    cancelled: b.status === "CANCELLED",
    completed: b.status === "COMPLETED",
  }))

  const confirmed = bookings.filter((b) => b.status === "CONFIRMED").length
  const completed = bookings.filter((b) => b.status === "COMPLETED").length
  const cancelled = bookings.filter((b) => b.status === "CANCELLED").length

  const dateStr = format(selectedDate, "yyyy-MM-dd")

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedDate(subDays(selectedDate, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-colors hover:bg-accent"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>

            <button
              onClick={() => setShowDatePicker((v) => !v)}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors hover:bg-accent"
            >
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold capitalize">
                {isToday(selectedDate)
                  ? "Hoje"
                  : format(selectedDate, "EEEE, d 'de' MMMM", { locale: pt })}
              </span>
            </button>

            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-colors hover:bg-accent"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>

            {!isToday(selectedDate) && (
              <button
                onClick={() => setSelectedDate(new Date())}
                className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-accent"
              >
                Hoje
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setView((v) => (v === "calendar" ? "list" : "calendar"))}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
            >
              {view === "calendar" ? "Lista" : "Agenda"}
            </button>
            <button
              onClick={() => void fetchBookings(selectedDate)}
              disabled={loading}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-colors hover:bg-accent disabled:opacity-50"
              aria-label="Atualizar"
            >
              <RefreshCwIcon className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => { setInitialTime(undefined); setShowNewBooking(true) }}
              className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <PlusIcon className="h-4 w-4" />
              Novo
            </button>
          </div>
        </div>

        {/* Date picker dropdown */}
        {showDatePicker && (
          <div className="absolute z-30 mt-2 rounded-xl border border-border bg-background p-4 shadow-xl">
            <Calendar
              selected={selectedDate}
              onSelect={handleDateChange}
            />
          </div>
        )}

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold text-primary">{confirmed}</p>
            <p className="text-xs text-muted-foreground">Confirmados</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold text-green-500">{completed}</p>
            <p className="text-xs text-muted-foreground">Concluídos</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold text-destructive">{cancelled}</p>
            <p className="text-xs text-muted-foreground">Cancelados</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      {view === "calendar" ? (
        <CalendarView
          date={selectedDate}
          bookings={calendarBookings}
          onBookingClick={(id) => setSelectedBookingId(id)}
          onTimeClick={handleTimeClick}
        />
      ) : (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <button
              onClick={() => { setInitialTime(undefined); setShowNewBooking(true) }}
              className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <PlusIcon className="h-4 w-4" /> Novo agendamento
            </button>
          </div>

          {bookings.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Nenhum agendamento para este dia.
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <AdminBookingCard
                  key={booking.id}
                  booking={booking as Parameters<typeof AdminBookingCard>[0]["booking"]}
                  onUpdate={() => void fetchBookings(selectedDate)}
                />
              ))}
            </div>
          )}

          <div className="mt-6">
            <TimeBlockSection dateStr={dateStr} />
          </div>
        </div>
      )}

      {/* Selected booking detail (simple click-through to AdminBookingCard for now) */}
      {selectedBookingId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedBookingId(null)} />
          <div className="relative z-10 w-full max-w-lg rounded-t-2xl bg-background p-4 pb-8 shadow-xl">
            {(() => {
              const b = bookings.find((b) => b.id === selectedBookingId)
              if (!b) return null
              return (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold">{b.client?.name ?? b.user?.name ?? "Chegada espontânea"}</h3>
                    <button onClick={() => setSelectedBookingId(null)} className="text-muted-foreground">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <AdminBookingCard
                    booking={b as Parameters<typeof AdminBookingCard>[0]["booking"]}
                    onUpdate={() => { setSelectedBookingId(null); void fetchBookings(selectedDate) }}
                  />
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* New booking sheet */}
      <AdminBookingSheet
        open={showNewBooking}
        onOpenChange={(open) => {
          setShowNewBooking(open)
          if (!open) setInitialTime(undefined)
        }}
        date={selectedDate}
        services={services}
        initialTime={initialTime}
        onCreated={() => void fetchBookings(selectedDate)}
      />
    </div>
  )
}
