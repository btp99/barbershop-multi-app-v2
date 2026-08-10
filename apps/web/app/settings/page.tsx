export const dynamic = "force-dynamic"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getServerCaller } from "@/lib/trpc-server"
import Image from "next/image"
import { UserIcon } from "lucide-react"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import AccountSettings from "./_components/AccountSettings"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/")

  const caller = await getServerCaller()
  const me = await caller.user.getMe()

  return (
    <div className="max-w-lg mx-auto px-5 py-10 space-y-8">
      <h1 className="text-2xl font-bold">Definições da conta</h1>

      {/* Account info */}
      <section className="border border-border rounded-xl p-5 flex items-center gap-4">
        {me.image ? (
          <Image
            src={me.image}
            alt={me.name ?? ""}
            width={56}
            height={56}
            className="rounded-full shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <UserIcon className="w-6 h-6 text-primary" />
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold truncate">{me.name ?? "—"}</p>
          <p className="text-sm text-muted-foreground truncate">{me.email}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Membro desde {format(new Date(me.createdAt), "MMMM 'de' yyyy", { locale: pt })}
          </p>
        </div>
      </section>

      <AccountSettings />
    </div>
  )
}
