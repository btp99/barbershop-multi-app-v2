"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc"
import { toast } from "sonner"

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]

interface BusinessHour {
  id: string
  dayOfWeek: number
  morningOpen: string | null
  morningClose: string | null
  afternoonOpen: string | null
  afternoonClose: string | null
  closed: boolean
}

export default function BusinessHoursForm({ businessHours }: { businessHours: BusinessHour[] }) {
  const [hours, setHours] = useState<BusinessHour[]>(
    [...businessHours].sort((a, b) => a.dayOfWeek - b.dayOfWeek)
  )
  const [saving, setSaving] = useState<string | null>(null)

  const update = (id: string, changes: Partial<BusinessHour>) => {
    setHours((prev) => prev.map((h) => (h.id === id ? { ...h, ...changes } : h)))
  }

  const save = async (h: BusinessHour) => {
    setSaving(h.id)
    try {
      await trpc.admin.updateBusinessHours.mutate({
        id: h.id,
        closed: h.closed,
        morningOpen: h.morningOpen,
        morningClose: h.morningClose,
        afternoonOpen: h.afternoonOpen,
        afternoonClose: h.afternoonClose,
      })
      toast.success("Horário guardado!")
    } catch {
      toast.error("Erro ao guardar horário.")
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-3">
      {hours.map((h) => (
        <div key={h.id} className="border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">{DAY_NAMES[h.dayOfWeek]}</span>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={h.closed}
                onChange={(e) => update(h.id, { closed: e.target.checked })}
              />
              Fechado
            </label>
          </div>

          {!h.closed && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Manhã — abertura</label>
                <input type="time" value={h.morningOpen ?? ""} onChange={(e) => update(h.id, { morningOpen: e.target.value || null })} className="w-full border border-input rounded-lg px-2 py-1.5 bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Manhã — fecho</label>
                <input type="time" value={h.morningClose ?? ""} onChange={(e) => update(h.id, { morningClose: e.target.value || null })} className="w-full border border-input rounded-lg px-2 py-1.5 bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tarde — abertura</label>
                <input type="time" value={h.afternoonOpen ?? ""} onChange={(e) => update(h.id, { afternoonOpen: e.target.value || null })} className="w-full border border-input rounded-lg px-2 py-1.5 bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tarde — fecho</label>
                <input type="time" value={h.afternoonClose ?? ""} onChange={(e) => update(h.id, { afternoonClose: e.target.value || null })} className="w-full border border-input rounded-lg px-2 py-1.5 bg-background text-sm" />
              </div>
            </div>
          )}

          <button
            onClick={() => void save(h)}
            disabled={saving === h.id}
            className="w-full border border-border rounded-lg py-1.5 text-sm hover:bg-accent disabled:opacity-50 transition-colors"
          >
            {saving === h.id ? "A guardar..." : "Guardar"}
          </button>
        </div>
      ))}
    </div>
  )
}
