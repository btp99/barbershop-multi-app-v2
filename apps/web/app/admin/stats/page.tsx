export const dynamic = "force-dynamic"

import { getServerCaller } from "@/lib/trpc-server"
import { format, getDaysInMonth } from "date-fns"
import { pt } from "date-fns/locale"

export default async function AdminStatsPage() {
  const caller = await getServerCaller()
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1

  const counts = await caller.admin.getBookingCounts({ year, month })

  const days = getDaysInMonth(today)
  const dayKeys = Array.from({ length: days }, (_, i) => {
    const d = new Date(year, month - 1, i + 1)
    return format(d, "yyyy-MM-dd")
  })

  const total = Object.values(counts).reduce((s, v) => s + v, 0)
  const maxDay = Math.max(...Object.values(counts), 1)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Estatísticas</h1>
      <p className="text-muted-foreground text-sm mb-6 capitalize">
        {format(today, "MMMM 'de' yyyy", { locale: pt })}
      </p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="border border-border rounded-xl p-4 bg-card text-center">
          <p className="text-3xl font-bold">{total}</p>
          <p className="text-sm text-muted-foreground mt-1">Agendamentos este mês</p>
        </div>
        <div className="border border-border rounded-xl p-4 bg-card text-center">
          <p className="text-3xl font-bold text-primary">
            {total > 0 ? (total / days).toFixed(1) : "0"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Média por dia</p>
        </div>
      </div>

      <h2 className="font-bold text-lg mb-4">Por dia</h2>
      <div className="space-y-2">
        {dayKeys.map((key) => {
          const count = counts[key] ?? 0
          if (count === 0) return null
          const d = new Date(key + "T00:00:00")
          return (
            <div key={key} className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground w-36 capitalize">
                {format(d, "d 'de' MMMM", { locale: pt })}
              </span>
              <div className="flex-1 flex items-center gap-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(count / maxDay) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right font-semibold">{count}</span>
              </div>
            </div>
          )
        })}
        {total === 0 && (
          <p className="text-muted-foreground text-sm">Sem agendamentos este mês.</p>
        )}
      </div>
    </div>
  )
}
