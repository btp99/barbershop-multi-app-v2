import React from "react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { CalendarIcon, UsersIcon, SettingsIcon, BarChart2Icon } from "lucide-react"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const user = session?.user as { isAdmin?: boolean } | undefined
  if (!session || !user?.isAdmin) redirect("/")

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-56 flex-shrink-0 overflow-y-auto border-r border-border bg-card">
        <div className="p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Painel Admin
          </p>
          <nav className="space-y-1">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 text-sm px-3 py-2 rounded-lg hover:bg-accent transition-colors"
            >
              <CalendarIcon className="w-4 h-4" />
              Agenda
            </Link>
            <Link
              href="/admin/clients"
              className="flex items-center gap-2.5 text-sm px-3 py-2 rounded-lg hover:bg-accent transition-colors"
            >
              <UsersIcon className="w-4 h-4" />
              Clientes
            </Link>
            <Link
              href="/admin/stats"
              className="flex items-center gap-2.5 text-sm px-3 py-2 rounded-lg hover:bg-accent transition-colors"
            >
              <BarChart2Icon className="w-4 h-4" />
              Estatísticas
            </Link>
            <Link
              href="/admin/settings"
              className="flex items-center gap-2.5 text-sm px-3 py-2 rounded-lg hover:bg-accent transition-colors"
            >
              <SettingsIcon className="w-4 h-4" />
              Definições
            </Link>
          </nav>
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}
