import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { bearer } from "better-auth/plugins"
import { db } from "@barberlab/db"

export const auth = betterAuth({
  secret: process.env.JWT_SECRET,
  database: prismaAdapter(db, { provider: "postgresql" }),
  plugins: [bearer()],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  user: {
    additionalFields: {
      isAdmin: {
        type: "boolean",
        defaultValue: false,
        required: false,
        input: false,
      },
      phone: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  // TRUSTED_ORIGINS: comma-separated list of extra origins (e.g. LAN IPs for device testing)
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:8081",
    "http://localhost:4000",
    ...(process.env.WEB_URL ? [process.env.WEB_URL] : []),
    ...(process.env.TRUSTED_ORIGINS ? process.env.TRUSTED_ORIGINS.split(",").map((o) => o.trim()) : []),
  ],
})

export type Auth = typeof auth
