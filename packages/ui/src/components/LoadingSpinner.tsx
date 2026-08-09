import { Spinner, YStack } from "tamagui"

interface LoadingSpinnerProps {
  size?: "small" | "large"
  color?: string
}

export function LoadingSpinner({ size = "large" }: LoadingSpinnerProps) {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding="$8">
      <Spinner size={size} color="$primary" />
    </YStack>
  )
}
