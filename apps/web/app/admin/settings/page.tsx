export const dynamic = "force-dynamic"

import { getServerCaller } from "@/lib/trpc-server"
import SettingsForm from "./_components/SettingsForm"
import ServiceManager from "./_components/ServiceManager"
import BusinessHoursForm from "./_components/BusinessHoursForm"

export default async function AdminSettingsPage() {
  const caller = await getServerCaller()
  const barbershops = await caller.barbershop.getAll()
  const barbershop = barbershops[0]
  if (!barbershop) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Nenhuma barbearia configurada.</p>
      </div>
    )
  }

  const full = await caller.barbershop.getById({ id: barbershop.id })
  if (!full) return null

  return (
    <div className="p-6 space-y-10 max-w-2xl">
      <section>
        <h1 className="text-2xl font-bold mb-6">Definições</h1>
        <SettingsForm barbershop={{ ...full, logoUrl: full.logoUrl ?? null }} />
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Serviços</h2>
        <ServiceManager services={full.services.map((s) => ({ ...s, price: Number(s.price) }))} />
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Horário de Funcionamento</h2>
        <BusinessHoursForm businessHours={full.businessHours} />
      </section>
    </div>
  )
}
