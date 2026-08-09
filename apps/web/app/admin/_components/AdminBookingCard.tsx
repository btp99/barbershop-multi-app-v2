"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { CheckCircleIcon, XCircleIcon } from "lucide-react"

interface BookingService {
  id: string
  startTime: string
  endTime: string
  service: { name: string }
}

interface Booking {
  id: string
  startTime: string
  endTime: string
  status: string
  user: { name: string | null; email: string } | null
  client: { name: string; phone: string | null } | null
  services: BookingService[]
}

export default function AdminBookingCard({ booking }: { booking: Booking }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const name = booking.client?.name ?? booking.user?.name ?? booking.user?.email ?? "—"
  const phone = booking.client?.phone ?? null

  const handleComplete = async () => {
    setLoading(true)
    try {
      await trpc.admin.completeBooking.mutate({ bookingId: booking.id })
      toast.success("Agendamento marcado como concluído.")
      router.refresh()
    } catch {
      toast.error("Erro ao concluir agendamento.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm("Cancelar este agendamento?")) return
    setLoading(true)
    try {
      await trpc.admin.cancelBooking.mutate({ bookingId: booking.id })
      toast.success("Agendamento cancelado.")
      router.refresh()
    } catch {
      toast.error("Erro ao cancelar agendamento.")
    } finally {
      setLoading(false)
    }
  }

  const statusColor =
    booking.status === "CONFIRMED"
      ? "bg-primary/10 text-primary"
      : booking.status === "COMPLETED"
      ? "bg-green-500/10 text-green-500"
      : "bg-destructive/10 text-destructive"

  const statusLabel =
    booking.status === "CONFIRMED"
      ? "Confirmado"
      : booking.status === "COMPLETED"
      ? "Concluído"
      : "Cancelado"

  return (
    <div className="border border-border rounded-xl p-4 bg-card flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-bold text-lg">{booking.startTime} – {booking.endTime}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
        <p className="font-semibold text-sm">{name}</p>
        {phone && <p className="text-sm text-muted-foreground">{phone}</p>}
        <div className="mt-1 space-y-0.5">
          {booking.services.map((bs) => (
            <p key={bs.id} className="text-xs text-muted-foreground">
              {bs.service.name} ({bs.startTime}–{bs.endTime})
            </p>
          ))}
        </div>
      </div>

      {booking.status === "CONFIRMED" && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => void handleComplete()}
            disabled={loading}
            className="flex items-center gap-1 text-xs text-green-600 border border-green-600/30 px-2.5 py-1.5 rounded-lg hover:bg-green-500/10 disabled:opacity-50 transition-colors"
          >
            <CheckCircleIcon className="w-3.5 h-3.5" />
            Concluir
          </button>
          <button
            onClick={() => void handleCancel()}
            disabled={loading}
            className="flex items-center gap-1 text-xs text-destructive border border-destructive/30 px-2.5 py-1.5 rounded-lg hover:bg-destructive/10 disabled:opacity-50 transition-colors"
          >
            <XCircleIcon className="w-3.5 h-3.5" />
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}
