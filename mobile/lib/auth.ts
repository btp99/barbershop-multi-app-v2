import * as SecureStore from "expo-secure-store"
import { Platform } from "react-native"

const TOKEN_KEY = "barberlab_token"

export async function getToken(): Promise<string | null> {
  if (Platform.OS === "web") return localStorage.getItem(TOKEN_KEY)
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function setToken(token: string): Promise<void> {
  if (Platform.OS === "web") { localStorage.setItem(TOKEN_KEY, token); return }
  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function clearToken(): Promise<void> {
  if (Platform.OS === "web") { localStorage.removeItem(TOKEN_KEY); return }
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}

export function decodeToken(token: string): { id: string; email: string; isAdmin: boolean } | null {
  try {
    const part = token.split(".")[1]
    if (!part) return null
    const padded = part.replace(/-/g, "+").replace(/_/g, "/")
    const decoded = JSON.parse(atob(padded))
    return {
      id: decoded.id as string,
      email: decoded.email as string,
      isAdmin: Boolean(decoded.isAdmin),
    }
  } catch {
    return null
  }
}
