"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth/context"
import { useWebSocket } from "@/lib/hooks/use-websocket"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { ChatPanel } from "@/components/chat/chat-panel"
import { Map, Activity, CheckCircle, XCircle, Clock, Users, BarChart3, Zap } from "lucide-react"

interface Event {
  id: string
  title: string
  type: string
  confidenceScore: number
  status: "PENDING" | "APPROVED" | "REJECTED"
  createdAt: string
  location?: { coordinates: [number, number] }
}

interface Decision {
  id: string
  title: string
  decisionType: string
  status: string
  createdAt: string
}

export function HQDashboard() {
  const { user, token } = useAuth()
  const { isConnected, messages } = useWebSocket()
  const [events, setEvents] = useState<Event[]>([])
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      fetchDashboardData()
    }
  }, [token])

  useEffect(() => {
    messages.forEach((msg) => {
      if (msg.type === "new_event" || msg.type === "event_updated") {
        fetchDashboardData() // Refresh events when new ones arrive
      } else if (msg.type === "decision_update") {
        fetchDashboardData() // Refresh when decisions are made
      }
    })
  }, [messages])

  const fetchDashboardData = async () => {
    try {
      // Fetch pending events
      const eventsResponse = await fetch("/api/events?status=PENDING", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json()
        setEvents(eventsData)
      }

      // Fetch recent decisions
      const decisionsResponse = await fetch("/api/decisions?limit=10", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (decisionsResponse.ok) {
        const decisionsData = await decisionsResponse.json()
        setDecisions(decisionsData)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEventDecision = async (eventId: string, action: "approve" | "reject", reason?: string) => {
    try {
      const response = await fetch("/api/decisions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          eventId,
          reason,
          notes: action === "approve" ? "Approved for operational use" : reason,
        }),
      })

      if (response.ok) {
        fetchDashboardData() // Refresh data
      }
    } catch (error) {
      console.error("[v0] Decision action failed:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading command center...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">HQ Command Center</h1>
          <p className="text-muted-foreground">Common Operational Picture - {new Date().toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
            {isConnected ? "CONNECTED" : "OFFLINE"}
          </Badge>
          <NotificationCenter />
          <Badge className="bg-chart-1 text-white">
            <Activity className="h-3 w-3 mr-1" />
            OPERATIONAL
          </Badge>
          <Badge variant="outline">{user?.clearanceLevel}</Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Pending Events</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {events.filter((e) => e.status === "PENDING").length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting decision</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Active Intelligence</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {events.filter((e) => e.status === "APPROVED").length}
            </div>
            <p className="text-xs text-muted-foreground">Approved events</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">High Confidence</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {events.filter((e) => e.confidenceScore > 0.8).length}
            </div>
            <p className="text-xs text-muted-foreground">&gt;80% confidence</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Decisions Today</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{decisions.length}</div>
            <p className="text-xs text-muted-foreground">Command decisions</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="events" className="space-y-4">
            <TabsList className="bg-muted">
              <TabsTrigger value="events">Pending Events</TabsTrigger>
              <TabsTrigger value="decisions">Decision Log</TabsTrigger>
              <TabsTrigger value="map">Operational Map</TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="space-y-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-card-foreground">Intelligence Events Requiring Decision</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Review and approve intelligence events for operational use
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {events.filter((e) => e.status === "PENDING").length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p>No pending events requiring decision</p>
                    </div>
                  ) : (
                    events
                      .filter((e) => e.status === "PENDING")
                      .map((event) => (
                        <div key={event.id} className="border border-border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h3 className="font-semibold text-card-foreground">{event.title}</h3>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{event.type}</Badge>
                                <Badge
                                  className={
                                    event.confidenceScore > 0.8
                                      ? "bg-chart-1 text-white"
                                      : event.confidenceScore > 0.6
                                        ? "bg-chart-3 text-white"
                                        : "bg-chart-2 text-white"
                                  }
                                >
                                  {Math.round(event.confidenceScore * 100)}% confidence
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Submitted: {new Date(event.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleEventDecision(event.id, "approve")}
                                className="bg-chart-1 hover:bg-chart-1/90 text-white"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleEventDecision(event.id, "reject", "Insufficient evidence")}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="decisions" className="space-y-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-card-foreground">Recent Command Decisions</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    History of HQ decisions and actions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {decisions.map((decision) => (
                    <div key={decision.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-card-foreground">{decision.title}</h3>
                          <p className="text-sm text-muted-foreground">{decision.decisionType}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(decision.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge
                          className={
                            decision.status === "ACTIVE"
                              ? "bg-chart-1 text-white"
                              : decision.status === "SUPERSEDED"
                                ? "bg-chart-3 text-white"
                                : "bg-muted text-muted-foreground"
                          }
                        >
                          {decision.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="map" className="space-y-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-card-foreground">Common Operational Picture</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Real-time intelligence visualization and geospatial analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Map className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Interactive map will be implemented in the next phase</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Will display events, AOIs, and force positions
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Chat Panel */}
        <div className="lg:col-span-1">
          <Card className="bg-card border-border h-full">
            <CardHeader>
              <CardTitle className="text-card-foreground">Command Communications</CardTitle>
              <CardDescription className="text-muted-foreground">
                Real-time coordination with analysts and observers
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <ChatPanel />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
