import type { FastifyInstance } from "fastify"
import { OAuth2Client } from "google-auth-library"
import { db } from "@barberlab/db"
import { signToken } from "../auth"

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
)

type IdTokenBody = { idToken: string }
type CodeBody = { code: string; codeVerifier: string; redirectUri: string }

export async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: IdTokenBody | CodeBody }>("/auth/google", async (req, reply) => {
    let idToken: string | undefined

    if ("idToken" in req.body) {
      idToken = req.body.idToken
    } else if ("code" in req.body) {
      const { code, codeVerifier, redirectUri } = req.body
      try {
        const { tokens } = await googleClient.getToken({
          code,
          codeVerifier,
          redirect_uri: redirectUri,
        })
        idToken = tokens.id_token ?? undefined
      } catch (err) {
        console.error("[auth] Code exchange failed:", err)
        return reply.status(401).send({ error: "Code exchange failed" })
      }
    }

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
