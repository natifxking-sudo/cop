"use client"

import type React from "react"

import { useAuth } from "@/lib/auth/context"
import { LoginForm } from "./login-form"
import type { User } from "@/lib/types/database"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: User["role"][]
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, allowedRoles, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-slate-400">You don't have permission to access this resource.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
