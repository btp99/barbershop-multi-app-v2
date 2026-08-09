export const dynamic = "force-dynamic"

import { getServerCaller } from "@/lib/trpc-server"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

export default async function ClientDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const caller = await getServerCaller()
  const client = await caller.client.getById({ id })
  if (!client) notFound()

  const confirmed = client.bookings.filter((b) => b.status === "CONFIRMED")
  const past = client.bookings.filter((b) => b.status !== "CONFIRMED")

  return (
    <div className="p-6 max-w-2xl space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/admin/clients" className="p-2 rounded-lg border border-border hover:bg-accent transition-colors">
          <ArrowLeftIcon className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-bold">{client.name}</h1>
      </div>

      <div className="border border-border rounded-xl p-5 space-y-2">
        {client.email && (
          <p className="text-sm"><span className="text-muted-foreground">Email: </span>{client.email}</p>
        )}
        {client.phone && (
          <p className="text-sm"><span className="text-muted-foreground">Telefone: </span>{client.phone}</p>
        )}
        {client.notes && (
          <p className="text-sm"><span className="text-muted-foreground">Notas: </span>{client.notes}</p>
        )}
        <p className="text-sm"><span className="text-muted-foreground">Total de agendamentos: </span>{client.bookings.length}</p>
      </div>

      {confirmed.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Agendamentos futuros</h2>
          <div className="space-y-3">
            {confirmed.map((b) => (
              <div key={b.id} className="border border-border rounded-xl p-4 bg-card">
                <p className="font-semibold text-sm">
                  {format(new Date(b.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt })}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">{b.startTime} – {b.endTime}</p>
                <div className="mt-2 space-y-1">
                  {b.services.map((bs) => (
                    <p key={bs.id} className="text-sm text-muted-foreground">· {bs.service.name}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">Histórico</h2>
        {past.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sem histórico de agendamentos.</p>
        ) : (
          <div className="space-y-3">
            {past.map((b) => (
              <div key={b.id} className="border border-border rounded-xl p-4 bg-card opacity-75">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">
                      {format(new Date(b.date), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                    </p>
                    <p className="text-muted-foreground text-xs mt-0.5">{b.startTime} – {b.endTime}</p>
                    <div className="mt-2 space-y-1">
                      {b.services.map((bs) => (
                        <p key={bs.id} className="text-sm text-muted-foreground">· {bs.service.name}</p>
                      ))}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${b.status === "COMPLETED" ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"}`}>
                    {b.status === "COMPLETED" ? "Concluído" : "Cancelado"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
