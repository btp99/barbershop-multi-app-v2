import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { db } from "@barberlab/db"
import { router, protectedProcedure } from "../trpc"

export const userRouter = router({
  getMe: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.user.findUnique({
      where: { id: ctx.user.id },
      select: { id: true, name: true, email: true, image: true, phone: true, isAdmin: true, createdAt: true },
    })
    if (!user) throw new TRPCError({ code: "NOT_FOUND" })
    return user
  }),

  updatePhone: protectedProcedure
    .input(z.object({ phone: z.string().min(7).max(20) }))
    .mutation(async ({ ctx, input }) => {
      await db.user.update({
        where: { id: ctx.user.id },
        data: { phone: input.phone },
      })
    }),

  exportData: protectedProcedure.query(async ({ ctx }) => {
    const [user, bookings, reviews] = await Promise.all([
      db.user.findUnique({
        where: { id: ctx.user.id },
        select: { id: true, name: true, email: true, phone: true, image: true, createdAt: true },
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

  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    await db.booking.updateMany({
      where: { userId: ctx.user.id },
      data: { userId: null },
    })
    await db.review.deleteMany({ where: { userId: ctx.user.id } })
    // Cascade deletes Session and Account rows
    await db.user.delete({ where: { id: ctx.user.id } })
  }),
})
