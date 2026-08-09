export interface EmailMessage {
  to: string
  subject: string
  html: string
}

function isConfigured() {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS)
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  if (!isConfigured()) {
    console.warn("[notifications] SMTP not configured — skipping email to", message.to)
    return
  }

  const nodemailer = await import("nodemailer")
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  await transport.sendMail({
    from:
      process.env.SMTP_FROM ??
      `"${process.env.SMTP_SENDER_NAME ?? "BarberLab"}" <${process.env.SMTP_USER}>`,
    to: message.to,
    subject: message.subject,
    html: message.html,
  })
}
