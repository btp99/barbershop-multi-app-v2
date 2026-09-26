import "dotenv/config"
import Fastify from "fastify"
import cors from "@fastify/cors"
import { fetchRequestHandler, appRouter, createContext } from "./trpc"
import { authRoutes } from "./routes/auth"
import { auth } from "./auth"

const app = Fastify({ logger: true })

async function start() {
  const port = Number(process.env.PORT ?? 4000)

  await app.register(cors, {
    origin: [
      process.env.WEB_URL ?? "http://localhost:3000",
      "http://localhost:8081",
      /^http:\/\/192\.168\./,
      /^http:\/\/10\./,
      /^http:\/\/172\.(1[6-9]|2\d|3[01])\./,
    ],
    credentials: true,
  })

  app.get("/health", async () => ({ status: "ok" }))

  // Custom Google ID token → better-auth session endpoint (for native mobile)
  await app.register(authRoutes)

  // better-auth handles email/password, sign-out, session management
  app.all("/api/auth/*", async (req, reply) => {
    const url = `http://localhost:${port}${req.url}`
    const headers = new Headers()
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === "string") headers.set(key, value)
      else if (Array.isArray(value)) headers.set(key, value[0] ?? "")
    }

    const body =
      req.method !== "GET" && req.method !== "HEAD"
        ? typeof req.body === "string"
          ? req.body
          : JSON.stringify(req.body)
        : undefined

    const webReq = new Request(url, { method: req.method, headers, body })
    const webRes = await auth.handler(webReq)

    reply.status(webRes.status)
    webRes.headers.forEach((value, key) => void reply.header(key, value))
    return reply.send(await webRes.text())
  })

  // tRPC
  app.all("/trpc/*", async (req, reply) => {
    const url = `http://localhost${req.url}`
    const headers: Record<string, string> = {}
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === "string") headers[key] = value
      else if (Array.isArray(value)) headers[key] = value[0] ?? ""
    }

    const fetchReq = new Request(url, {
      method: req.method,
      headers,
      body:
        req.method !== "GET" && req.method !== "HEAD"
          ? JSON.stringify(req.body)
          : undefined,
    })

    const ctx = await createContext(req)

    const response = await fetchRequestHandler({
      endpoint: "/trpc",
      req: fetchReq,
      router: appRouter,
      createContext: () => ctx,
    })

    reply.status(response.status)
    response.headers.forEach((value, key) => void reply.header(key, value))
    return reply.send(await response.text())
  })

  await app.listen({ port, host: "0.0.0.0" })
  console.log(`Backend running on http://0.0.0.0:${port}`)
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
