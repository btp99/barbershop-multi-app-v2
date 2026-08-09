import { z } from "zod"
import { db } from "@barberlab/db"
import { startOfDay, endOfDay } from "date-fns"
import { router, publicProcedure } from "../trpc"

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

function minutesToTime(mins: number) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

function overlaps(
  slotStart: number,
  slotEnd: number,
  blocks: { startTime: string; endTime: string }[],
) {
  return blocks.some((b) => {
    const bStart = timeToMinutes(b.startTime)
    const bEnd = timeToMinutes(b.endTime)
    return slotStart < bEnd && slotEnd > bStart
  })
}

export const slotsRouter = router({
  getSlots: publicProcedure
    .input(
      z.object({
        date: z.string(),
        duration: z.number().default(30),
        after: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const date = new Date(input.date)
      const dayOfWeek = date.getDay()
      const duration = input.duration
      const afterMinutes = input.after ? timeToMinutes(input.after) : 0

      const [barbershop, bookedServices, blocks] = await Promise.all([
        db.barbershop.findFirst({
          include: { businessHours: { where: { dayOfWeek } } },
        }),
        db.bookingService.findMany({
          where: {
            booking: {
              date: { gte: startOfDay(date), lte: endOfDay(date) },
              status: { not: "CANCELLED" },
            },
          },
          select: { startTime: true, endTime: true },
        }),
        db.timeBlock.findMany({
          where: { date: { gte: startOfDay(date), lte: endOfDay(date) } },
          select: { startTime: true, endTime: true },
        }),
      ])

      if (!barbershop) return { slots: [], closed: true }

      const hours = barbershop.businessHours[0]
      if (!hours || hours.closed) return { slots: [], closed: true }

      const conflicts = [...bookedServices, ...blocks]

      // For today, filter out past slots with 15-min buffer
      const now = new Date()
      const isToday =
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
      const nowMinutes = isToday ? now.getHours() * 60 + now.getMinutes() + 15 : 0

      function buildSlots(open: string, close: string) {
        const result: { time: string; available: boolean }[] = []
        const openMin = timeToMinutes(open)
        const closeMin = timeToMinutes(close)
        for (let start = openMin; start + duration <= closeMin; start += 15) {
          if (start < afterMinutes) continue
          if (start < nowMinutes) continue
          result.push({
            time: minutesToTime(start),
            available: !overlaps(start, start + duration, conflicts),
          })
        }
        return result
      }

      const morning =
        hours.morningOpen && hours.morningClose
          ? buildSlots(hours.morningOpen, hours.morningClose)
          : []

      const afternoon =
        hours.afternoonOpen && hours.afternoonClose
          ? buildSlots(hours.afternoonOpen, hours.afternoonClose)
          : []

      return { slots: [...morning, ...afternoon], closed: false }
    }),

  getClosedDays: publicProcedure.query(async () => {
    const barbershop = await db.barbershop.findFirst({
      include: { businessHours: true },
    })

    if (!barbershop) return { closedDaysOfWeek: [] }

    const closedDaysOfWeek = barbershop.businessHours
      .filter((bh) => bh.closed || (!bh.morningOpen && !bh.afternoonOpen))
      .map((bh) => bh.dayOfWeek)

    return { closedDaysOfWeek }
  }),
})
