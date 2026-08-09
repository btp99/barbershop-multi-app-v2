import { z } from "zod"
import { db } from "@barberlab/db"
import { router, publicProcedure } from "../trpc"

export const barbershopRouter = router({
  getAll: publicProcedure
    .input(
      z
        .object({
          title: z.string().optional(),
          service: z.string().optional(),
          tag: z.enum(["recomendados", "popular"]).optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      if (!input || (!input.title && !input.service && !input.tag)) {
        return db.barbershop.findMany({})
      }

      if (input.tag === "recomendados") {
        return db.barbershop.findMany({})
      }

      if (input.tag === "popular") {
        return db.barbershop.findMany({ orderBy: { name: "desc" } })
      }

      return db.barbershop.findMany({
        where: {
          OR: [
            input.title
              ? { name: { contains: input.title, mode: "insensitive" } }
              : {},
            input.service
              ? {
                  services: {
                    some: {
                      name: { contains: input.service, mode: "insensitive" },
                    },
                  },
                }
              : {},
          ],
        },
      })
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.barbershop.findUnique({
        where: { id: input.id },
        include: {
          services: { orderBy: [{ popular: "desc" }, { name: "asc" }] },
          businessHours: { orderBy: { dayOfWeek: "asc" } },
          reviews: {
            include: { user: { select: { name: true, image: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      })
    }),
})
