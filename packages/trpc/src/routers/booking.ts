import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { db } from "@barberlab/db"
import { startOfDay } from "date-fns"
import { router, protectedProcedure } from "../trpc"
import { sendBookingNotification, sendNotification } from "../lib/notifications"

const serviceEntrySchema = z.object({
  serviceId: z.string(),
  startTime: z.string(),
  endTime: z.string(),
})

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

export const bookingRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        date: z.coerce.date(),
        services: z.array(serviceEntrySchema).min(1),
        note: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sorted = [...input.services].sort(
        (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
      )

      const startTime = sorted[0].startTime
      const endTime = sorted[sorted.length - 1].endTime
      const totalDuration = timeToMinutes(endTime) - timeToMinutes(startTime)

      const booking = await db.booking.create({
        data: {
          userId: ctx.user.id,
          date: startOfDay(input.date),
          startTime,
          endTime,
          totalDuration,
          note: input.note ?? null,
          services: {
            create: sorted.map((s) => ({
              serviceId: s.serviceId,
              startTime: s.startTime,
              endTime: s.endTime,
            })),
          },
        },
      })

      void sendBookingNotification(booking.id, "booking_confirmation")
      return { bookingId: booking.id }
    }),

  delete: protectedProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await db.booking.findUnique({
        where: { id: input.bookingId },
        include: {
          user: { select: { name: true, email: true } },
          services: {
            include: {
              service: { select: { name: true, price: true, duration: true } },
            },
          },
        },
      })

      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agendamento não encontrado" })
      }
      if (booking.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para cancelar este agendamento" })
      }

      const shop = await db.barbershop.findFirst({
        select: { name: true, address: true, phones: true, logoUrl: true },
      })

      const services = booking.services.map((bs) => ({
        name: bs.service.name,
        price:
          typeof bs.service.price === "object" && "toNumber" in bs.service.price
            ? (bs.service.price as { toNumber: () => number }).toNumber()
            : Number(bs.service.price),
        duration: bs.service.duration,
      }))

      const notificationPayload = {
        type: "booking_cancellation" as const,
        recipientName: booking.user?.name ?? "Cliente",
        recipientEmail: booking.user?.email ?? null,
        recipientPhone: null,
        bookingId: booking.id,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        services,
        totalPrice: services.reduce((s, sv) => s + sv.price, 0),
        barbershopName: shop?.name ?? "Barbearia",
        barbershopAddress: shop?.address ?? null,
        barbershopPhone: shop?.phones?.[0] ?? null,
        barbershopLogoUrl: shop?.logoUrl ?? null,
      }

      await db.booking.delete({ where: { id: input.bookingId } })
      void sendNotification(notificationPayload)
    }),

  getUserBookings: protectedProcedure
    .input(
      z.object({
        type: z.enum(["confirmed", "concluded"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const today = startOfDay(new Date())

      if (input.type === "confirmed") {
        return db.booking.findMany({
          where: {
            userId: ctx.user.id,
            date: { gte: today },
            status: { not: "CANCELLED" },
          },
          include: {
            services: {
              include: { service: { include: { barbershop: true } } },
            },
          },
          orderBy: [{ date: "asc" }, { startTime: "asc" }],
        })
      }

      return db.booking.findMany({
        where: {
          userId: ctx.user.id,
          OR: [
            { date: { lt: today } },
            { status: "COMPLETED" },
          ],
        },
        include: {
          services: {
            include: { service: { include: { barbershop: true } } },
          },
        },
        orderBy: [{ date: "desc" }, { startTime: "desc" }],
      })
    }),
})
