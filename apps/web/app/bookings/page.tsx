export const dynamic = "force-dynamic"

import { getServerCaller } from "@/lib/trpc-server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { CalendarIcon } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import CancelBookingButton from "./_components/CancelBookingButton"

export default async function BookingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return (
      <div className="p-5">
        <h1 className="text-xl font-bold mb-3">Meus Agendamentos</h1>
        <p className="text-muted-foreground">
          Precisas de iniciar sessão para veres os teus agendamentos.
        </p>
      </div>
    )
  }

  const caller = await getServerCaller()
  const [confirmed, concluded] = await Promise.all([
    caller.booking.getUserBookings({ type: "confirmed" }),
    caller.booking.getUserBookings({ type: "concluded" }),
  ])

  return (
    <div className="min-h-screen p-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <CalendarIcon className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold">Meus Agendamentos</h1>
      </div>

      {confirmed.length === 0 && concluded.length === 0 && (
        <div className="text-center py-16">
          <CalendarIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Nenhum agendamento encontrado</h2>
          <p className="text-muted-foreground mb-6">
            Ainda não tens agendamentos. Que tal marcar o primeiro horário?
          </p>
          <Link
            href="/"
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-semibold text-sm"
          >
            Agendar agora
          </Link>
        </div>
      )}

      {confirmed.length > 0 && (
        <section className="mb-10">
          <h2 className="font-bold text-lg mb-4">Próximos Agendamentos</h2>
          <div className="space-y-4">
            {confirmed.map((booking) => (
              <div key={booking.id} className="border border-border rounded-xl p-4 bg-card">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {format(new Date(booking.date), "EEEE, d 'de' MMMM", { locale: pt })}
                    </p>
                    <p className="font-bold text-lg">
                      {booking.startTime} – {booking.endTime}
                    </p>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-semibold">
                    Confirmado
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  {booking.services.map((bs) => (
                    <p key={bs.id} className="text-sm text-muted-foreground">
                      {bs.service.name}
                      {bs.service.barbershop && ` — ${bs.service.barbershop.name}`}
                    </p>
                  ))}
                </div>
                <div className="mt-3">
                  <CancelBookingButton bookingId={booking.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {concluded.length > 0 && (
        <section>
          <h2 className="font-bold text-lg mb-4">Histórico</h2>
          <div className="space-y-4">
            {concluded.map((booking) => (
              <div key={booking.id} className="border border-border rounded-xl p-4 bg-card opacity-70">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {format(new Date(booking.date), "EEEE, d 'de' MMMM", { locale: pt })}
                    </p>
                    <p className="font-bold">
                      {booking.startTime} – {booking.endTime}
                    </p>
                  </div>
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                    {booking.status === "COMPLETED" ? "Concluído" : "Cancelado"}
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  {booking.services.map((bs) => (
                    <p key={bs.id} className="text-sm text-muted-foreground">
                      {bs.service.name}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
