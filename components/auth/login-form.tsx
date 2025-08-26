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
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const success = await login(username, password)

    if (!success) {
      setError("Invalid credentials. Please try again.")
    }

    setLoading(false)
  }

  const demoUsers = [
    { username: "hq_commander", role: "HQ Commander", clearance: "SECRET" },
    { username: "socmint_analyst1", role: "SOCMINT Analyst", clearance: "SECRET" },
    { username: "sigint_analyst1", role: "SIGINT Analyst", clearance: "TOP SECRET" },
    { username: "humint_analyst1", role: "HUMINT Analyst", clearance: "SECRET" },
    { username: "observer1", role: "Observer", clearance: "CONFIDENTIAL" },
  ]

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
            <CardDescription className="text-slate-400">
              Enter your credentials to access the intelligence platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    required
                  />
                </div>
              </div>

              {error && (
                <Alert className="bg-red-900/20 border-red-800">
                  <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Authenticating..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-sm">Demo Accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {demoUsers.map((user) => (
              <div
                key={user.username}
                className="flex justify-between items-center p-2 bg-slate-700 rounded cursor-pointer hover:bg-slate-600"
                onClick={() => {
                  setUsername(user.username)
                  setPassword("cop123")
                }}
              >
                <div>
                  <div className="text-white text-sm font-medium">{user.role}</div>
                  <div className="text-slate-400 text-xs">{user.username}</div>
                </div>
                <div className="text-xs text-slate-400">{user.clearance}</div>
              </div>
            ))}
            <div className="text-xs text-slate-500 mt-2">Password for all demo accounts: cop123</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
