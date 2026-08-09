import { styled, Button as TamaguiButton } from "tamagui"

export const Button = styled(TamaguiButton, {
  name: "Button",
  borderRadius: "$4",
  fontWeight: "600",
  fontSize: "$4",
  height: 44,
  paddingHorizontal: "$4",

  variants: {
    variant: {
      default: {
        backgroundColor: "$primary",
        color: "$primaryForeground",
        pressStyle: { opacity: 0.85 },
      },
      outline: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "$borderColor",
        color: "$color",
        pressStyle: { backgroundColor: "$backgroundHover" },
      },
      ghost: {
        backgroundColor: "transparent",
        color: "$color",
        pressStyle: { backgroundColor: "$backgroundHover" },
      },
      destructive: {
        backgroundColor: "$red10",
        color: "$white1",
        pressStyle: { opacity: 0.85 },
      },
    },
  } as const,

  defaultVariants: {
    variant: "default",
  },
})

export type ButtonProps = React.ComponentProps<typeof Button>
