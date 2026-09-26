import "dotenv/config"
import Fastify from "fastify"
import cors from "@fastify/cors"
import { fetchRequestHandler, appRouter, createContext } from "./trpc"
import { authRoutes } from "./routes/auth"

const app = Fastify({ logger: true })

async function start() {
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

  await app.register(authRoutes)

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
    response.headers.forEach((value, key) => {
      void reply.header(key, value)
    })

    const body = await response.text()
    return reply.send(body)
  })

  const port = Number(process.env.PORT ?? 4000)
  await app.listen({ port, host: "0.0.0.0" })
  console.log(`Backend running on http://0.0.0.0:${port}`)
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
