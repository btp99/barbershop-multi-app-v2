import { getServerCaller } from "@/lib/trpc-server"
import { redirect, notFound } from "next/navigation"

export default async function BarbershopsPage() {
  const caller = await getServerCaller()
  const barbershops = await caller.barbershop.getAll({})

  const first = barbershops[0]
  if (!first) notFound()

  redirect(`/barbershops/${first.id}`)
}
