import { db } from "@barberlab/db"
import { router, publicProcedure } from "../trpc"

export const shopRouter = router({
  get: publicProcedure.query(async () => {
    return db.barbershop.findFirst({
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
