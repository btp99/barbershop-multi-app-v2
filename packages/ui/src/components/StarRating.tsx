import { XStack } from "tamagui"
import { Star } from "lucide-react-native"

interface StarRatingProps {
  value: number
  onChange?: (rating: number) => void
  readonly?: boolean
  size?: number
}

export function StarRating({ value, onChange, readonly = false, size = 24 }: StarRatingProps) {
  return (
    <XStack gap="$1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          color={star <= value ? "#FBBF24" : "#D1D5DB"}
          fill={star <= value ? "#FBBF24" : "none"}
          onPress={!readonly && onChange ? () => onChange(star) : undefined}
          style={!readonly ? { cursor: "pointer" } : undefined}
        />
      ))}
    </XStack>
  )
}
