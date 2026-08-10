import { TRPCError } from "@trpc/server"
import { db } from "@barberlab/db"
import { router, protectedProcedure } from "../trpc"

export const userRouter = router({
  exportData: protectedProcedure.query(async ({ ctx }) => {
    const [user, bookings, reviews] = await Promise.all([
      db.user.findUnique({
        where: { id: ctx.user.id },
        select: { id: true, name: true, email: true, image: true, createdAt: true },
      }),
      db.booking.findMany({
        where: { userId: ctx.user.id },
        select: {
          id: true,
          date: true,
          startTime: true,
          endTime: true,
          status: true,
          note: true,
          createdAt: true,
          services: {
            select: {
              startTime: true,
              endTime: true,
              service: { select: { name: true, duration: true } },
            },
          },
        },
        orderBy: { date: "asc" },
      }),
      db.review.findMany({
        where: { userId: ctx.user.id },
        select: { rating: true, comment: true, createdAt: true },
      }),
    ])

    return { user, bookings, reviews, exportedAt: new Date() }
  }),

  getMe: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.user.findUnique({
      where: { id: ctx.user.id },
      select: { id: true, name: true, email: true, image: true, createdAt: true },
    })
    if (!user) throw new TRPCError({ code: "NOT_FOUND" })
    return user
  }),

  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    // Anonymise bookings so admin history is preserved
    await db.booking.updateMany({
      where: { userId: ctx.user.id },
      data: { userId: null },
    })
    // Remove reviews
    await db.review.deleteMany({ where: { userId: ctx.user.id } })
    // Delete user — Account and Session rows cascade automatically
    await db.user.delete({ where: { id: ctx.user.id } })
  }),
})
