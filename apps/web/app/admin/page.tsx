export const dynamic = "force-dynamic"

import { getServerCaller } from "@/lib/trpc-server"
import { format, addDays, subDays } from "date-fns"
import { pt } from "date-fns/locale"
import Link from "next/link"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import AdminBookingCard from "./_components/AdminBookingCard"
import TimeBlockSection from "./_components/TimeBlockSection"
import AdminNewBookingForm from "./_components/AdminNewBookingForm"

interface AdminPageProps {
  searchParams?: Promise<{ date?: string }>
}

export default async function AdminPage(props: AdminPageProps) {
  const searchParams = await props.searchParams
  const dateStr = searchParams?.date ?? new Date().toISOString().split("T")[0]
  const date = new Date(dateStr + "T00:00:00")

  const caller = await getServerCaller()
  const bookings = await caller.admin.getBookingsForDate({ date })

  const prevDate = format(subDays(date, 1), "yyyy-MM-dd")
  const nextDate = format(addDays(date, 1), "yyyy-MM-dd")

  const confirmed = bookings.filter((b) => b.status === "CONFIRMED").length
  const completed = bookings.filter((b) => b.status === "COMPLETED").length
  const cancelled = bookings.filter((b) => b.status === "CANCELLED").length

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Agenda</h1>
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/admin?date=${prevDate}`}
          className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </Link>
        <h2 className="font-semibold text-lg capitalize min-w-[220px] text-center">
          {format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt })}
        </h2>
        <Link
          href={`/admin?date=${nextDate}`}
          className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border border-border rounded-xl p-4 bg-card text-center">
          <p className="text-2xl font-bold text-primary">{confirmed}</p>
          <p className="text-sm text-muted-foreground mt-1">Confirmados</p>
        </div>
        <div className="border border-border rounded-xl p-4 bg-card text-center">
          <p className="text-2xl font-bold text-green-500">{completed}</p>
          <p className="text-sm text-muted-foreground mt-1">Concluídos</p>
        </div>
        <div className="border border-border rounded-xl p-4 bg-card text-center">
          <p className="text-2xl font-bold text-destructive">{cancelled}</p>
          <p className="text-sm text-muted-foreground mt-1">Cancelados</p>
        </div>
      </div>

      {/* New booking */}
      <div className="mb-6">
        <AdminNewBookingForm dateStr={dateStr} />
      </div>

      {/* Bookings list */}
      {bookings.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum agendamento para este dia.
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {bookings.map((booking) => (
            <AdminBookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}

      {/* Time blocks */}
      <TimeBlockSection dateStr={dateStr} />
    </div>
  )
}
