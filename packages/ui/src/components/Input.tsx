import { styled, Input as TamaguiInput, YStack, Text } from "tamagui"

export const Input = styled(TamaguiInput, {
  name: "Input",
  borderWidth: 1,
  borderColor: "$borderColor",
  borderRadius: "$4",
  backgroundColor: "$background",
  color: "$color",
  fontSize: "$4",
  height: 44,
  paddingHorizontal: "$3",

  focusStyle: {
    borderColor: "$primary",
    outlineColor: "$primary",
  },
})

interface LabeledInputProps extends React.ComponentProps<typeof Input> {
  label?: string
}

export function LabeledInput({ label, ...props }: LabeledInputProps) {
  return (
    <YStack gap="$1">
      {label && (
        <Text fontSize="$3" fontWeight="500" color="$colorSubtle">
          {label}
        </Text>
      )}
      <Input {...props} />
    </YStack>
  )
}
