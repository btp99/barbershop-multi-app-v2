export const dynamic = "force-dynamic"

import { getServerCaller } from "@/lib/trpc-server"
import AdminCalendarClient from "./_components/AdminCalendarClient"

export default async function AdminPage() {
  const caller = await getServerCaller()
  const today = new Date()

  const [bookings, barbershops] = await Promise.all([
    caller.admin.getBookingsForDate({ date: today }),
    caller.barbershop.getAll({}),
  ])

  const barbershop = barbershops[0]
  const fullBarbershop = barbershop
    ? await caller.barbershop.getById({ id: barbershop.id })
    : null

  const services = (fullBarbershop?.services ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    duration: s.duration,
    price: Number(s.price),
  }))

  const mappedBookings = bookings.map((b) => ({
    ...b,
    services: b.services.map((bs) => ({
      ...bs,
      service: {
        ...bs.service,
        price: Number(bs.service.price),
      },
    })),
  }))

  return (
    <div className="flex h-full flex-col">
      <AdminCalendarClient
        initialDate={today}
        initialBookings={mappedBookings}
        services={services}
      />
    </div>
  )
}
