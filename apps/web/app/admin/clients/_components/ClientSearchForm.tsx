"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { SearchIcon } from "lucide-react"

export default function ClientSearchForm({ initialQuery }: { initialQuery: string }) {
  const [q, setQ] = useState(initialQuery)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (q.trim()) params.set("q", q.trim())
    router.push(`/admin/clients?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Pesquisar por nome, email ou telefone..."
          className="w-full pl-9 pr-4 py-2 border border-input rounded-lg text-sm bg-background"
        />
      </div>
      <button
        type="submit"
        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold"
      >
        Pesquisar
      </button>
    </form>
  )
}
