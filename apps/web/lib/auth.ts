import type { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.id_token) {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/google`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken: account.id_token }),
            },
          )
          if (res.ok) {
            const { accessToken } = (await res.json()) as { accessToken: string }
            token.accessToken = accessToken
            // Decode API JWT to extract id and isAdmin
            const base64Payload = accessToken.split(".")[1]
            if (base64Payload) {
              const payload = JSON.parse(Buffer.from(base64Payload, "base64url").toString()) as {
                id?: string
                isAdmin?: boolean
              }
              token.userId = payload.id
              token.isAdmin = payload.isAdmin ?? false
            }
          }
        } catch (err) {
          console.error("[auth] Failed to exchange Google token:", err)
        }
      }
      return token
    },

    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken as string | undefined,
        user: {
          ...session.user,
          id: (token.userId as string | undefined) ?? token.sub ?? "",
          isAdmin: (token.isAdmin as boolean | undefined) ?? false,
        },
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/" },
}
