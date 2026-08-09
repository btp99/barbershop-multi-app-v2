import { styled, YStack } from "tamagui"

export const Card = styled(YStack, {
  name: "Card",
  backgroundColor: "$background",
  borderRadius: "$6",
  borderWidth: 1,
  borderColor: "$borderColor",
  overflow: "hidden",

  shadowColor: "$shadowColor",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
  elevation: 2,
})

export const CardContent = styled(YStack, {
  name: "CardContent",
  padding: "$4",
  gap: "$2",
})

export type CardProps = React.ComponentProps<typeof Card>
