import { emailLayout, bookingDetailsBlock } from "./shared"
import type { BookingNotificationPayload } from "../types"

export function buildBookingReminderEmail(
  payload: BookingNotificationPayload,
): { subject: string; html: string } {
  const subject = `Lembrete: O seu agendamento é hoje às ${payload.startTime} 💈`

  const body = `
    <tr>
      <td style="background:#d97706;padding:20px 32px;text-align:center;">
        <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;font-family:sans-serif;">Lembrete de Agendamento</p>
        <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.9);font-family:sans-serif;">Olá, ${payload.recipientName}! O seu agendamento é daqui a 1 hora.</p>
      </td>
    </tr>
    <tr>
      <td style="background:#ffffff;padding:28px 32px;">
        ${bookingDetailsBlock({ date: payload.date, startTime: payload.startTime, endTime: payload.endTime, services: payload.services, totalPrice: payload.totalPrice })}
      </td>
    </tr>
    ${payload.barbershopAddress ? `
    <tr>
      <td style="background:#fafafa;border-top:1px solid #e4e4e7;padding:16px 32px;">
        <p style="margin:0;font-size:13px;color:#71717a;font-family:sans-serif;">Onde nos encontra</p>
        <p style="margin:2px 0 0;font-size:14px;font-weight:600;color:#18181b;font-family:sans-serif;">${payload.barbershopAddress}</p>
      </td>
    </tr>` : ""}
    <tr>
      <td style="background:#ffffff;padding:20px 32px 28px;text-align:center;">
        <p style="margin:0;font-size:15px;font-weight:600;color:#18181b;font-family:sans-serif;">Estamos à sua espera! 💈</p>
        ${payload.barbershopPhone ? `<p style="margin:6px 0 0;font-size:13px;color:#a1a1aa;font-family:sans-serif;">Necessita de alterar? Contacte-nos pelo <strong style="color:#3f3f46;">${payload.barbershopPhone}</strong>.</p>` : ""}
      </td>
    </tr>
  `

  const html = emailLayout({
    previewText: `Lembrete: ${payload.services[0]?.name ?? "agendamento"} hoje às ${payload.startTime} em ${payload.barbershopName}`,
    headerColor: "#18181b",
    shopName: payload.barbershopName,
    shopLogoUrl: payload.barbershopLogoUrl,
    shopAddress: payload.barbershopAddress,
    shopPhone: payload.barbershopPhone,
    children: body,
  })

  return { subject, html }
}
