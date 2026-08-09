import { XStack, YStack, Text } from "tamagui"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { Card, CardContent } from "./Card"
import { Badge } from "./Badge"
import { Button } from "./Button"

type BookingStatus = "CONFIRMED" | "CANCELLED" | "COMPLETED"

interface BookingCardProps {
  date: Date
  startTime: string
  endTime: string
  services: { name: string; price: number }[]
  barbershopName: string
  barbershopAddress?: string
  status: BookingStatus
  onCancel?: () => void
}

const statusLabel: Record<BookingStatus, string> = {
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Concluído",
}

const statusVariant: Record<BookingStatus, "default" | "secondary" | "destructive"> = {
  CONFIRMED: "default",
  CANCELLED: "destructive",
  COMPLETED: "secondary",
}

export function BookingCard({
  date,
  startTime,
  endTime,
  services,
  barbershopName,
  barbershopAddress,
  status,
  onCancel,
}: BookingCardProps) {
  return (
    <Card>
      <CardContent>
        <XStack justifyContent="space-between" alignItems="flex-start">
          <YStack gap="$1" flex={1}>
            <Text fontWeight="700" fontSize="$5">
              {barbershopName}
            </Text>
            {barbershopAddress && (
              <Text color="$colorSubtle" fontSize="$3">
                {barbershopAddress}
              </Text>
            )}
          </YStack>
          <Badge variant={statusVariant[status]}>{statusLabel[status]}</Badge>
        </XStack>

        <YStack marginTop="$2" gap="$1">
          <Text fontSize="$3" fontWeight="600" color="$colorSubtle" textTransform="capitalize">
            {format(date, "EEEE, d 'de' MMMM", { locale: pt })}
          </Text>
          <Text fontSize="$4" fontWeight="700">
            {startTime} – {endTime}
          </Text>
        </YStack>

        <YStack marginTop="$2" gap="$1">
          {services.map((s, i) => (
            <Text key={i} fontSize="$3" color="$colorSubtle">
              {s.name}
            </Text>
          ))}
        </YStack>

        {onCancel && status === "CONFIRMED" && (
          <Button variant="destructive" size="$3" marginTop="$3" onPress={onCancel}>
            Cancelar agendamento
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
