import type { FastifyRequest } from "fastify"
import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { appRouter } from "@barberlab/trpc"
import type { Context } from "@barberlab/trpc"
import { auth } from "./auth"

export async function createContext(req: FastifyRequest): Promise<Context> {
  const headers = new Headers(
    Object.entries(req.headers).flatMap(([k, v]) =>
      Array.isArray(v)
        ? v.map((val) => [k, val] as [string, string])
        : [[k, String(v ?? "")]]
    )
  )

  const session = await auth.api.getSession({ headers })
  if (!session?.user) return { user: null }

  const u = session.user as { id: string; email: string; isAdmin?: boolean }
  return {
    user: { id: u.id, email: u.email, isAdmin: u.isAdmin ?? false },
  }
}

export { fetchRequestHandler, appRouter }
