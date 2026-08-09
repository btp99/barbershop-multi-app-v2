import { emailLayout, bookingDetailsBlock, formatBookingDate } from "./shared"
import type { BookingNotificationPayload } from "../types"

export function buildBookingCancellationEmail(
  payload: BookingNotificationPayload,
): { subject: string; html: string } {
  const subject = `Agendamento cancelado — ${formatBookingDate(payload.date)} às ${payload.startTime}`

  const body = `
    <tr>
      <td style="background:#dc2626;padding:20px 32px;text-align:center;">
        <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;font-family:sans-serif;">Agendamento Cancelado</p>
        <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.85);font-family:sans-serif;">Olá, ${payload.recipientName}. O seu agendamento foi cancelado.</p>
      </td>
    </tr>
    <tr>
      <td style="background:#ffffff;padding:28px 32px;opacity:0.7;">
        ${bookingDetailsBlock({ date: payload.date, startTime: payload.startTime, endTime: payload.endTime, services: payload.services, totalPrice: payload.totalPrice })}
      </td>
    </tr>
    <tr>
      <td style="background:#fafafa;border-top:1px solid #e4e4e7;padding:24px 32px;text-align:center;">
        <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#18181b;font-family:sans-serif;">Pretende reagendar?</p>
        <p style="margin:0;font-size:13px;color:#71717a;font-family:sans-serif;">
          Pode contactar-nos${payload.barbershopPhone ? ` pelo <strong style="color:#3f3f46;">${payload.barbershopPhone}</strong>` : ""} para marcar uma nova visita.
        </p>
      </td>
    </tr>
  `

  const html = emailLayout({
    previewText: `Cancelado: ${payload.services[0]?.name ?? "agendamento"} – ${formatBookingDate(payload.date)} às ${payload.startTime}`,
    headerColor: "#18181b",
    shopName: payload.barbershopName,
    shopLogoUrl: payload.barbershopLogoUrl,
    shopAddress: payload.barbershopAddress,
    shopPhone: payload.barbershopPhone,
    children: body,
  })

  return { subject, html }
}
