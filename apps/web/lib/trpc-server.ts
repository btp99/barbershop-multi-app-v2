import { createCallerFactory, appRouter } from "@barberlab/trpc"
import { getServerSession } from "next-auth"
import { authOptions } from "./auth"

export async function getServerCaller() {
  const session = await getServerSession(authOptions)
  const accessToken = (session as { accessToken?: string } | null)?.accessToken

  let user: { id: string; email: string; isAdmin: boolean } | null = null

  if (accessToken) {
    try {
      // Decode JWT payload (no verification needed — verified by the API on creation)
      const base64Payload = accessToken.split(".")[1]
      if (base64Payload) {
        const payload = JSON.parse(Buffer.from(base64Payload, "base64url").toString())
        if (payload.id && payload.email) {
          user = { id: payload.id, email: payload.email, isAdmin: payload.isAdmin ?? false }
        }
      }
    } catch {
      user = null
    }
  }

  return createCallerFactory(appRouter)({ user })
}
