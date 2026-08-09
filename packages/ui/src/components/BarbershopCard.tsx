import { YStack, XStack, Text, Image } from "tamagui"
import { Card } from "./Card"
import { Badge } from "./Badge"
import { MapPin, Star } from "lucide-react-native"

interface BarbershopCardProps {
  name: string
  address: string
  imageUrl: string
  averageRating?: number
  reviewCount?: number
  amenities?: string[]
  onPress?: () => void
}

export function BarbershopCard({
  name,
  address,
  imageUrl,
  averageRating,
  reviewCount,
  amenities = [],
  onPress,
}: BarbershopCardProps) {
  return (
    <Card pressStyle={onPress ? { opacity: 0.85 } : undefined} onPress={onPress}>
      <Image
        source={{ uri: imageUrl }}
        width="100%"
        height={160}
        resizeMode="cover"
      />
      <YStack padding="$4" gap="$2">
        <Text fontWeight="700" fontSize="$5">
          {name}
        </Text>
        <XStack alignItems="center" gap="$1">
          <MapPin size={14} color="#71717a" />
          <Text color="$colorSubtle" fontSize="$3" numberOfLines={1} flex={1}>
            {address}
          </Text>
        </XStack>
        {averageRating !== undefined && (
          <XStack alignItems="center" gap="$1">
            <Star size={14} color="#FBBF24" fill="#FBBF24" />
            <Text fontSize="$3" fontWeight="600">
              {averageRating.toFixed(1)}
            </Text>
            {reviewCount !== undefined && (
              <Text color="$colorSubtle" fontSize="$3">
                ({reviewCount})
              </Text>
            )}
          </XStack>
        )}
        {amenities.length > 0 && (
          <XStack gap="$1" flexWrap="wrap" marginTop="$1">
            {amenities.slice(0, 3).map((a) => (
              <Badge key={a} variant="secondary">
                {a}
              </Badge>
            ))}
          </XStack>
        )}
      </YStack>
    </Card>
  )
}
