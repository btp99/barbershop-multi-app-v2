"use client"

import { createTRPCClient } from "@barberlab/trpc/browser"
import { getSession } from "next-auth/react"

export const trpc = createTRPCClient(
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  async () => {
    const session = await getSession()
    return (session as { accessToken?: string } | null)?.accessToken ?? null
  },
)
