"use client"

import { useState, useEffect } from "react"
import { trpc } from "@/lib/trpc"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { XIcon, PlusIcon, ChevronRightIcon, UserIcon } from "lucide-react"
import { toast } from "sonner"
import { formatDuration, formatPrice } from "@barberlab/ui"

interface Service {
  id: string
  name: string
  duration: number
  price: number
}

interface SelectedService {
  service: Service
  startTime: string
  endTime: string
}

interface Client {
  id: string
  name: string | null
  email: string | null
  source: "client" | "user"
}

interface AdminBookingSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: Date
  services: Service[]
  initialTime?: string
  onCreated?: () => void
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

function addMinutes(time: string, minutes: number): string {
  const total = timeToMinutes(time) + minutes
  const h = Math.floor(total / 60) % 24
  const m = total % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

function TimeInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex-1">
      <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
      />
    </div>
  )
}

export default function AdminBookingSheet({
  open,
  onOpenChange,
  date,
  services,
  initialTime,
  onCreated,
}: AdminBookingSheetProps) {
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([])
  const [showServicePicker, setShowServicePicker] = useState(false)
  const [serviceSearch, setServiceSearch] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientQuery, setClientQuery] = useState("")
  const [clientResults, setClientResults] = useState<Client[]>([])
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedServices([])
      setSelectedClient(null)
      setClientQuery("")
      setNote("")
      setShowServicePicker(false)
      setServiceSearch("")
    }
  }, [open])

  useEffect(() => {
    if (!clientQuery.trim()) { setClientResults([]); return }
    trpc.client.search.query({ query: clientQuery })
      .then(setClientResults)
      .catch(() => {})
  }, [clientQuery])

  const handleAddService = (service: Service) => {
    const last = selectedServices[selectedServices.length - 1]
    const startTime = last ? last.endTime : (initialTime ?? "10:00")
    const endTime = addMinutes(startTime, service.duration)
    setSelectedServices((prev) => [...prev, { service, startTime, endTime }])
    setShowServicePicker(false)
    setServiceSearch("")
  }

  const handleRemoveService = (index: number) => {
    setSelectedServices((prev) => prev.filter((_, i) => i !== index))
  }

  const updateTime = (index: number, field: "startTime" | "endTime", value: string) => {
    setSelectedServices((prev) => {
      const updated = [...prev]
      if (field === "startTime") {
        updated[index] = {
          ...updated[index],
          startTime: value,
          endTime: addMinutes(value, updated[index].service.duration),
        }
      } else {
        updated[index] = { ...updated[index], endTime: value }
      }
      return updated
    })
  }

  const handleSave = async () => {
    if (selectedServices.length === 0) return
    setLoading(true)
    try {
      await trpc.admin.createBooking.mutate({
        date,
        services: selectedServices.map((s) => ({
          serviceId: s.service.id,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
        clientId: selectedClient?.source === "client" ? selectedClient.id : undefined,
        userId: selectedClient?.source === "user" ? selectedClient.id : undefined,
        note: note || undefined,
      })
      toast.success("Agendamento criado com sucesso!")
      onCreated?.()
      onOpenChange(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ""
      toast.error(msg.includes("overlap") ? "Conflito de horário. Escolha outro horário." : "Erro ao criar agendamento.")
    } finally {
      setLoading(false)
    }
  }

  const totalPrice = selectedServices.reduce((sum, s) => sum + s.service.price, 0)

  if (!open) return null

  // Service picker overlay
  if (showServicePicker) {
    const picked = new Set(selectedServices.map((s) => s.service.id))
    const filtered = services.filter(
      (s) => !picked.has(s.id) && s.name.toLowerCase().includes(serviceSearch.toLowerCase()),
    )
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={() => setShowServicePicker(false)} />
        <div className="relative z-10 w-full max-w-lg rounded-t-2xl bg-background p-4 pb-8 shadow-xl">
          <div className="mb-4 flex items-center gap-3">
            <button onClick={() => setShowServicePicker(false)} className="text-muted-foreground hover:text-foreground">
              <XIcon className="h-5 w-5" />
            </button>
            <h3 className="font-semibold">Selecionar serviço</h3>
          </div>
          <input
            type="text"
            placeholder="Pesquisar..."
            value={serviceSearch}
            onChange={(e) => setServiceSearch(e.target.value)}
            className="mb-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            autoFocus
          />
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Nenhum serviço encontrado.</p>
            )}
            {filtered.map((svc) => (
              <button
                key={svc.id}
                onClick={() => handleAddService(svc)}
                className="flex w-full items-center justify-between rounded-xl border border-border p-3 text-left transition-colors hover:border-primary/50"
              >
                <div>
                  <p className="text-sm font-semibold">{svc.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDuration(svc.duration)}</p>
                </div>
                <p className="text-sm font-bold text-primary">{formatPrice(svc.price)}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-2xl bg-background shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pb-0 pt-4">
          <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground">
            <XIcon className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-lg font-semibold">Novo agendamento</h2>
            <p className="text-xs text-muted-foreground capitalize">
              {format(date, "EEEE, d 'de' MMMM", { locale: pt })}
              {initialTime ? ` · ${initialTime}` : ""}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {/* Client selector */}
          <div className="rounded-xl border border-dashed border-muted-foreground/30 p-3">
            {selectedClient ? (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-bold">
                  {(selectedClient.name ?? selectedClient.email ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{selectedClient.name ?? selectedClient.email}</p>
                </div>
                <button onClick={() => setSelectedClient(null)} className="text-muted-foreground hover:text-foreground">
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Pesquisar cliente (opcional)..."
                    value={clientQuery}
                    onChange={(e) => setClientQuery(e.target.value)}
                    className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                  />
                  {clientQuery && clientResults.length > 0 && (
                    <div className="mt-2 overflow-hidden rounded-lg border border-border">
                      {clientResults.slice(0, 5).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => { setSelectedClient(c); setClientQuery("") }}
                          className="flex w-full items-center gap-2 border-b border-border px-3 py-2 text-left text-sm last:border-0 hover:bg-accent"
                        >
                          <ChevronRightIcon className="h-3 w-3 text-muted-foreground" />
                          {c.name ?? c.email}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Services */}
          <div className="space-y-3">
            {selectedServices.map((item, index) => (
              <div key={index} className="rounded-xl border border-border p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{item.service.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDuration(item.service.duration)}</p>
                  </div>
                  <button onClick={() => handleRemoveService(index)} className="text-muted-foreground hover:text-destructive">
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex gap-3">
                  <TimeInput
                    label="Início"
                    value={item.startTime}
                    onChange={(v) => updateTime(index, "startTime", v)}
                  />
                  <TimeInput
                    label="Fim"
                    value={item.endTime}
                    onChange={(v) => updateTime(index, "endTime", v)}
                  />
                </div>
              </div>
            ))}

            <button
              onClick={() => setShowServicePicker(true)}
              className="flex w-full items-center gap-2 rounded-xl border border-dashed border-muted-foreground/40 px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <PlusIcon className="h-4 w-4" />
              {selectedServices.length === 0 ? "Adicionar serviço" : "Adicionar outro serviço"}
            </button>
          </div>

          {/* Note */}
          {selectedServices.length > 0 && (
            <input
              type="text"
              placeholder="Nota interna (opcional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          )}
        </div>

        {/* Footer */}
        {selectedServices.length > 0 && (
          <div className="border-t border-border px-4 py-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold">{formatPrice(totalPrice)}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onOpenChange(false)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={loading}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {loading ? "A guardar..." : "Guardar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
