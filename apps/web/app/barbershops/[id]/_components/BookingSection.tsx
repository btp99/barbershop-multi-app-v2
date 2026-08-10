"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { trpc } from "@/lib/trpc"
import { formatPrice, formatDuration } from "@barberlab/ui"
import Image from "next/image"
import { toast } from "sonner"
import { signIn } from "next-auth/react"
import { AlertTriangleIcon, PlusIcon, XIcon, ArrowLeftIcon } from "lucide-react"
import { format, isBefore, startOfDay } from "date-fns"
import { Calendar } from "@/app/_components/Calendar"

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
  imageUrl: string
  popular: boolean
}

type ServiceEntry = { service: Service; startTime?: string; endTime?: string }

interface BookingSectionProps {
  barbershopId: string
  services: Service[]
  userId: string | null
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}
function minutesToTime(mins: number) {
  return `${Math.floor(mins / 60).toString().padStart(2, "0")}:${(mins % 60).toString().padStart(2, "0")}`
}

export default function BookingSection({ services, userId }: BookingSectionProps) {
  const [step, setStep] = useState<"initial" | "schedule" | "servicePicker" | "confirm">("initial")
  const [entries, setEntries] = useState<ServiceEntry[]>([])
  const [pickingFor, setPickingFor] = useState(0)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [closedDays, setClosedDays] = useState<number[]>([])
  const [serviceSearch, setServiceSearch] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    trpc.slots.getClosedDays.query().then((d) => setClosedDays(d.closedDaysOfWeek)).catch(() => {})
  }, [])

  const currentEntry = entries[pickingFor]
  const afterTime = pickingFor > 0 ? entries[pickingFor - 1]?.endTime : undefined
  const dateStr = date ? format(date, "yyyy-MM-dd") : ""

  const loadSlots = useCallback(async () => {
    if (!dateStr || !currentEntry) { setSlots([]); return }
    setSlotsLoading(true)
    trpc.slots.getSlots.query({ date: dateStr, duration: currentEntry.service.duration, after: afterTime })
      .then((d) => setSlots(d.slots))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [dateStr, currentEntry, afterTime])

  useEffect(() => { void loadSlots() }, [loadSlots])

  const isSelectedToday = date ? isBefore(startOfDay(new Date()), startOfDay(date)) === false && format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") : false

  const availableSlots = useMemo(() => {
    return slots.filter((s) => {
      if (!s.available) return false
      if (isSelectedToday) {
        const now = new Date()
        return timeToMinutes(s.time) >= now.getHours() * 60 + now.getMinutes() + 15
      }
      return true
    })
  }, [slots, isSelectedToday])

  const allTimesSet = entries.length > 0 && entries.every((e) => e.startTime)

  const gaps = useMemo(() => {
    const result: number[] = []
    for (let i = 1; i < entries.length; i++) {
      const prev = entries[i - 1]; const curr = entries[i]
      if (prev.endTime && curr.startTime) result.push(timeToMinutes(curr.startTime) - timeToMinutes(prev.endTime))
    }
    return result
  }, [entries])

  const hasLongGap = gaps.some((g) => g > 30)
  const totalPrice = entries.reduce((sum, e) => sum + e.service.price, 0)
  const totalDuration = useMemo(() => {
    const first = entries.find((e) => e.startTime)
    const last = [...entries].reverse().find((e) => e.endTime)
    if (!first?.startTime || !last?.endTime) return entries.reduce((sum, e) => sum + e.service.duration, 0)
    return timeToMinutes(last.endTime) - timeToMinutes(first.startTime)
  }, [entries])

  const handleDateChange = (d: Date | undefined) => {
    if (!d) return
    if (closedDays.includes(d.getDay())) { toast.error("A barbearia está fechada neste dia."); return }
    setDate(d)
    setEntries((prev) => prev.map((e) => ({ ...e, startTime: undefined, endTime: undefined })))
    setPickingFor(0)
  }

  const handleTimeSelect = (time: string) => {
    const duration = entries[pickingFor].service.duration
    const end = minutesToTime(timeToMinutes(time) + duration)
    setEntries((prev) => prev.map((e, i) => i === pickingFor ? { ...e, startTime: time, endTime: end } : e))
    const next = entries.findIndex((_, i) => i > pickingFor && !entries[i].startTime)
    if (next !== -1) setPickingFor(next)
  }

  const handleAddService = (svc: Service) => {
    const idx = entries.length
    setEntries((prev) => [...prev, { service: svc }])
    setPickingFor(idx)
    setStep("schedule")
    setServiceSearch("")
  }

  const handleRemoveEntry = (index: number) => {
    const next = entries.filter((_, i) => i !== index)
    setEntries(next)
    if (pickingFor >= index && pickingFor > 0) setPickingFor(pickingFor - 1)
    if (next.length === 0) { setStep("initial"); setDate(undefined) }
  }

  const handleBook = async () => {
    if (!userId) { void signIn("google"); return }
    if (!allTimesSet || !date) return
    setLoading(true)
    try {
      await trpc.booking.create.mutate({
        date: date,
        services: entries.map((e) => ({ serviceId: e.service.id, startTime: e.startTime!, endTime: e.endTime! })),
      })
      toast.success("Agendamento realizado com sucesso!")
      setStep("initial"); setEntries([]); setDate(undefined)
    } catch {
      toast.error("Erro ao agendar. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const resetToInitial = () => { setStep("initial"); setEntries([]); setDate(undefined) }

  // ── Confirm view ─────────────────────────────────────────────────────────
  if (step === "confirm") {
    return (
      <div className="space-y-4">
        <button onClick={() => setStep("schedule")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="w-4 h-4" /> Voltar
        </button>

        <div className="border border-border rounded-xl p-4 space-y-3 bg-card">
          <p className="font-semibold text-center capitalize">
            {date ? date.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""}
          </p>
          {entries.map((entry, i) => (
            <div key={i}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold">{entry.service.name}</p>
                  <p className="text-xs text-muted-foreground">{entry.startTime} – {entry.endTime} · {formatDuration(entry.service.duration)}</p>
                </div>
                <p className="text-sm font-bold">{formatPrice(entry.service.price)}</p>
              </div>
              {i < entries.length - 1 && gaps[i] !== undefined && (
                <div className={`my-3 flex items-center gap-2 text-xs ${gaps[i] > 30 ? "text-amber-500" : "text-muted-foreground"}`}>
                  <div className="h-px flex-1 bg-border" />
                  <span>Espera: {formatDuration(gaps[i])}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              )}
            </div>
          ))}
          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-sm text-muted-foreground">Total · {formatDuration(totalDuration)}</span>
            <span className="font-bold">{formatPrice(totalPrice)}</span>
          </div>
        </div>

        {hasLongGap && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-600 dark:text-amber-400">
            <AlertTriangleIcon className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Longo tempo de espera</p>
              <p className="text-xs mt-1">O tempo de espera entre os serviços é superior a 30 minutos.</p>
            </div>
          </div>
        )}

        <button onClick={() => void handleBook()} disabled={loading} className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold text-sm disabled:opacity-50">
          {loading ? "A agendar..." : userId ? "Confirmar e reservar" : "Iniciar sessão para agendar"}
        </button>
      </div>
    )
  }

  // ── Service picker view ───────────────────────────────────────────────────
  if (step === "servicePicker") {
    const picked = new Set(entries.map((e) => e.service.id))
    const filtered = services.filter((s) => !picked.has(s.id) && s.name.toLowerCase().includes(serviceSearch.toLowerCase()))
    return (
      <div className="space-y-4">
        <button onClick={() => setStep("schedule")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="w-4 h-4" /> Voltar
        </button>
        <input type="text" placeholder="Pesquisar serviço..." value={serviceSearch} onChange={(e) => setServiceSearch(e.target.value)} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
        <div className="space-y-2">
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nenhum serviço encontrado.</p>}
          {filtered.map((svc) => (
            <button key={svc.id} onClick={() => handleAddService(svc)} className="w-full flex items-center justify-between border border-border rounded-xl p-3 hover:border-primary/50 text-left transition-colors">
              <div>
                <p className="text-sm font-semibold">{svc.name}</p>
                <p className="text-xs text-muted-foreground">{formatDuration(svc.duration)}</p>
              </div>
              <p className="text-primary text-sm font-bold">{formatPrice(svc.price)}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── Initial view: service cards ───────────────────────────────────────────
  if (step === "initial") {
    return (
      <div className="space-y-3">
        {services.map((svc) => (
          <div key={svc.id} onClick={() => { setEntries([{ service: svc }]); setPickingFor(0); setStep("schedule") }} className="flex gap-3 rounded-xl border border-border p-3 cursor-pointer hover:border-primary/50 transition-colors">
            <Image src={svc.imageUrl} alt={svc.name} width={80} height={80} className="rounded-lg object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm leading-tight">{svc.name}</h3>
              <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">{svc.description}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-primary font-bold text-sm">{formatPrice(svc.price)}</span>
                <span className="text-muted-foreground text-xs">{formatDuration(svc.duration)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── Schedule view ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card/50 p-4">
        <Calendar
          selected={date}
          onSelect={handleDateChange}
          disabled={(d) =>
            isBefore(d, startOfDay(new Date())) || closedDays.includes(d.getDay())
          }
        />
      </div>

      {dateStr && currentEntry && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">
            Horário para <span className="text-foreground">{currentEntry.service.name}</span>
          </p>
          {slotsLoading ? (
            <p className="text-sm text-muted-foreground">A carregar horários...</p>
          ) : availableSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem horários disponíveis para este dia.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(
                availableSlots.reduce<Record<string, { time: string; available: boolean }[]>>((acc, s) => {
                  const h = s.time.split(":")[0]
                  ;(acc[h] ??= []).push(s)
                  return acc
                }, {})
              ).map(([hour, hourSlots]) => (
                <div key={hour}>
                  <p className="text-xs text-muted-foreground mb-1.5">{parseInt(hour)}h</p>
                  <div className="flex flex-wrap gap-1.5">
                    {hourSlots.map((s) => (
                      <button
                        key={s.time}
                        onClick={() => handleTimeSelect(s.time)}
                        className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                          currentEntry.startTime === s.time
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:border-primary/60"
                        }`}
                      >
                        {s.time}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        {entries.map((entry, i) => (
          <div key={i} className={`border rounded-xl p-3 ${i === pickingFor && !entry.startTime ? "border-primary" : "border-border"}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{entry.service.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {entry.startTime ? `${entry.startTime} – ${entry.endTime} · ${formatDuration(entry.service.duration)}` : i === pickingFor ? "Selecione um horário acima" : formatDuration(entry.service.duration)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <p className="text-primary text-sm font-bold">{formatPrice(entry.service.price)}</p>
                {i > 0 && <button onClick={() => handleRemoveEntry(i)} className="text-muted-foreground hover:text-destructive"><XIcon className="w-4 h-4" /></button>}
              </div>
            </div>
          </div>
        ))}

        {allTimesSet && dateStr && (
          <button onClick={() => setStep("servicePicker")} className="text-primary flex items-center gap-2 py-2 text-sm font-medium">
            <PlusIcon className="w-4 h-4" /> Adicionar outro serviço
          </button>
        )}
      </div>

      <div className="border-t border-border pt-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total · {formatDuration(totalDuration)}</span>
          <span className="font-bold">{formatPrice(totalPrice)}</span>
        </div>
        <button disabled={!allTimesSet || !dateStr} onClick={() => setStep("confirm")} className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 font-semibold text-sm disabled:opacity-50">
          Continuar
        </button>
        <button onClick={resetToInitial} className="w-full text-sm text-muted-foreground hover:text-foreground py-1">
          Cancelar
        </button>
      </div>
    </div>
  )
}
