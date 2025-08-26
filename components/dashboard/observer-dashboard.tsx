"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth/context"
import { Eye, CheckCircle, Clock, BarChart3, Map, Shield } from "lucide-react"

interface Event {
  id: string
  title: string
  type: string
  confidenceScore: number
  status: string
  createdAt: string
  approvedAt?: string
}

interface Decision {
  id: string
  title: string
  decisionType: string
  status: string
  createdAt: string
}

export function ObserverDashboard() {
  const { user, token } = useAuth()
  const [approvedEvents, setApprovedEvents] = useState<Event[]>([])
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      fetchDashboardData()
    }
  }, [token])

  const fetchDashboardData = async () => {
    try {
      // Fetch approved events only
      const eventsResponse = await fetch("/api/events?status=APPROVED", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json()
        setApprovedEvents(eventsData)
      }

      // Fetch decisions
      const decisionsResponse = await fetch("/api/decisions?limit=20", {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading intelligence overview...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Intelligence Overview</h1>
          <p className="text-muted-foreground">Observer access to approved intelligence and decisions</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-muted text-muted-foreground">
            <Eye className="h-3 w-3 mr-1" />
            OBSERVER
          </Badge>
          <Badge variant="outline">{user?.clearanceLevel}</Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Approved Events</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{approvedEvents.length}</div>
            <p className="text-xs text-muted-foreground">Operational intelligence</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">High Confidence</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {approvedEvents.filter((e) => e.confidenceScore > 0.8).length}
            </div>
            <p className="text-xs text-muted-foreground">&gt;80% confidence</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Recent Decisions</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {
                decisions.filter((d) => {
                  const dayAgo = new Date()
                  dayAgo.setDate(dayAgo.getDate() - 1)
                  return new Date(d.createdAt) > dayAgo
                }).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {
                approvedEvents.filter((e) => {
                  const weekAgo = new Date()
                  weekAgo.setDate(weekAgo.getDate() - 7)
                  return new Date(e.createdAt) > weekAgo
                }).length
              }
            </div>
            <p className="text-xs text-muted-foreground">New events</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="events">Approved Intelligence</TabsTrigger>
          <TabsTrigger value="decisions">Command Decisions</TabsTrigger>
          <TabsTrigger value="map">Intelligence Map</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Approved Intelligence Events</CardTitle>
              <CardDescription className="text-muted-foreground">
                HQ-approved intelligence for operational awareness
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {approvedEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p>No approved intelligence events available</p>
                </div>
              ) : (
                approvedEvents.map((event) => (
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
                          <Badge className="bg-chart-1 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            APPROVED
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Created: {new Date(event.createdAt).toLocaleString()}
                        </p>
                        {event.approvedAt && (
                          <p className="text-sm text-muted-foreground">
                            Approved: {new Date(event.approvedAt).toLocaleString()}
                          </p>
                        )}
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
              <CardTitle className="text-card-foreground">Command Decision Log</CardTitle>
              <CardDescription className="text-muted-foreground">
                Historical record of HQ command decisions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {decisions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p>No command decisions available</p>
                </div>
              ) : (
                decisions.map((decision) => (
                  <div key={decision.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-card-foreground">{decision.title}</h3>
                        <p className="text-sm text-muted-foreground">{decision.decisionType}</p>
                        <p className="text-xs text-muted-foreground">{new Date(decision.createdAt).toLocaleString()}</p>
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
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Intelligence Visualization</CardTitle>
              <CardDescription className="text-muted-foreground">
                Geospatial view of approved intelligence events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Map className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Intelligence map will be implemented in the next phase</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Will display approved events and operational picture
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
