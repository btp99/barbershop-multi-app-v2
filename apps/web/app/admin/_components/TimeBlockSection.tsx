"use client"

import { useState, useEffect, useCallback } from "react"
import { trpc } from "@/lib/trpc"
import { PlusIcon, TrashIcon } from "lucide-react"
import { toast } from "sonner"

interface TimeBlock {
  id: string
  startTime: string
  endTime: string
  reason: string | null
}

export default function TimeBlockSection({ dateStr }: { dateStr: string }) {
  const [blocks, setBlocks] = useState<TimeBlock[]>([])
  const [showForm, setShowForm] = useState(false)
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  const loadBlocks = useCallback(async () => {
    const data = await trpc.timeblock.getForDate.query({ date: new Date(dateStr + "T12:00:00") })
    setBlocks(data)
  }, [dateStr])

  useEffect(() => { void loadBlocks() }, [loadBlocks])

  const handleCreate = async () => {
    if (!startTime || !endTime) return
    setLoading(true)
    try {
      await trpc.timeblock.create.mutate({ date: dateStr, startTime, endTime, reason: reason || undefined })
      toast.success("Bloqueio criado!")
      setShowForm(false)
      setStartTime(""); setEndTime(""); setReason("")
      await loadBlocks()
    } catch {
      toast.error("Erro ao criar bloqueio.")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await trpc.timeblock.delete.mutate({ id })
      setBlocks((prev) => prev.filter((b) => b.id !== id))
      toast.success("Bloqueio removido.")
    } catch {
      toast.error("Erro ao remover bloqueio.")
    }
  }

  return (
    <div className="border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Bloqueios de horário</h3>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <PlusIcon className="w-3 h-3" /> Adicionar
        </button>
      </div>

      {showForm && (
        <div className="space-y-3 mb-4 border-t border-border pt-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Início</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full border border-input rounded-lg px-2 py-1.5 text-sm bg-background" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Fim</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full border border-input rounded-lg px-2 py-1.5 text-sm bg-background" />
            </div>
          </div>
          <input type="text" placeholder="Motivo (opcional)" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border border-input rounded-lg px-3 py-1.5 text-sm bg-background" />
          <div className="flex gap-2">
            <button onClick={() => void handleCreate()} disabled={loading || !startTime || !endTime} className="flex-1 bg-primary text-primary-foreground rounded-lg py-1.5 text-sm font-medium disabled:opacity-50">
              {loading ? "A criar..." : "Criar bloqueio"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-3 border border-border rounded-lg text-sm hover:bg-accent">Cancelar</button>
          </div>
        </div>
      )}

      {blocks.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-1">Sem bloqueios para este dia.</p>
      ) : (
        <div className="space-y-2">
          {blocks.map((b) => (
            <div key={b.id} className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium">{b.startTime} – {b.endTime}</span>
                {b.reason && <span className="text-muted-foreground ml-2 text-xs">{b.reason}</span>}
              </div>
              <button onClick={() => void handleDelete(b.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
