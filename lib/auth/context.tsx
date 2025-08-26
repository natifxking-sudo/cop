"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "../types/database"

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing token on mount
    const savedToken = localStorage.getItem("cop_token")
    if (savedToken) {
      setToken(savedToken)
      fetchUserProfile(savedToken)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        // Token is invalid, clear it
        localStorage.removeItem("cop_token")
        setToken(null)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch user profile:", error)
      localStorage.removeItem("cop_token")
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        const data = await response.json()
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem("cop_token", data.token)
        return true
      } else {
        return false
      }
    } catch (error) {
      console.error("[v0] Login failed:", error)
      return false
    }
  }

  const logout = async () => {
    try {
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      }
    } catch (error) {
      console.error("[v0] Logout error:", error)
    } finally {
      setUser(null)
      setToken(null)
      localStorage.removeItem("cop_token")
    }
  }

  return <AuthContext.Provider value={{ user, token, login, logout, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
