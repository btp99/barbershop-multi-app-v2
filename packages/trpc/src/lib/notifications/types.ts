export type NotificationType =
  | "booking_confirmation"
  | "booking_cancellation"
  | "booking_reminder"

export interface BookingNotificationPayload {
  type: NotificationType
  recipientEmail?: string | null
  recipientName: string
  recipientPhone?: string | null
  bookingId: string
  date: Date
  startTime: string
  endTime: string
  services: { name: string; price: number; duration: number }[]
  totalPrice: number
  barbershopName: string
  barbershopAddress?: string | null
  barbershopPhone?: string | null
  barbershopLogoUrl?: string | null
}

export type NotificationPayload = BookingNotificationPayload
