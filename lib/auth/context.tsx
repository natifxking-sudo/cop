"use client"

import type React from "react"
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import Keycloak from "keycloak-js"
import { persistKeycloakToken } from "@/lib/api/client"

interface AuthContextType {
  keycloak: Keycloak | null
  user: { username: string; roles: string[] } | null
  token: string | null
  login: () => void
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [keycloak, setKeycloak] = useState<Keycloak | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<{ username: string; roles: string[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const kc = new Keycloak({
      url: process.env.NEXT_PUBLIC_KEYCLOAK_URL!,
      realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM!,
      clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID!,
    })

    kc.init({ onLoad: "check-sso", pkceMethod: "S256", silentCheckSsoRedirectUri: typeof window !== "undefined" ? `${window.location.origin}/silent-check-sso.html` : undefined })
      .then((authenticated) => {
        setKeycloak(kc)
        if (authenticated) {
          const t = kc.token || null
          setToken(t)
          persistKeycloakToken(t)
          const profile = kc.tokenParsed as any
          const roles: string[] = profile?.realm_access?.roles || []
          setUser({ username: profile?.preferred_username || "", roles })
        }
      })
      .finally(() => setLoading(false))

    const refresh = setInterval(() => {
      kc.updateToken(60).then((refreshed) => {
        if (refreshed) {
          const t = kc.token || null
          setToken(t)
          persistKeycloakToken(t)
        }
      }).catch(() => kc.login())
    }, 30000)

    return () => clearInterval(refresh)
  }, [])

  const value = useMemo<AuthContextType>(() => ({
    keycloak,
    user,
    token,
    login: () => keycloak?.login(),
    logout: () => keycloak?.logout({ redirectUri: typeof window !== "undefined" ? window.location.origin : undefined }),
    loading,
  }), [keycloak, user, token, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
