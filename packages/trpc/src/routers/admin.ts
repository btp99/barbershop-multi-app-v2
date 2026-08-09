import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { db } from "@barberlab/db"
import { startOfDay, endOfDay, startOfMonth, endOfMonth, format } from "date-fns"
import { router, adminProcedure } from "../trpc"
import { sendBookingNotification } from "../lib/notifications"

const serviceEntrySchema = z.object({
  serviceId: z.string(),
  startTime: z.string(),
  endTime: z.string(),
})

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

export const adminRouter = router({
  getBookingsForDate: adminProcedure
    .input(z.object({ date: z.coerce.date() }))
    .query(async ({ input }) => {
      return db.booking.findMany({
        where: {
          date: {
            gte: startOfDay(input.date),
            lte: endOfDay(input.date),
          },
        },
        include: {
          services: { include: { service: true } },
          user: true,
          client: true,
        },
        orderBy: { startTime: "asc" },
      })
    }),

  getBookingCounts: adminProcedure
    .input(z.object({ year: z.number(), month: z.number() }))
    .query(async ({ input }) => {
      const date = new Date(input.year, input.month - 1, 1)
      const bookings = await db.booking.findMany({
        where: {
          date: { gte: startOfMonth(date), lte: endOfMonth(date) },
          status: { not: "CANCELLED" },
        },
        select: { date: true },
      })

      const counts: Record<string, number> = {}
      for (const b of bookings) {
        const key = format(b.date, "yyyy-MM-dd")
        counts[key] = (counts[key] ?? 0) + 1
      }
      return counts
    }),

  createBooking: adminProcedure
    .input(
      z.object({
        date: z.coerce.date(),
        services: z.array(serviceEntrySchema).min(1),
        clientId: z.string().optional(),
        userId: z.string().optional(),
        note: z.string().optional(),
        clientMessage: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const sorted = [...input.services].sort(
        (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
      )

      const startTime = sorted[0].startTime
      const endTime = sorted[sorted.length - 1].endTime
      const newStart = timeToMinutes(startTime)
      const newEnd = timeToMinutes(endTime)
      const totalDuration = newEnd - newStart

      const existing = await db.booking.findMany({
        where: {
          date: { gte: startOfDay(input.date), lte: endOfDay(input.date) },
          status: { not: "CANCELLED" },
        },
        select: { startTime: true, endTime: true },
      })

      const hasConflict = existing.some((b) => {
        const bStart = timeToMinutes(b.startTime)
        const bEnd = timeToMinutes(b.endTime)
        return newStart < bEnd && bStart < newEnd
      })

      if (hasConflict) {
        throw new TRPCError({ code: "CONFLICT", message: "overlap" })
      }

      const booking = await db.booking.create({
        data: {
          clientId: input.clientId ?? null,
          userId: input.userId ?? null,
          date: startOfDay(input.date),
          startTime,
          endTime,
          totalDuration,
          status: "CONFIRMED",
          note: input.note ?? null,
          clientMessage: input.clientMessage ?? null,
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

  cancelBooking: adminProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ input }) => {
      await db.booking.update({
        where: { id: input.bookingId },
        data: { status: "CANCELLED" },
      })
      void sendBookingNotification(input.bookingId, "booking_cancellation")
    }),

  completeBooking: adminProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ input }) => {
      await db.booking.update({
        where: { id: input.bookingId },
        data: { status: "COMPLETED" },
      })
    }),

  updateBusinessHours: adminProcedure
    .input(
      z.object({
        id: z.string(),
        closed: z.boolean(),
        morningOpen: z.string().nullable(),
        morningClose: z.string().nullable(),
        afternoonOpen: z.string().nullable(),
        afternoonClose: z.string().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input
      await db.businessHours.update({ where: { id }, data })
    }),

  updateBarbershop: adminProcedure
    .input(
      z.object({
        name: z.string(),
        address: z.string(),
        description: z.string(),
        phones: z.array(z.string()),
        imageUrl: z.string(),
        logoUrl: z.string().optional(),
        amenities: z.array(z.string()),
      }),
    )
    .mutation(async ({ input }) => {
      const barbershop = await db.barbershop.findFirst()
      if (!barbershop) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Nenhuma barbearia encontrada" })
      }
      await db.barbershop.update({
        where: { id: barbershop.id },
        data: input,
      })
    }),
})
