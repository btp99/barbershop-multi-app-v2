import { z } from "zod"
import { db } from "@barberlab/db"
import { router, adminProcedure } from "../trpc"

export const timeblockRouter = router({
  create: adminProcedure
    .input(
      z.object({
        date: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      await db.timeBlock.create({
        data: {
          date: new Date(input.date),
          startTime: input.startTime,
          endTime: input.endTime,
          reason: input.reason ?? null,
        },
      })
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.timeBlock.delete({ where: { id: input.id } })
    }),

  getForDate: adminProcedure
    .input(z.object({ date: z.coerce.date() }))
    .query(async ({ input }) => {
      const { startOfDay, endOfDay } = await import("date-fns")
      return db.timeBlock.findMany({
        where: {
          date: {
            gte: startOfDay(input.date),
            lte: endOfDay(input.date),
          },
        },
        orderBy: { startTime: "asc" },
      })
    }),
})
