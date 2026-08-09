import { createTRPCClient } from "@barberlab/trpc/browser"
import { getToken } from "./auth"

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000"

export const trpc = createTRPCClient(API_URL, getToken)
