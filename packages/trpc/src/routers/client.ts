import { z } from "zod"
import { db } from "@barberlab/db"
import { router, adminProcedure } from "../trpc"

export const clientRouter = router({
  create: adminProcedure
    .input(
      z.object({
        name: z.string(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return db.client.create({
        data: {
          name: input.name,
          phone: input.phone ?? null,
          email: input.email ?? null,
          notes: input.notes ?? null,
        },
      })
    }),

  search: adminProcedure
    .input(z.object({ query: z.string().default("") }))
    .query(async ({ input }) => {
      const q = input.query.trim()

      const [clients, users] = await Promise.all([
        q
          ? db.client.findMany({
              where: {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { phone: { contains: q, mode: "insensitive" } },
                  { email: { contains: q, mode: "insensitive" } },
                ],
              },
              take: 10,
              orderBy: { name: "asc" },
            })
          : db.client.findMany({ take: 30, orderBy: { name: "asc" } }),

        q
          ? db.user.findMany({
              where: {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { email: { contains: q, mode: "insensitive" } },
                ],
              },
              take: 10,
              orderBy: { name: "asc" },
            })
          : db.user.findMany({ take: 30, orderBy: { name: "asc" } }),
      ])

      const clientResults = clients.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        source: "client" as const,
      }))

      const userResults = users.map((u) => ({
        id: u.id,
        name: u.name ?? u.email,
        phone: null as string | null,
        email: u.email,
        source: "user" as const,
      }))

      const seen = new Set(clientResults.map((c) => c.email).filter(Boolean))
      const filteredUsers = userResults.filter(
        (u) => !u.email || !seen.has(u.email),
      )

      return [...clientResults, ...filteredUsers].sort((a, b) =>
        a.name.localeCompare(b.name, "pt"),
      )
    }),

  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.client.findUnique({
        where: { id: input.id },
        include: {
          bookings: {
            include: {
              services: { include: { service: true } },
            },
            orderBy: { date: "desc" },
          },
        },
      })
    }),

  getAll: adminProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ input }) => {
      return db.client.findMany({
        where: input.search
          ? {
              OR: [
                { name: { contains: input.search, mode: "insensitive" } },
                { phone: { contains: input.search, mode: "insensitive" } },
              ],
            }
          : undefined,
        include: { _count: { select: { bookings: true } } },
        orderBy: { name: "asc" },
      })
    }),
})
