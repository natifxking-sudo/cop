"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Lock, User } from "lucide-react"

export function LoginForm() {
  const [error] = useState("")
  const { login, loading } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">COP Platform</h1>
          <p className="text-slate-400 mt-2">Common Operational Picture</p>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Secure Login</CardTitle>
            <CardDescription className="text-slate-400">You will be redirected to Keycloak</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="bg-red-900/20 border-red-800">
                <AlertDescription className="text-red-400">{error}</AlertDescription>
              </Alert>
            )}

            <Button type="button" className="w-full" disabled={loading} onClick={() => login()}>
              {loading ? "Redirecting..." : "Login with Keycloak"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
