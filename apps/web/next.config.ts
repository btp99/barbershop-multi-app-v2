import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
    ],
  },
  transpilePackages: [
    "@barberlab/ui",
    "@barberlab/trpc",
    "tamagui",
    "@tamagui/core",
    "@tamagui/config",
    "@tamagui/web",
  ],
  serverExternalPackages: ["pg", "nodemailer", "@prisma/client", "@prisma/adapter-pg"],
  experimental: {
    optimizePackageImports: ["tamagui", "@tamagui/core"],
  },
}

export default nextConfig
