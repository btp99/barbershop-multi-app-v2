import type { FastifyRequest } from "fastify"
import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { appRouter } from "@barberlab/trpc"
import type { Context } from "@barberlab/trpc"
import { verifyToken } from "./auth"

export async function createContext(req: FastifyRequest): Promise<Context> {
  const auth = req.headers.authorization
  if (!auth?.startsWith("Bearer ")) return { user: null }

  const token = auth.slice(7)
  const payload = await verifyToken(token)
  return { user: payload }
}

export { fetchRequestHandler, appRouter }
