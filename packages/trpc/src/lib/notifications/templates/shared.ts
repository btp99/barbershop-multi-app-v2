import { format } from "date-fns"
import { pt } from "date-fns/locale"

export function formatBookingDate(date: Date): string {
  return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt })
}

export function formatBookingPrice(price: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(price)
}

export interface LayoutOptions {
  previewText: string
  headerColor: string
  shopName: string
  shopLogoUrl?: string | null
  children: string
  shopAddress?: string | null
  shopPhone?: string | null
}

export function emailLayout(opts: LayoutOptions): string {
  const logoHtml = opts.shopLogoUrl
    ? `<img src="${opts.shopLogoUrl}" alt="${opts.shopName}" height="36" style="display:block;max-height:36px;margin:0 auto 8px;" />`
    : ""

  const footer = `
    <tr>
      <td style="padding:24px 32px;text-align:center;background:#f4f4f5;">
        <p style="margin:0 0 4px;font-size:13px;color:#71717a;font-family:sans-serif;">${opts.shopName}</p>
        ${opts.shopAddress ? `<p style="margin:0 0 4px;font-size:12px;color:#a1a1aa;font-family:sans-serif;">${opts.shopAddress}</p>` : ""}
        ${opts.shopPhone ? `<p style="margin:0;font-size:12px;color:#a1a1aa;font-family:sans-serif;">${opts.shopPhone}</p>` : ""}
      </td>
    </tr>
  `

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${opts.previewText}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;">
  <div style="display:none;max-height:0;overflow:hidden;">${opts.previewText}&zwnj;&nbsp;</div>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f4f5;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;width:100%;">
          <tr>
            <td style="background:${opts.headerColor};border-radius:12px 12px 0 0;padding:24px 32px;text-align:center;">
              ${logoHtml}
              <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;font-family:sans-serif;">${opts.shopName}</p>
            </td>
          </tr>
          ${opts.children}
          ${footer}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export interface BookingDetailsOptions {
  date: Date
  startTime: string
  endTime: string
  services: { name: string; price: number }[]
  totalPrice: number
}

export function bookingDetailsBlock(opts: BookingDetailsOptions): string {
  const serviceRows = opts.services
    .map(
      (s) => `
    <tr>
      <td style="padding:6px 0;font-size:14px;color:#3f3f46;font-family:sans-serif;">${s.name}</td>
      <td style="padding:6px 0;font-size:14px;color:#3f3f46;font-family:sans-serif;text-align:right;">${formatBookingPrice(s.price)}</td>
    </tr>`,
    )
    .join("")

  return `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:4px;">
    <tr>
      <td width="50%" style="padding:0 8px 16px 0;vertical-align:top;">
        <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#a1a1aa;text-transform:uppercase;font-family:sans-serif;">Data</p>
        <p style="margin:0;font-size:15px;font-weight:600;color:#18181b;font-family:sans-serif;text-transform:capitalize;">${formatBookingDate(opts.date)}</p>
      </td>
      <td width="50%" style="padding:0 0 16px 8px;vertical-align:top;">
        <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#a1a1aa;text-transform:uppercase;font-family:sans-serif;">Horário</p>
        <p style="margin:0;font-size:15px;font-weight:600;color:#18181b;font-family:sans-serif;">${opts.startTime}&nbsp;–&nbsp;${opts.endTime}</p>
      </td>
    </tr>
    <tr><td colspan="2" style="padding:0 0 16px;"><div style="height:1px;background:#e4e4e7;"></div></td></tr>
    <tr>
      <td colspan="2" style="padding:0 0 8px;">
        <p style="margin:0;font-size:11px;font-weight:600;color:#a1a1aa;text-transform:uppercase;font-family:sans-serif;">Serviços</p>
      </td>
    </tr>
    ${serviceRows}
    <tr><td colspan="2" style="padding:12px 0;"><div style="height:1px;background:#e4e4e7;"></div></td></tr>
    <tr>
      <td style="font-size:15px;font-weight:700;color:#18181b;font-family:sans-serif;">Total</td>
      <td style="font-size:15px;font-weight:700;color:#18181b;font-family:sans-serif;text-align:right;">${formatBookingPrice(opts.totalPrice)}</td>
    </tr>
  </table>`
}
