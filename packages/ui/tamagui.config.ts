import { defaultConfig } from "@tamagui/config/v4"
import { createTamagui } from "@tamagui/core"

export const tamaguiConfig = createTamagui(defaultConfig)

export default tamaguiConfig
export type Conf = typeof tamaguiConfig
declare module "tamagui" {
  interface TamaguiCustomConfig extends Conf {}
}
