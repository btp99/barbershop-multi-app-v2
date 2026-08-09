import { getServerCaller } from "@/lib/trpc-server"
import Link from "next/link"
import Image from "next/image"
import { MapPinIcon } from "lucide-react"

export default async function BarbershopsPage(props: { searchParams?: Promise<{ title?: string; service?: string }> }) {
  const searchParams = await props.searchParams
  const caller = await getServerCaller()
  const barbershops = await caller.barbershop.getAll({
    title: searchParams?.title as string | undefined,
    service: searchParams?.service as string | undefined,
  })

  return (
    <main className="min-h-screen p-5">
      <h1 className="text-2xl font-bold mb-6">Barbearias</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {barbershops.map((b) => (
          <Link key={b.id} href={`/barbershops/${b.id}`} className="block">
            <div className="rounded-xl border border-border overflow-hidden bg-card hover:opacity-90 transition-opacity">
              <Image
                src={b.imageUrl}
                alt={b.name}
                width={400}
                height={160}
                className="w-full h-40 object-cover"
              />
              <div className="p-4">
                <h2 className="font-bold text-lg">{b.name}</h2>
                <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
                  <MapPinIcon className="w-4 h-4" />
                  {b.address}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {barbershops.length === 0 && (
        <p className="text-muted-foreground text-center mt-12">
          Nenhuma barbearia encontrada.
        </p>
      )}
    </main>
  )
}
