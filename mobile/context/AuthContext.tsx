import { createContext, useContext, useEffect, useState } from "react"
import * as Google from "expo-auth-session/providers/google"
import * as WebBrowser from "expo-web-browser"
import { Alert, Platform } from "react-native"
import { getToken, setToken, clearToken } from "../lib/auth"
import { authClient } from "../lib/authClient"
import { trpc } from "../lib/trpc"

WebBrowser.maybeCompleteAuthSession()

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000"
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? ""

export interface AuthUser {
  id: string
  email: string
  isAdmin: boolean
  phone: string | null
}

interface AuthCtx {
  token: string | null
  user: AuthUser | null
  isLoading: boolean
  signInGoogle: () => Promise<void>
  signInEmail: (email: string, password: string) => Promise<void>
  signUpEmail: (name: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthCtx>({
  token: null,
  user: null,
  isLoading: true,
  signInGoogle: async () => {},
  signInEmail: async () => {},
  signUpEmail: async () => {},
  signOut: async () => {},
  refreshUser: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
  })

  const fetchUser = async (): Promise<AuthUser | null> => {
    try {
      const me = await trpc.user.getMe.query()
      return {
        id: me.id,
        email: me.email,
        isAdmin: me.isAdmin,
        phone: me.phone ?? null,
      }
    } catch {
      return null
    }
  }

  // Load persisted session on startup
  useEffect(() => {
    getToken().then(async (t) => {
      if (t) {
        setTokenState(t)
        const u = await fetchUser()
        if (u) {
          setUser(u)
        } else {
          // Token expired or invalid — clear it
          await clearToken()
          setTokenState(null)
        }
      }
      setIsLoading(false)
    })
  }, [])

  // Handle Google OAuth response (native)
  useEffect(() => {
    if (response?.type !== "success") return
    const idToken = response.authentication?.idToken
    if (!idToken) {
      Alert.alert("Erro", "Token do Google não encontrado. Tenta novamente.")
      return
    }
    void handleGoogleIdToken(idToken)
  }, [response])

  const handleGoogleIdToken = async (idToken: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      })
      const data = (await res.json()) as { accessToken?: string; error?: string }
      if (!res.ok || !data.accessToken) {
        throw new Error(data.error ?? "Falha ao autenticar")
      }
      await setToken(data.accessToken)
      setTokenState(data.accessToken)
      const u = await fetchUser()
      setUser(u)
    } catch (err) {
      Alert.alert("Erro", err instanceof Error ? err.message : "Não foi possível autenticar com Google.")
    }
  }

  const signInGoogle = async () => {
    if (Platform.OS === "web") {
      try {
        await webGoogleSignIn()
      } catch (err) {
        Alert.alert("Erro", err instanceof Error ? err.message : "Erro desconhecido")
      }
      return
    }
    if (!request) {
      Alert.alert("Aguarda", "A autenticação ainda não está pronta. Tenta novamente.")
      return
    }
    try {
      await promptAsync()
    } catch (err) {
      Alert.alert("Erro", err instanceof Error ? err.message : "Não foi possível abrir a janela de autenticação.")
    }
  }

  const webGoogleSignIn = async () => {
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

  // On web: handle OAuth redirect back
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
      body: JSON.stringify({ code, codeVerifier: storedVerifier, redirectUri: window.location.origin }),
    })
      .then((r) => r.json() as Promise<{ accessToken?: string }>)
      .then(async (data) => {
        if (data.accessToken) {
          await setToken(data.accessToken)
          setTokenState(data.accessToken)
          const u = await fetchUser()
          setUser(u)
        }
      })
  }, [])

  const signInEmail = async (email: string, password: string) => {
    const { error } = await authClient.signIn.email({ email, password })
    if (error) throw new Error(error.message ?? "Credenciais inválidas")
    const t = await getToken()
    setTokenState(t)
    const u = await fetchUser()
    setUser(u)
  }

  const signUpEmail = async (name: string, email: string, password: string) => {
    const { error } = await authClient.signUp.email({ name, email, password })
    if (error) throw new Error(error.message ?? "Não foi possível criar a conta")
    const t = await getToken()
    setTokenState(t)
    const u = await fetchUser()
    setUser(u)
  }

  const signOut = async () => {
    const t = token
    await clearToken()
    setTokenState(null)
    setUser(null)
    // Invalidate the session on the server (fire-and-forget)
    if (t) {
      fetch(`${API_URL}/api/auth/sign-out`, {
        method: "POST",
        headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      }).catch(() => {})
    }
  }

  const refreshUser = async () => {
    const u = await fetchUser()
    if (u) setUser(u)
  }

  return (
    <AuthContext.Provider value={{ token, user, isLoading, signInGoogle, signInEmail, signUpEmail, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
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
