"use client"

import { signIn } from "next-auth/react"
import Link from "next/link"

interface Props {
  onClose: () => void
}

export default function ConsentModal({ onClose }: Props) {
  const handleConfirm = async () => {
    onClose()
    await signIn("google")
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-semibold text-lg mb-2">Iniciar sessão</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Ao continuares, a tua conta Google será utilizada para:
        </p>
        <ul className="text-sm text-muted-foreground space-y-1 mb-4 list-disc list-inside">
          <li>Guardar o teu nome e endereço de e-mail</li>
          <li>Associar agendamentos à tua conta</li>
        </ul>
        <p className="text-xs text-muted-foreground mb-5">
          Ao continuares, aceitas a nossa{" "}
          <Link href="/privacidade" target="_blank" className="underline hover:text-foreground">
            Política de Privacidade
          </Link>{" "}
          e os{" "}
          <Link href="/termos" target="_blank" className="underline hover:text-foreground">
            Termos de Serviço
          </Link>
          .
        </p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 text-sm border border-border rounded-xl py-2.5 hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => void handleConfirm()}
            className="flex-1 text-sm bg-primary text-primary-foreground rounded-xl py-2.5 font-semibold hover:bg-primary/90 transition-colors"
          >
            Continuar com Google
          </button>
        </div>
      </div>
    </div>
  )
}
