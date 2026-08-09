import { styled, Text, XStack } from "tamagui"

export const BadgeContainer = styled(XStack, {
  name: "Badge",
  borderRadius: 999,
  paddingHorizontal: "$2",
  paddingVertical: "$1",
  alignSelf: "flex-start",

  variants: {
    variant: {
      default: { backgroundColor: "$primary" },
      secondary: { backgroundColor: "$secondary" },
      destructive: { backgroundColor: "$red10" },
      outline: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "$borderColor",
      },
    },
  } as const,

  defaultVariants: {
    variant: "default",
  },
})

interface BadgeProps {
  children: React.ReactNode
  variant?: "default" | "secondary" | "destructive" | "outline"
}

export function Badge({ children, variant = "default" }: BadgeProps) {
  return (
    <BadgeContainer variant={variant}>
      <Text
        fontSize="$2"
        fontWeight="600"
        color={variant === "outline" ? "$color" : "$white1"}
      >
        {children}
      </Text>
    </BadgeContainer>
  )
}
