"use client"

import { SmartphoneIcon } from "lucide-react"
import { toast } from "sonner"

export default function PhoneItem({ phone }: { phone: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <SmartphoneIcon className="w-4 h-4 text-primary" />
        <p className="text-sm">{phone}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            navigator.clipboard.writeText(phone)
            toast.success("Telefone copiado com sucesso!")
          }}
          className="text-xs border border-border rounded-lg px-3 py-1.5 hover:bg-accent transition-colors"
        >
          Copiar
        </button>
        <button
          onClick={() => window.open(`tel:${phone}`, "_self")}
          className="text-xs bg-primary text-primary-foreground rounded-lg px-3 py-1.5 hover:bg-primary/90 transition-colors"
        >
          Ligar
        </button>
      </div>
    </div>
  )
}
