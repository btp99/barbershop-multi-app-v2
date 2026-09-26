import { createAuthClient } from "better-auth/client"
import { setToken } from "./auth"

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000"

export const authClient = createAuthClient({
  baseURL: `${API_URL}/api/auth`,
  fetchOptions: {
    onSuccess: async (ctx) => {
      const token = ctx.response.headers.get("set-auth-token")
      if (token) await setToken(token)
    },
  },
})
