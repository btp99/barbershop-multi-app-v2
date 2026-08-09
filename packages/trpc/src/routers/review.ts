import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { db } from "@barberlab/db"
import { router, protectedProcedure, adminProcedure } from "../trpc"

export const reviewRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        barbershopId: z.string(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await db.review.upsert({
        where: {
          barbershopId_userId: {
            barbershopId: input.barbershopId,
            userId: ctx.user.id,
          },
        },
        update: { rating: input.rating, comment: input.comment ?? null },
        create: {
          barbershopId: input.barbershopId,
          userId: ctx.user.id,
          rating: input.rating,
          comment: input.comment ?? null,
        },
      })
    }),

  delete: adminProcedure
    .input(z.object({ reviewId: z.string() }))
    .mutation(async ({ input }) => {
      const review = await db.review.findUnique({ where: { id: input.reviewId } })
      if (!review) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Avaliação não encontrada" })
      }
      await db.review.delete({ where: { id: input.reviewId } })
    }),
})
