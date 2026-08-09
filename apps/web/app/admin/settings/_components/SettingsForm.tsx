"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Barbershop {
  name: string
  address: string
  description: string
  phones: string[]
  imageUrl: string
  amenities: string[]
}

export default function SettingsForm({ barbershop }: { barbershop: Barbershop }) {
  const [name, setName] = useState(barbershop.name)
  const [address, setAddress] = useState(barbershop.address)
  const [description, setDescription] = useState(barbershop.description)
  const [imageUrl, setImageUrl] = useState(barbershop.imageUrl)
  const [phones, setPhones] = useState(barbershop.phones.join(", "))
  const [amenities, setAmenities] = useState(barbershop.amenities.join(", "))
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await trpc.admin.updateBarbershop.mutate({
        name,
        address,
        description,
        imageUrl,
        phones: phones.split(",").map((p) => p.trim()).filter(Boolean),
        amenities: amenities.split(",").map((a) => a.trim()).filter(Boolean),
      })
      toast.success("Barbearia atualizada.")
      router.refresh()
    } catch {
      toast.error("Erro ao guardar alterações.")
    } finally {
      setLoading(false)
    }
  }

  const field = "w-full border border-input rounded-lg px-3 py-2 text-sm bg-background"
  const label = "block text-sm font-medium text-muted-foreground mb-1"

  return (
    <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
      <div>
        <label className={label}>Nome</label>
        <input className={field} value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className={label}>Morada</label>
        <input className={field} value={address} onChange={(e) => setAddress(e.target.value)} required />
      </div>
      <div>
        <label className={label}>Descrição</label>
        <textarea
          className={`${field} min-h-[100px] resize-y`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <label className={label}>URL da imagem</label>
        <input className={field} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
      </div>
      <div>
        <label className={label}>Telefones (separados por vírgula)</label>
        <input className={field} value={phones} onChange={(e) => setPhones(e.target.value)} />
      </div>
      <div>
        <label className={label}>Comodidades (separadas por vírgula)</label>
        <input className={field} value={amenities} onChange={(e) => setAmenities(e.target.value)} />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
      >
        {loading ? "A guardar..." : "Guardar alterações"}
      </button>
    </form>
  )
}
