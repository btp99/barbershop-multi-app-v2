"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCancel = async () => {
    if (!confirm("Tens a certeza que queres cancelar este agendamento?")) return
    setLoading(true)
    try {
      await trpc.booking.delete.mutate({ bookingId })
      toast.success("Agendamento cancelado.")
      router.refresh()
    } catch {
      toast.error("Erro ao cancelar o agendamento.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={() => void handleCancel()}
      disabled={loading}
      className="text-sm text-destructive border border-destructive/50 px-3 py-1.5 rounded-lg hover:bg-destructive/10 disabled:opacity-50 transition-colors"
    >
      {loading ? "A cancelar..." : "Cancelar agendamento"}
    </button>
  )
}
