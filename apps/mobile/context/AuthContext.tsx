import { createContext, useContext, useEffect, useState } from "react"
import * as Google from "expo-auth-session/providers/google"
import * as WebBrowser from "expo-web-browser"
import { getToken, setToken, clearToken } from "../lib/auth"

WebBrowser.maybeCompleteAuthSession()

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000"
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? ""

interface AuthCtx {
  token: string | null
  isLoading: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthCtx>({
  token: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
  })

  useEffect(() => {
    getToken().then((t) => {
      setTokenState(t)
      setIsLoading(false)
    })
  }, [])

  useEffect(() => {
    if (response?.type === "success") {
      const idToken = response.authentication?.idToken
      if (idToken) {
        void exchangeToken(idToken)
      }
    }
  }, [response])

  const exchangeToken = async (idToken: string) => {
    const res = await fetch(`${API_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    })
    const data = await res.json() as { accessToken?: string }
    if (data.accessToken) {
      await setToken(data.accessToken)
      setTokenState(data.accessToken)
    }
  }

  const signIn = async () => {
    await promptAsync()
  }

  const signOut = async () => {
    await clearToken()
    setTokenState(null)
  }

  return (
    <AuthContext.Provider value={{ token, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
