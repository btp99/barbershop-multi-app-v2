"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { trpc } from "@/lib/trpc"
import { toast } from "sonner"
import { LogOutIcon, Trash2Icon, ShieldAlertIcon } from "lucide-react"

export default function AccountSettings() {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await trpc.user.deleteAccount.mutate()
      toast.success("Conta eliminada.")
      await signOut({ callbackUrl: "/" })
    } catch {
      toast.error("Erro ao eliminar conta. Tenta novamente.")
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Sign out */}
      <section className="border border-border rounded-xl p-5">
        <h2 className="font-semibold mb-1">Sessão</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Termina a sessão neste dispositivo.
        </p>
        <button
          onClick={() => void signOut({ callbackUrl: "/" })}
          className="flex items-center gap-2 text-sm border border-border rounded-lg px-4 py-2 hover:bg-accent transition-colors"
        >
          <LogOutIcon className="w-4 h-4" />
          Terminar sessão
        </button>
      </section>

      {/* Danger zone */}
      <section className="border border-destructive/40 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlertIcon className="w-4 h-4 text-destructive" />
          <h2 className="font-semibold text-destructive">Zona de perigo</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          A eliminação da conta é permanente. Os teus dados pessoais serão removidos conforme o RGPD.
          O histórico de agendamentos é anonimizado.
        </p>

        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="flex items-center gap-2 text-sm bg-destructive/10 text-destructive border border-destructive/30 rounded-lg px-4 py-2 hover:bg-destructive/20 transition-colors"
          >
            <Trash2Icon className="w-4 h-4" />
            Eliminar conta
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-destructive">
              Tens a certeza? Esta ação não pode ser revertida.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="flex items-center gap-2 text-sm bg-destructive text-white rounded-lg px-4 py-2 hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                <Trash2Icon className="w-4 h-4" />
                {deleting ? "A eliminar..." : "Confirmar eliminação"}
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={deleting}
                className="text-sm border border-border rounded-lg px-4 py-2 hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
