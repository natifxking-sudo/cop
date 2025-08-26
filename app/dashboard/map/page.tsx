import { ProtectedRoute } from "@/components/auth/protected-route"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MapDashboard } from "@/components/dashboard/map-dashboard"

export default function MapPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <MapDashboard />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
