import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { db } from "@barberlab/db"
import { router, adminProcedure } from "../trpc"

const DEFAULT_IMAGE =
  "https://utfs.io/f/0ddfbd26-a424-43a0-aaf3-c3f1dc6be6d1-1kgxo7.png"

export const serviceRouter = router({
  upsert: adminProcedure
    .input(
      z.object({
        id: z.string().optional(),
        name: z.string(),
        description: z.string(),
        price: z.number(),
        duration: z.number(),
        imageUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const barbershop = await db.barbershop.findFirst()
      if (!barbershop) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Nenhuma barbearia encontrada" })
      }

      const imageUrl = input.imageUrl?.trim() || DEFAULT_IMAGE

      if (input.id) {
        await db.barbershopService.update({
          where: { id: input.id },
          data: {
            name: input.name,
            description: input.description,
            price: input.price,
            duration: input.duration,
            imageUrl,
          },
        })
      } else {
        await db.barbershopService.create({
          data: {
            name: input.name,
            description: input.description,
            price: input.price,
            duration: input.duration,
            imageUrl,
            barbershopId: barbershop.id,
          },
        })
      }
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.barbershopService.delete({ where: { id: input.id } })
    }),
})
