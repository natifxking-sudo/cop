"use client"

import { useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth/context"
import { Layers, MapPin } from "lucide-react"

interface MapEvent {
  id: string
  title: string
  type: string
  confidenceScore: number
  status: string
  location: {
    type: "Point"
    coordinates: [number, number]
  }
  createdAt: string
  classification: string
}

interface MapReport {
  id: string
  title: string
  type: "SOCMINT" | "SIGINT" | "HUMINT"
  location: {
    type: "Point"
    coordinates: [number, number]
  }
  submittedAt: string
  classification: string
  reliability?: string
}

interface LayerControls {
  events: boolean
  socmint: boolean
  sigint: boolean
  humint: boolean
  aois: boolean
  approved: boolean
  pending: boolean
}

export function IntelligenceMap({ className = "" }: { className?: string }) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const { user, token } = useAuth()
  const [isLoaded, setIsLoaded] = useState(false)
  const [events, setEvents] = useState<MapEvent[]>([])
  const [reports, setReports] = useState<MapReport[]>([])
  const [selectedFeature, setSelectedFeature] = useState<any>(null)
  const [layerControls, setLayerControls] = useState<LayerControls>({
    events: true,
    socmint: true,
    sigint: true,
    humint: true,
    aois: true,
    approved: true,
    pending: user?.role === "HQ",
  })

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Initialize map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "raster-tiles": {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "background",
            type: "background",
            paint: {
              "background-color": "#1f2937",
            },
          },
          {
            id: "simple-tiles",
            type: "raster",
            source: "raster-tiles",
            paint: {
              "raster-opacity": 0.8,
              "raster-brightness-min": 0.3,
              "raster-brightness-max": 0.7,
              "raster-contrast": 0.2,
            },
          },
        ],
      },
      center: [-74.006, 40.7128], // NYC default
      zoom: 10,
      pitch: 0,
      bearing: 0,
    })

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), "top-right")
    map.current.addControl(new maplibregl.FullscreenControl(), "top-right")

    map.current.on("load", () => {
      setIsLoaded(true)
      loadMapData()
    })

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (isLoaded && map.current) {
      updateMapLayers()
    }
  }, [layerControls, events, reports, isLoaded])

  const loadMapData = async () => {
    if (!token) return

    try {
      // Load events
      const eventsResponse = await fetch((process.env.NEXT_PUBLIC_API_URL as string) + "/api/events", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json()
        setEvents(eventsData.filter((e: MapEvent) => e.location))
      }

      // Load reports
      const reportsResponse = await fetch((process.env.NEXT_PUBLIC_API_URL as string) + "/api/reports", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json()
        setReports(reportsData.filter((r: MapReport) => r.location))
      }
    } catch (error) {
      console.error("[v0] Failed to load map data:", error)
    }
  }

  const updateMapLayers = () => {
    if (!map.current || !isLoaded) return

    // Clear existing layers and sources
    const layersToRemove = ["events-layer", "socmint-layer", "sigint-layer", "humint-layer", "aoi-layer"]
    const sourcesToRemove = ["events", "socmint", "sigint", "humint", "aois"]

    layersToRemove.forEach((layerId) => {
      if (map.current!.getLayer(layerId)) {
        map.current!.removeLayer(layerId)
      }
    })

    sourcesToRemove.forEach((sourceId) => {
      if (map.current!.getSource(sourceId)) {
        map.current!.removeSource(sourceId)
      }
    })

    // Add events layer
    if (layerControls.events && events.length > 0) {
      const filteredEvents = events.filter((event) => {
        if (!layerControls.approved && event.status === "APPROVED") return false
        if (!layerControls.pending && event.status === "PENDING") return false
        return true
      })

      if (filteredEvents.length > 0) {
        const eventsGeoJSON = {
          type: "FeatureCollection" as const,
          features: filteredEvents.map((event) => ({
            type: "Feature" as const,
            geometry: event.location,
            properties: {
              id: event.id,
              title: event.title,
              type: event.type,
              status: event.status,
              confidence: event.confidenceScore,
              classification: event.classification,
              createdAt: event.createdAt,
              featureType: "event",
            },
          })),
        }

        map.current.addSource("events", {
          type: "geojson",
          data: eventsGeoJSON,
        })

        map.current.addLayer({
          id: "events-layer",
          type: "circle",
          source: "events",
          paint: {
            "circle-radius": [
              "case",
              ["==", ["get", "status"], "APPROVED"],
              8,
              ["==", ["get", "status"], "PENDING"],
              6,
              4,
            ],
            "circle-color": [
              "case",
              ["==", ["get", "status"], "APPROVED"],
              "#6366f1",
              ["==", ["get", "status"], "PENDING"],
              "#f59e0b",
              "#dc2626",
            ],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.8,
          },
        })
      }
    }

    // Add report layers
    const reportTypes = [
      { type: "SOCMINT", color: "#6366f1", enabled: layerControls.socmint },
      { type: "SIGINT", color: "#dc2626", enabled: layerControls.sigint },
      { type: "HUMINT", color: "#f59e0b", enabled: layerControls.humint },
    ]

    reportTypes.forEach(({ type, color, enabled }) => {
      if (enabled) {
        const typeReports = reports.filter((r) => r.type === type)
        if (typeReports.length > 0) {
          const reportsGeoJSON = {
            type: "FeatureCollection" as const,
            features: typeReports.map((report) => ({
              type: "Feature" as const,
              geometry: report.location,
              properties: {
                id: report.id,
                title: report.title,
                type: report.type,
                classification: report.classification,
                reliability: report.reliability,
                submittedAt: report.submittedAt,
                featureType: "report",
              },
            })),
          }

          map.current!.addSource(type.toLowerCase(), {
            type: "geojson",
            data: reportsGeoJSON,
          })

          map.current!.addLayer({
            id: `${type.toLowerCase()}-layer`,
            type: "circle",
            source: type.toLowerCase(),
            paint: {
              "circle-radius": 5,
              "circle-color": color,
              "circle-stroke-width": 1,
              "circle-stroke-color": "#ffffff",
              "circle-opacity": 0.7,
            },
          })
        }
      }
    })

    // Add click handlers
    const clickableLayers = ["events-layer", "socmint-layer", "sigint-layer", "humint-layer"]
    clickableLayers.forEach((layerId) => {
      if (map.current!.getLayer(layerId)) {
        map.current!.on("click", layerId, (e) => {
          if (e.features && e.features[0]) {
            setSelectedFeature(e.features[0])
          }
        })

        map.current!.on("mouseenter", layerId, () => {
          map.current!.getCanvas().style.cursor = "pointer"
        })

        map.current!.on("mouseleave", layerId, () => {
          map.current!.getCanvas().style.cursor = ""
        })
      }
    })
  }

  const toggleLayer = (layer: keyof LayerControls) => {
    setLayerControls((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }))
  }

  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence > 0.8) return "bg-chart-1 text-white"
    if (confidence > 0.6) return "bg-chart-3 text-white"
    return "bg-chart-2 text-white"
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-chart-1 text-white"
      case "PENDING":
        return "bg-chart-3 text-white"
      case "REJECTED":
        return "bg-chart-2 text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden" />

      {/* Layer Controls */}
      <Card className="absolute top-4 left-4 bg-card/95 backdrop-blur border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Map Layers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="events-toggle" className="text-sm">
              Intelligence Events
            </Label>
            <Switch id="events-toggle" checked={layerControls.events} onCheckedChange={() => toggleLayer("events")} />
          </div>

          {user?.role === "HQ" && (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="approved-toggle" className="text-sm">
                  Approved Only
                </Label>
                <Switch
                  id="approved-toggle"
                  checked={layerControls.approved}
                  onCheckedChange={() => toggleLayer("approved")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="pending-toggle" className="text-sm">
                  Pending Events
                </Label>
                <Switch
                  id="pending-toggle"
                  checked={layerControls.pending}
                  onCheckedChange={() => toggleLayer("pending")}
                />
              </div>
            </>
          )}

          <div className="border-t border-border pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="socmint-toggle" className="text-sm flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-1"></div>
                SOCMINT
              </Label>
              <Switch
                id="socmint-toggle"
                checked={layerControls.socmint}
                onCheckedChange={() => toggleLayer("socmint")}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="sigint-toggle" className="text-sm flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-2"></div>
                SIGINT
              </Label>
              <Switch id="sigint-toggle" checked={layerControls.sigint} onCheckedChange={() => toggleLayer("sigint")} />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="humint-toggle" className="text-sm flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-3"></div>
                HUMINT
              </Label>
              <Switch id="humint-toggle" checked={layerControls.humint} onCheckedChange={() => toggleLayer("humint")} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Details Popup */}
      {selectedFeature && (
        <Card className="absolute top-4 right-4 w-80 bg-card/95 backdrop-blur border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {selectedFeature.properties.featureType === "event" ? "Intelligence Event" : "Intelligence Report"}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedFeature(null)}>
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h3 className="font-semibold text-card-foreground">{selectedFeature.properties.title}</h3>
              <p className="text-sm text-muted-foreground">{selectedFeature.properties.type}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedFeature.properties.featureType === "event" && (
                <>
                  <Badge className={getStatusBadgeColor(selectedFeature.properties.status)}>
                    {selectedFeature.properties.status}
                  </Badge>
                  <Badge className={getConfidenceBadgeColor(selectedFeature.properties.confidence)}>
                    {Math.round(selectedFeature.properties.confidence * 100)}% confidence
                  </Badge>
                </>
              )}
              <Badge variant="outline">{selectedFeature.properties.classification}</Badge>
              {selectedFeature.properties.reliability && (
                <Badge variant="outline">Reliability: {selectedFeature.properties.reliability}</Badge>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              {selectedFeature.properties.featureType === "event" ? "Created" : "Submitted"}:{" "}
              {new Date(
                selectedFeature.properties.createdAt || selectedFeature.properties.submittedAt,
              ).toLocaleString()}
            </div>

            <div className="text-xs text-muted-foreground">
              Location: {selectedFeature.geometry.coordinates[1].toFixed(4)},{" "}
              {selectedFeature.geometry.coordinates[0].toFixed(4)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map Legend */}
      <Card className="absolute bottom-4 left-4 bg-card/95 backdrop-blur border-border">
        <CardContent className="p-3">
          <div className="text-xs font-semibold text-card-foreground mb-2">Legend</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-chart-1 border border-white"></div>
              <span className="text-muted-foreground">Approved Events</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-chart-3 border border-white"></div>
              <span className="text-muted-foreground">Pending Events</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-chart-1"></div>
              <span className="text-muted-foreground">SOCMINT Reports</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-chart-2"></div>
              <span className="text-muted-foreground">SIGINT Reports</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-chart-3"></div>
              <span className="text-muted-foreground">HUMINT Reports</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
