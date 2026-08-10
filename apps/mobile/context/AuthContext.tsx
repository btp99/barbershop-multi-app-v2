import { createContext, useContext, useEffect, useState } from "react"
import * as Google from "expo-auth-session/providers/google"
import * as WebBrowser from "expo-web-browser"
import { Platform } from "react-native"
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

  // On web: handle the OAuth redirect callback (code arrives in URL query params)
  useEffect(() => {
    if (Platform.OS !== "web") return

    const url = new URL(window.location.href)
    const code = url.searchParams.get("code")
    const state = url.searchParams.get("state")
    const storedState = sessionStorage.getItem("oauth_state")
    const storedVerifier = sessionStorage.getItem("oauth_verifier")

    if (!code || !storedVerifier || state !== storedState) return

    window.history.replaceState({}, "", window.location.pathname)
    sessionStorage.removeItem("oauth_state")
    sessionStorage.removeItem("oauth_verifier")

    void fetch(`${API_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        codeVerifier: storedVerifier,
        redirectUri: window.location.origin,
      }),
    })
      .then((r) => r.json() as Promise<{ accessToken?: string }>)
      .then(async (data) => {
        if (data.accessToken) {
          await setToken(data.accessToken)
          setTokenState(data.accessToken)
        }
      })
  }, [])

  // On native: handle expo-auth-session response
  useEffect(() => {
    if (response?.type === "success") {
      const idToken = response.authentication?.idToken
      if (idToken) void exchangeIdToken(idToken)
    }
  }, [response])

  const exchangeIdToken = async (idToken: string) => {
    const res = await fetch(`${API_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    })
    const data = (await res.json()) as { accessToken?: string }
    if (data.accessToken) {
      await setToken(data.accessToken)
      setTokenState(data.accessToken)
    }
  }

  const signIn = async () => {
    if (Platform.OS === "web") {
      await webSignIn()
      return
    }
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

// Redirects the whole page to Google OAuth — avoids COOP popup detection issues on web
async function webSignIn() {
  const verifier = generateVerifier()
  const challenge = await generateChallenge(verifier)
  const state = crypto.randomUUID()

  sessionStorage.setItem("oauth_verifier", verifier)
  sessionStorage.setItem("oauth_state", state)

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: window.location.origin,
    response_type: "code",
    scope: "openid email profile",
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
  })

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

function generateVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
}

async function generateChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier)
  const hash = await crypto.subtle.digest("SHA-256", data)
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
}

export function useAuth() {
  return useContext(AuthContext)
}
