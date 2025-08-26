"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth/context"
import { useWebSocket } from "@/lib/hooks/use-websocket"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { ChatPanel } from "@/components/chat/chat-panel"
import { FileText, Send, Zap, Activity, Clock } from "lucide-react"

interface Report {
  id: string
  title: string
  type: string
  status: string
  createdAt: string
  confidenceScore?: number
}

export function AnalystDashboard() {
  const { user, token } = useAuth()
  const { isConnected, messages } = useWebSocket()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [reportForm, setReportForm] = useState({
    title: "",
    content: {
      summary: "",
      details: "",
      source: "",
      location: "",
    },
    location: {
      lat: "",
      lng: "",
    },
    classification: "UNCLASSIFIED",
    reliability: "B",
    credibility: "2",
  })

  useEffect(() => {
    if (token) {
      fetchReports()
    }
  }, [token])

  useEffect(() => {
    messages.forEach((msg) => {
      if (msg.type === "report_processed" || msg.type === "fusion_complete") {
        fetchReports() // Refresh reports when they're processed
      }
    })
  }, [messages])

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/reports", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setReports(data)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch reports:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const reportData = {
        type: user?.role?.replace("ANALYST_", "") || "SOCMINT",
        title: reportForm.title,
        content: reportForm.content,
        location:
          reportForm.location.lat && reportForm.location.lng
            ? {
                coordinates: [Number.parseFloat(reportForm.location.lng), Number.parseFloat(reportForm.location.lat)],
              }
            : undefined,
        classification: reportForm.classification,
        reliability: reportForm.reliability,
        credibility: reportForm.credibility,
        collectionTime: new Date().toISOString(),
      }

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reportData),
      })

      if (response.ok) {
        // Reset form
        setReportForm({
          title: "",
          content: { summary: "", details: "", source: "", location: "" },
          location: { lat: "", lng: "" },
          classification: "UNCLASSIFIED",
          reliability: "B",
          credibility: "2",
        })
        fetchReports() // Refresh reports list
      }
    } catch (error) {
      console.error("[v0] Failed to submit report:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const getAnalystType = () => {
    return user?.role?.replace("ANALYST_", "") || "ANALYST"
  }

  const getAnalystColor = () => {
    switch (user?.role) {
      case "ANALYST_SOCMINT":
        return "bg-chart-1"
      case "ANALYST_SIGINT":
        return "bg-chart-2"
      case "ANALYST_HUMINT":
        return "bg-chart-3"
      default:
        return "bg-primary"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading analyst workspace...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{getAnalystType()} Analyst Workspace</h1>
          <p className="text-muted-foreground">Intelligence collection and analysis platform</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
            {isConnected ? "CONNECTED" : "OFFLINE"}
          </Badge>
          <NotificationCenter />
          <Badge className={`${getAnalystColor()} text-white`}>
            <Activity className="h-3 w-3 mr-1" />
            {getAnalystType()}
          </Badge>
          <Badge variant="outline">{user?.clearanceLevel}</Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">My Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{reports.length}</div>
            <p className="text-xs text-muted-foreground">Total submitted</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Processed</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {reports.filter((r) => r.status === "FUSED").length}
            </div>
            <p className="text-xs text-muted-foreground">Fused into events</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {reports.filter((r) => r.status === "SUBMITTED").length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting fusion</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">This Week</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {
                reports.filter((r) => {
                  const weekAgo = new Date()
                  weekAgo.setDate(weekAgo.getDate() - 7)
                  return new Date(r.createdAt) > weekAgo
                }).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Recent reports</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="submit" className="space-y-4">
            <TabsList className="bg-muted">
              <TabsTrigger value="submit">Submit Report</TabsTrigger>
              <TabsTrigger value="reports">My Reports</TabsTrigger>
              <TabsTrigger value="fusion">Fusion Workspace</TabsTrigger>
            </TabsList>

            <TabsContent value="submit" className="space-y-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-card-foreground">Submit {getAnalystType()} Report</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Submit intelligence report for fusion and analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitReport} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Report Title</Label>
                      <Input
                        id="title"
                        value={reportForm.title}
                        onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                        placeholder="Brief descriptive title"
                        required
                        className="bg-input border-border text-foreground"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="summary">Executive Summary</Label>
                        <Textarea
                          id="summary"
                          value={reportForm.content.summary}
                          onChange={(e) =>
                            setReportForm({
                              ...reportForm,
                              content: { ...reportForm.content, summary: e.target.value },
                            })
                          }
                          placeholder="Key findings and implications"
                          className="bg-input border-border text-foreground"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="details">Detailed Analysis</Label>
                        <Textarea
                          id="details"
                          value={reportForm.content.details}
                          onChange={(e) =>
                            setReportForm({
                              ...reportForm,
                              content: { ...reportForm.content, details: e.target.value },
                            })
                          }
                          placeholder="Comprehensive analysis and context"
                          className="bg-input border-border text-foreground"
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="source">Source Information</Label>
                        <Input
                          id="source"
                          value={reportForm.content.source}
                          onChange={(e) =>
                            setReportForm({
                              ...reportForm,
                              content: { ...reportForm.content, source: e.target.value },
                            })
                          }
                          placeholder="Source details and methodology"
                          className="bg-input border-border text-foreground"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location-desc">Location Description</Label>
                        <Input
                          id="location-desc"
                          value={reportForm.content.location}
                          onChange={(e) =>
                            setReportForm({
                              ...reportForm,
                              content: { ...reportForm.content, location: e.target.value },
                            })
                          }
                          placeholder="Geographic context"
                          className="bg-input border-border text-foreground"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="lat">Latitude</Label>
                        <Input
                          id="lat"
                          type="number"
                          step="any"
                          value={reportForm.location.lat}
                          onChange={(e) =>
                            setReportForm({
                              ...reportForm,
                              location: { ...reportForm.location, lat: e.target.value },
                            })
                          }
                          placeholder="40.7128"
                          className="bg-input border-border text-foreground"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lng">Longitude</Label>
                        <Input
                          id="lng"
                          type="number"
                          step="any"
                          value={reportForm.location.lng}
                          onChange={(e) =>
                            setReportForm({
                              ...reportForm,
                              location: { ...reportForm.location, lng: e.target.value },
                            })
                          }
                          placeholder="-74.0060"
                          className="bg-input border-border text-foreground"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="classification">Classification</Label>
                        <Select
                          value={reportForm.classification}
                          onValueChange={(value) => setReportForm({ ...reportForm, classification: value })}
                        >
                          <SelectTrigger className="bg-input border-border text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UNCLASSIFIED">UNCLASSIFIED</SelectItem>
                            <SelectItem value="CONFIDENTIAL">CONFIDENTIAL</SelectItem>
                            <SelectItem value="SECRET">SECRET</SelectItem>
                            <SelectItem value="TOP_SECRET">TOP SECRET</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reliability">Source Reliability</Label>
                        <Select
                          value={reportForm.reliability}
                          onValueChange={(value) => setReportForm({ ...reportForm, reliability: value })}
                        >
                          <SelectTrigger className="bg-input border-border text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">A - Completely reliable</SelectItem>
                            <SelectItem value="B">B - Usually reliable</SelectItem>
                            <SelectItem value="C">C - Fairly reliable</SelectItem>
                            <SelectItem value="D">D - Not usually reliable</SelectItem>
                            <SelectItem value="E">E - Unreliable</SelectItem>
                            <SelectItem value="F">F - Reliability unknown</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="credibility">Information Credibility</Label>
                        <Select
                          value={reportForm.credibility}
                          onValueChange={(value) => setReportForm({ ...reportForm, credibility: value })}
                        >
                          <SelectTrigger className="bg-input border-border text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 - Confirmed</SelectItem>
                            <SelectItem value="2">2 - Probably true</SelectItem>
                            <SelectItem value="3">3 - Possibly true</SelectItem>
                            <SelectItem value="4">4 - Doubtfully true</SelectItem>
                            <SelectItem value="5">5 - Improbable</SelectItem>
                            <SelectItem value="6">6 - Truth unknown</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {submitting ? "Submitting..." : "Submit Report"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-card-foreground">My Intelligence Reports</CardTitle>
                  <CardDescription className="text-muted-foreground">Track status of submitted reports</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reports.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p>No reports submitted yet</p>
                    </div>
                  ) : (
                    reports.map((report) => (
                      <div key={report.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-card-foreground">{report.title}</h3>
                            <p className="text-sm text-muted-foreground">{report.type}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(report.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                report.status === "FUSED"
                                  ? "bg-chart-1 text-white"
                                  : report.status === "PROCESSING"
                                    ? "bg-chart-3 text-white"
                                    : "bg-muted text-muted-foreground"
                              }
                            >
                              {report.status}
                            </Badge>
                            {report.confidenceScore && (
                              <Badge variant="outline">{Math.round(report.confidenceScore * 100)}% confidence</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fusion" className="space-y-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-card-foreground">Fusion Workspace</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Collaborate on intelligence fusion and correlation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Zap className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Fusion workspace will be implemented in the next phase</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Will enable collaborative analysis and report correlation
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-1">
          <Card className="bg-card border-border h-full">
            <CardHeader>
              <CardTitle className="text-card-foreground">Analyst Communications</CardTitle>
              <CardDescription className="text-muted-foreground">Coordinate with HQ and other analysts</CardDescription>
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
