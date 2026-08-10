import { TRPCError } from "@trpc/server"
import { db } from "@barberlab/db"
import { router, protectedProcedure } from "../trpc"

export const userRouter = router({
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
