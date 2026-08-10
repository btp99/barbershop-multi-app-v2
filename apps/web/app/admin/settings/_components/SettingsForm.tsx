"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { CheckCircleIcon } from "lucide-react"
import ImageUpload from "@/app/_components/ImageUpload"

const ALL_AMENITIES = [
  "Wi-Fi Gratuito",
  "Estacionamento",
  "Cartão de Crédito",
  "Produtos Premium",
  "Ambiente Climatizado",
  "Profissionais Qualificados",
]

interface Barbershop {
  name: string
  address: string
  description: string
  phones: string[]
  imageUrl: string
  logoUrl: string | null
  amenities: string[]
}

export default function SettingsForm({ barbershop }: { barbershop: Barbershop }) {
  const [name, setName] = useState(barbershop.name)
  const [address, setAddress] = useState(barbershop.address)
  const [description, setDescription] = useState(barbershop.description)
  const [imageUrl, setImageUrl] = useState(barbershop.imageUrl)
  const [logoUrl, setLogoUrl] = useState(barbershop.logoUrl ?? "")
  const [phones, setPhones] = useState(barbershop.phones.join("\n"))
  const [amenities, setAmenities] = useState<string[]>(barbershop.amenities)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const toggleAmenity = (a: string) =>
    setAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await trpc.admin.updateBarbershop.mutate({
        name: name.trim(),
        address: address.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        logoUrl: logoUrl.trim() || undefined,
        phones: phones.split("\n").map((p) => p.trim()).filter(Boolean),
        amenities,
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
  const label = "block text-sm font-medium mb-1"

  return (
    <form onSubmit={(e) => void handleSave(e)} className="space-y-6">
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
        <label className={label}>Telefones (um por linha)</label>
        <textarea
          className={`${field} min-h-[80px] resize-y`}
          value={phones}
          onChange={(e) => setPhones(e.target.value)}
          placeholder="351912345678"
        />
      </div>

      <ImageUpload
        endpoint="shopImage"
        value={imageUrl}
        onChange={setImageUrl}
        label="Imagem de capa"
      />

      <div>
        <ImageUpload
          endpoint="shopImage"
          value={logoUrl}
          onChange={setLogoUrl}
          label="Logótipo"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Aparece no cabeçalho e no banner da barbearia. Use uma imagem quadrada (PNG com fundo transparente recomendado).
        </p>
      </div>

      <div>
        <label className={label}>Comodidades</label>
        <div className="grid grid-cols-2 gap-2">
          {ALL_AMENITIES.map((a) => {
            const active = amenities.includes(a)
            return (
              <button
                key={a}
                type="button"
                onClick={() => toggleAmenity(a)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground/40"
                }`}
              >
                <CheckCircleIcon className="h-4 w-4 shrink-0" />
                {a}
              </button>
            )
          })}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="w-full rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {loading ? "A guardar..." : "Guardar alterações"}
      </button>
    </form>
  )
}
