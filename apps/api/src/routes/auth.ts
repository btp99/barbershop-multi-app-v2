import type { FastifyInstance } from "fastify"
import { OAuth2Client } from "google-auth-library"
import { db } from "@barberlab/db"
import { signToken } from "../auth"

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: { idToken: string } }>("/auth/google", async (req, reply) => {
    const { idToken } = req.body

    if (!idToken) {
      return reply.status(400).send({ error: "idToken is required" })
    }

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      })

      const gPayload = ticket.getPayload()
      if (!gPayload?.email) {
        return reply.status(401).send({ error: "Invalid Google token" })
      }

      const user = await db.user.upsert({
        where: { email: gPayload.email },
        update: {
          name: gPayload.name ?? null,
          image: gPayload.picture ?? null,
        },
        create: {
          email: gPayload.email,
          name: gPayload.name ?? null,
          image: gPayload.picture ?? null,
          emailVerified: new Date(),
        },
      })

      const accessToken = await signToken({
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      })

      return reply.send({ accessToken })
    } catch (err) {
      console.error("[auth] Google token verification failed:", err)
      return reply.status(401).send({ error: "Invalid Google token" })
    }
  })
}
