"use client"

import { useState, useEffect } from "react"
import { trpc } from "@/lib/trpc"
import { PlusIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { formatDuration } from "@barberlab/ui"

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}
function minutesToTime(mins: number) {
  return `${Math.floor(mins / 60).toString().padStart(2, "0")}:${(mins % 60).toString().padStart(2, "0")}`
}

interface Service { id: string; name: string; duration: number }
interface Client { id: string; name: string | null; email: string | null; source: "client" | "user" }

export default function AdminNewBookingForm({ dateStr }: { dateStr: string }) {
  const [open, setOpen] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [serviceId, setServiceId] = useState("")
  const [date, setDate] = useState(dateStr)
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([])
  const [slot, setSlot] = useState("")
  const [clientResults, setClientResults] = useState<Client[]>([])
  const [clientQuery, setClientQuery] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    trpc.barbershop.getAll.query({}).then(async (list) => {
      const first = list[0]
      if (first) {
        const full = await trpc.barbershop.getById.query({ id: first.id })
        if (full) setServices(full.services.map((s) => ({ id: s.id, name: s.name, duration: s.duration })))
      }
    }).catch(() => {})
  }, [open])

  const selectedService = services.find((s) => s.id === serviceId)

  useEffect(() => {
    if (!serviceId || !date || !selectedService) { setSlots([]); return }
    trpc.slots.getSlots.query({ date, duration: selectedService.duration })
      .then((data) => setSlots(data.slots))
      .catch(() => setSlots([]))
  }, [serviceId, date, selectedService])

  useEffect(() => {
    if (!open) return
    trpc.client.search.query({ query: clientQuery })
      .then(setClientResults)
      .catch(() => {})
  }, [clientQuery, open])

  const handleSubmit = async () => {
    if (!serviceId || !date || !slot || !selectedService) {
      toast.error("Seleciona um serviço e um horário.")
      return
    }
    const endTime = minutesToTime(timeToMinutes(slot) + selectedService.duration)
    setLoading(true)
    try {
      await trpc.admin.createBooking.mutate({
        date: new Date(date + "T00:00:00"),
        services: [{ serviceId, startTime: slot, endTime }],
        clientId: selectedClient?.source === "client" ? selectedClient.id : undefined,
        userId: selectedClient?.source === "user" ? selectedClient.id : undefined,
        note: note || undefined,
      })
      toast.success("Agendamento criado!")
      setOpen(false)
      setServiceId(""); setSlot(""); setNote(""); setSelectedClient(null); setClientQuery("")
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : ""
      toast.error(msg.includes("overlap") ? "Conflito de horário." : "Erro ao criar agendamento.")
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border border-dashed border-border rounded-xl px-4 py-3 w-full text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
      >
        <PlusIcon className="w-4 h-4" /> Novo agendamento
      </button>
    )
  }

  return (
    <div className="border border-border rounded-xl p-4 space-y-4 bg-card">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Novo agendamento</h3>
        <button onClick={() => setOpen(false)}><XIcon className="w-4 h-4 text-muted-foreground" /></button>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Serviço</label>
        <select value={serviceId} onChange={(e) => { setServiceId(e.target.value); setSlot("") }} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background">
          <option value="">Selecionar serviço...</option>
          {services.map((s) => <option key={s.id} value={s.id}>{s.name} ({formatDuration(s.duration)})</option>)}
        </select>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Data</label>
        <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setSlot("") }} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
      </div>

      {serviceId && date && (
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Horário</label>
          {slots.filter((s) => s.available).length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem horários disponíveis.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.filter((s) => s.available).map((s) => (
                <button key={s.time} onClick={() => setSlot(s.time)} className={`text-xs py-1.5 rounded-lg border font-medium transition-colors ${slot === s.time ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}>
                  {s.time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Cliente (opcional)</label>
        {selectedClient ? (
          <div className="flex items-center justify-between border border-border rounded-lg px-3 py-2 text-sm">
            <span>{selectedClient.name ?? selectedClient.email}</span>
            <button onClick={() => setSelectedClient(null)}><XIcon className="w-3 h-3" /></button>
          </div>
        ) : (
          <>
            <input type="text" placeholder="Pesquisar cliente..." value={clientQuery} onChange={(e) => setClientQuery(e.target.value)} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
            {clientQuery && clientResults.length > 0 && (
              <div className="mt-1 border border-border rounded-lg overflow-hidden">
                {clientResults.slice(0, 5).map((c) => (
                  <button key={c.id} onClick={() => { setSelectedClient(c); setClientQuery("") }} className="w-full text-left px-3 py-2 text-sm hover:bg-accent border-b border-border last:border-0">
                    {c.name ?? c.email}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Nota (opcional)</label>
        <input type="text" placeholder="..." value={note} onChange={(e) => setNote(e.target.value)} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
      </div>

      <button onClick={() => void handleSubmit()} disabled={loading || !serviceId || !slot} className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 font-semibold text-sm disabled:opacity-50">
        {loading ? "A criar..." : "Criar agendamento"}
      </button>
    </div>
  )
}
