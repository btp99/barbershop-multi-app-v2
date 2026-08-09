import { Avatar as TamaguiAvatar, Text, styled } from "tamagui"

const AvatarContainer = styled(TamaguiAvatar, {
  borderRadius: 999,
  borderWidth: 2,
  borderColor: "$borderColor",
})

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: number
}

export function Avatar({ src, name, size = 40 }: AvatarProps) {
  const initials = name
    ? name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?"

  return (
    <AvatarContainer size={size} circular>
      {src && (
        <TamaguiAvatar.Image
          source={{ uri: src }}
          accessibilityLabel={name ?? "Avatar"}
        />
      )}
      <TamaguiAvatar.Fallback backgroundColor="$backgroundFocus">
        <Text fontWeight="600" color="$color" fontSize={size * 0.4}>
          {initials}
        </Text>
      </TamaguiAvatar.Fallback>
    </AvatarContainer>
  )
}
