import { styled, TextArea as TamaguiTextArea } from "tamagui"

export const Textarea = styled(TamaguiTextArea, {
  name: "Textarea",
  borderWidth: 1,
  borderColor: "$borderColor",
  borderRadius: "$4",
  backgroundColor: "$background",
  color: "$color",
  fontSize: "$4",
  padding: "$3",
  minHeight: 100,

  focusStyle: {
    borderColor: "$primary",
    outlineColor: "$primary",
  },
})
