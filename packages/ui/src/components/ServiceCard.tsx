import { XStack, YStack, Text, Image } from "tamagui"
import { Card, CardContent } from "./Card"
import { formatPrice, formatDuration } from "../utils"

interface ServiceCardProps {
  name: string
  description: string
  price: number
  duration: number
  imageUrl: string
  onBook?: () => void
  selected?: boolean
}

export function ServiceCard({
  name,
  description,
  price,
  duration,
  imageUrl,
  onBook,
  selected,
}: ServiceCardProps) {
  return (
    <Card
      borderColor={selected ? "$primary" : "$borderColor"}
      borderWidth={selected ? 2 : 1}
      pressStyle={onBook ? { opacity: 0.85 } : undefined}
      onPress={onBook}
    >
      <XStack>
        <Image
          source={{ uri: imageUrl }}
          width={90}
          height={90}
          resizeMode="cover"
        />
        <CardContent flex={1}>
          <Text fontWeight="700" fontSize="$4" numberOfLines={1}>
            {name}
          </Text>
          <Text color="$colorSubtle" fontSize="$3" numberOfLines={2}>
            {description}
          </Text>
          <XStack justifyContent="space-between" alignItems="center" marginTop="$1">
            <Text fontWeight="700" color="$primary" fontSize="$4">
              {formatPrice(price)}
            </Text>
            <Text color="$colorSubtle" fontSize="$3">
              {formatDuration(duration)}
            </Text>
          </XStack>
        </CardContent>
      </XStack>
    </Card>
  )
}
