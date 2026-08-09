"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { PlusIcon, TrashIcon } from "lucide-react"
import { formatPrice, formatDuration } from "@barberlab/ui"

interface Service {
  id: string
  name: string
  description: string
  price: unknown
  duration: number
  imageUrl: string
}

const EMPTY: Omit<Service, "id"> = {
  name: "",
  description: "",
  price: 0,
  duration: 30,
  imageUrl: "",
}

export default function ServiceManager({
  services,
}: {
  services: Service[]
}) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const field = "w-full border border-input rounded-lg px-3 py-2 text-sm bg-background"
  const label = "block text-sm font-medium text-muted-foreground mb-1"

  const handleEdit = (svc: Service) => {
    setEditingId(svc.id)
    setForm({
      name: svc.name,
      description: svc.description,
      price: Number(svc.price),
      duration: svc.duration,
      imageUrl: svc.imageUrl,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Apagar este serviço?")) return
    try {
      await trpc.service.delete.mutate({ id })
      toast.success("Serviço apagado.")
      router.refresh()
    } catch {
      toast.error("Erro ao apagar serviço.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await trpc.service.upsert.mutate({
        id: editingId ?? undefined,
        name: form.name,
        description: form.description,
        price: Number(form.price),
        duration: Number(form.duration),
        imageUrl: form.imageUrl,
      })
      toast.success(editingId ? "Serviço atualizado." : "Serviço criado.")
      setShowForm(false)
      setEditingId(null)
      setForm(EMPTY)
      router.refresh()
    } catch {
      toast.error("Erro ao guardar serviço.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {services.map((svc) => (
          <div key={svc.id} className="border border-border rounded-xl p-3 bg-card flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{svc.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatPrice(Number(svc.price))} · {formatDuration(svc.duration)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEdit(svc)}
                className="text-xs text-muted-foreground border border-border px-2.5 py-1 rounded-lg hover:bg-accent transition-colors"
              >
                Editar
              </button>
              <button
                onClick={() => void handleDelete(svc.id)}
                className="text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {!showForm ? (
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY) }}
          className="flex items-center gap-2 text-sm text-primary border border-primary/40 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Adicionar serviço
        </button>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="border border-border rounded-xl p-4 space-y-3 bg-card">
          <h3 className="font-semibold text-sm">{editingId ? "Editar serviço" : "Novo serviço"}</h3>
          <div>
            <label className={label}>Nome</label>
            <input className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className={label}>Descrição</label>
            <textarea className={`${field} min-h-[70px] resize-y`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Preço (€)</label>
              <input type="number" min="0" step="0.01" className={field} value={Number(form.price)} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            </div>
            <div>
              <label className={label}>Duração (min)</label>
              <input type="number" min="5" step="5" className={field} value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} required />
            </div>
          </div>
          <div>
            <label className={label}>URL da imagem</label>
            <input className={field} value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
              {loading ? "A guardar..." : "Guardar"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="border border-border px-4 py-2 rounded-lg text-sm">
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
