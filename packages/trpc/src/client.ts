import { createTRPCClient as _createTRPCClient, httpBatchLink } from "@trpc/client"
import type { AppRouter } from "./router"

export function createTRPCClient(baseUrl: string, getToken: () => string | null | Promise<string | null>) {
  return _createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${baseUrl}/trpc`,
        headers: async () => {
          const token = await getToken()
          return token ? { Authorization: `Bearer ${token}` } : {}
        },
      }),
    ],
  })
}
