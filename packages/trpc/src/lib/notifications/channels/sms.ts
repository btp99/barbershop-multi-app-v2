export interface SmsMessage {
  to: string
  body: string
}

export async function sendSms(_message: SmsMessage): Promise<void> {
  console.warn("[notifications] SMS channel not yet implemented")
}
