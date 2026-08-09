export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getServerCaller } from "@/lib/trpc-server"

export default async function Home() {
  const caller = await getServerCaller()
  const barbershops = await caller.barbershop.getAll()
  const barbershop = barbershops[0]
  if (!barbershop) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center">
        <p className="text-muted-foreground text-lg">Nenhuma barbearia cadastrada.</p>
      </div>
    )
  }
  redirect(`/barbershops/${barbershop.id}`)
}
