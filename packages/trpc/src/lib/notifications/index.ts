import { db } from "@barberlab/db"
import type { NotificationPayload } from "./types"
import { sendEmail } from "./channels/email"
import { sendSms } from "./channels/sms"
import { buildBookingConfirmationEmail } from "./templates/booking-confirmation"
import { buildBookingCancellationEmail } from "./templates/booking-cancellation"
import { buildBookingReminderEmail } from "./templates/booking-reminder"

async function getShopContext() {
  const shop = await db.barbershop.findFirst({
    select: { name: true, address: true, phones: true, logoUrl: true },
  })
  return {
    barbershopName: shop?.name ?? "Barbearia",
    barbershopAddress: shop?.address ?? null,
    barbershopPhone: shop?.phones?.[0] ?? null,
    barbershopLogoUrl: shop?.logoUrl ?? null,
  }
}

export async function sendNotification(payload: NotificationPayload): Promise<void> {
  const { recipientEmail, recipientPhone } = payload

  if (recipientEmail) {
    try {
      let message: { subject: string; html: string }
      if (payload.type === "booking_confirmation") {
        message = buildBookingConfirmationEmail(payload)
      } else if (payload.type === "booking_cancellation") {
        message = buildBookingCancellationEmail(payload)
      } else {
        message = buildBookingReminderEmail(payload)
      }
      await sendEmail({ to: recipientEmail, ...message })
    } catch (err) {
      console.error("[notifications] Failed to send email:", err)
    }
  }

  if (recipientPhone) {
    try {
      const smsBody = buildSmsBody(payload)
      await sendSms({ to: recipientPhone, body: smsBody })
    } catch (err) {
      console.error("[notifications] Failed to send SMS:", err)
    }
  }
}

export async function sendBookingNotification(
  bookingId: string,
  type: NotificationPayload["type"],
): Promise<void> {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      client: true,
      user: true,
      services: { include: { service: true } },
    },
  })

  if (!booking) return

  const recipient = {
    name: booking.client?.name ?? booking.user?.name ?? "Cliente",
    email: booking.client?.email ?? booking.user?.email ?? null,
    phone: booking.client?.phone ?? null,
  }

  if (!recipient.email && !recipient.phone) return

  const shop = await getShopContext()
  const services = booking.services.map((bs) => ({
    name: bs.service.name,
    price:
      typeof bs.service.price === "object" && "toNumber" in bs.service.price
        ? (bs.service.price as { toNumber: () => number }).toNumber()
        : Number(bs.service.price),
    duration: bs.service.duration,
  }))
  const totalPrice = services.reduce((s, sv) => s + sv.price, 0)

  await sendNotification({
    type,
    recipientName: recipient.name,
    recipientEmail: recipient.email,
    recipientPhone: recipient.phone,
    bookingId: booking.id,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    services,
    totalPrice,
    ...shop,
  })
}

function buildSmsBody(payload: NotificationPayload): string {
  const { type, recipientName, barbershopName, startTime } = payload
  if (type === "booking_confirmation") {
    return `Olá ${recipientName}! O seu agendamento em ${barbershopName} está confirmado para as ${startTime}. Até já!`
  }
  if (type === "booking_cancellation") {
    return `Olá ${recipientName}. O seu agendamento em ${barbershopName} foi cancelado. Contacte-nos para reagendar.`
  }
  return `Lembrete: ${recipientName}, tem agendamento hoje às ${startTime} em ${barbershopName}. Estamos à sua espera!`
}
