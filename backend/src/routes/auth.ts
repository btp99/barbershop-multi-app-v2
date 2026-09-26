import type { FastifyInstance } from "fastify"
import { OAuth2Client } from "google-auth-library"
import { db } from "@barberlab/db"
import { randomBytes } from "crypto"

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

type IdTokenBody = { idToken: string }

// Creates a better-auth session token directly in the DB.
// This lets native mobile clients exchange a Google ID token for a session
// without going through the browser OAuth redirect flow.
async function createSession(userId: string, ip: string, userAgent: string): Promise<string> {
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const now = new Date()
  const id = randomBytes(16).toString("hex")

  await db.session.create({
    data: { id, token, userId, expiresAt, ipAddress: ip, userAgent, createdAt: now, updatedAt: now },
  })

  return token
}

export async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: IdTokenBody }>("/auth/google", async (req, reply) => {
    const { idToken } = req.body
    if (!idToken) return reply.status(400).send({ error: "idToken is required" })

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      })
      const gPayload = ticket.getPayload()
      if (!gPayload?.email) return reply.status(401).send({ error: "Invalid Google token" })

      const user = await db.user.upsert({
        where: { email: gPayload.email },
        update: { name: gPayload.name ?? null, image: gPayload.picture ?? null, emailVerified: true },
        create: {
          email: gPayload.email,
          name: gPayload.name ?? null,
          image: gPayload.picture ?? null,
          emailVerified: true,
        },
      })

      const ip = req.ip ?? ""
      const ua = (req.headers["user-agent"] as string | undefined) ?? ""
      const token = await createSession(user.id, ip, ua)

      reply.header("set-auth-token", token)
      return reply.send({ accessToken: token })
    } catch (err) {
      console.error("[auth/google] verification failed:", err)
      return reply.status(401).send({ error: "Invalid Google token" })
    }
  })
}
