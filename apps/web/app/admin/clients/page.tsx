export const dynamic = "force-dynamic"

import { getServerCaller } from "@/lib/trpc-server"
import ClientSearchForm from "./_components/ClientSearchForm"
import Link from "next/link"

interface AdminClientsPageProps {
  searchParams?: Promise<{ q?: string }>
}

export default async function AdminClientsPage(props: AdminClientsPageProps) {
  const searchParams = await props.searchParams
  const q = searchParams?.q?.trim() ?? ""

  const caller = await getServerCaller()
  const clients = await caller.client.search({ query: q })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Clientes</h1>
      </div>

      <ClientSearchForm initialQuery={q} />

      <div className="mt-6 space-y-3">
        {clients.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">
            {q ? "Nenhum cliente encontrado." : "Sem clientes registados."}
          </p>
        ) : (
          clients.map((c) => {
            const inner = (
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{c.name}</p>
                  {c.email && <p className="text-sm text-muted-foreground">{c.email}</p>}
                  {c.phone && <p className="text-sm text-muted-foreground">{c.phone}</p>}
                </div>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full capitalize">
                  {c.source}
                </span>
              </div>
            )
            return c.source === "client" ? (
              <Link key={c.id} href={`/admin/clients/${c.id}`} className="block border border-border rounded-xl p-4 bg-card hover:border-primary/50 transition-colors">
                {inner}
              </Link>
            ) : (
              <div key={c.id} className="border border-border rounded-xl p-4 bg-card">
                {inner}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
