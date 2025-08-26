"use client"

import { useAuth } from "@/lib/auth/context"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Sidebar } from "@/components/dashboard/sidebar"
import { HQDashboard } from "@/components/dashboard/hq-dashboard"
import { AnalystDashboard } from "@/components/dashboard/analyst-dashboard"
import { ObserverDashboard } from "@/components/dashboard/observer-dashboard"

export default function HomePage() {
  const { user } = useAuth()

  const renderDashboard = () => {
    if (!user) return null

    switch (user.role) {
      case "HQ":
        return <HQDashboard />
      case "ANALYST_SOCMINT":
      case "ANALYST_SIGINT":
      case "ANALYST_HUMINT":
        return <AnalystDashboard />
      case "OBSERVER":
        return <ObserverDashboard />
      default:
        return <div className="text-center py-8 text-muted-foreground">Unknown role: {user.role}</div>
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6">{renderDashboard()}</div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
