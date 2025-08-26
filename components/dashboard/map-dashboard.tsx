"use client"

import { useState, useEffect } from "react"
import { IntelligenceMap } from "@/components/map/intelligence-map"
import { TimelineControl } from "@/components/map/timeline-control"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth/context"
import { Map, Activity, Clock, Filter } from "lucide-react"

interface TimelineEvent {
  id: string
  title: string
  timestamp: Date
  type: string
  status: string
}

export function MapDashboard() {
  const { user, token } = useAuth()
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])
  const [timeFilter, setTimeFilter] = useState<{ start: Date; end: Date } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      loadTimelineData()
    }
  }, [token])

  const loadTimelineData = async () => {
    try {
      const response = await fetch((process.env.NEXT_PUBLIC_API_URL as string) + "/api/events", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const events = await response.json()
        const timelineData = events
          .filter((e: any) => e.createdAt)
          .map((e: any) => ({
            id: e.id,
            title: e.title,
            timestamp: new Date(e.createdAt),
            type: e.type,
            status: e.status,
          }))
        setTimelineEvents(timelineData)
      }
    } catch (error) {
      console.error("[v0] Failed to load timeline data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTimeChange = (startTime: Date, endTime: Date) => {
    setTimeFilter({ start: startTime, end: endTime })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading intelligence map...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Intelligence Map</h1>
          <p className="text-muted-foreground">Geospatial visualization of intelligence data</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-chart-1 text-white">
            <Map className="h-3 w-3 mr-1" />
            GEOSPATIAL
          </Badge>
          <Badge variant="outline">{user?.clearanceLevel}</Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{timelineEvents.length}</div>
            <p className="text-xs text-muted-foreground">Intelligence events</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Approved</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {timelineEvents.filter((e) => e.status === "APPROVED").length}
            </div>
            <p className="text-xs text-muted-foreground">Operational events</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {timelineEvents.filter((e) => e.status === "PENDING").length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">This Week</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {
                timelineEvents.filter((e) => {
                  const weekAgo = new Date()
                  weekAgo.setDate(weekAgo.getDate() - 7)
                  return e.timestamp > weekAgo
                }).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Recent events</p>
          </CardContent>
        </Card>
      </div>

      {/* Map and Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Map */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <IntelligenceMap className="h-[600px]" />
            </CardContent>
          </Card>
        </div>

        {/* Timeline Control */}
        <div className="space-y-4">
          <TimelineControl events={timelineEvents} onTimeChange={handleTimeChange} className="h-fit" />

          {/* Time Filter Info */}
          {timeFilter && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Active Time Filter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xs">
                  <div className="text-muted-foreground">From:</div>
                  <div className="font-mono">{timeFilter.start.toLocaleString()}</div>
                </div>
                <div className="text-xs">
                  <div className="text-muted-foreground">To:</div>
                  <div className="font-mono">{timeFilter.end.toLocaleString()}</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setTimeFilter(null)} className="w-full text-xs">
                  Clear Filter
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
