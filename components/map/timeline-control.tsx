"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, SkipBack, SkipForward, Clock } from "lucide-react"

interface TimelineEvent {
  id: string
  title: string
  timestamp: Date
  type: string
  status: string
}

interface TimelineControlProps {
  events: TimelineEvent[]
  onTimeChange: (startTime: Date, endTime: Date) => void
  className?: string
}

export function TimelineControl({ events, onTimeChange, className = "" }: TimelineControlProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 100])
  const [playbackSpeed, setPlaybackSpeed] = useState(1)

  // Calculate time bounds from events
  const timeEvents = events.filter((e) => e.timestamp)
  const minTime = timeEvents.length > 0 ? Math.min(...timeEvents.map((e) => e.timestamp.getTime())) : Date.now()
  const maxTime = timeEvents.length > 0 ? Math.max(...timeEvents.map((e) => e.timestamp.getTime())) : Date.now()
  const totalDuration = maxTime - minTime

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + playbackSpeed
          if (next >= 100) {
            setIsPlaying(false)
            return 100
          }
          return next
        })
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isPlaying, playbackSpeed])

  useEffect(() => {
    // Convert slider values to actual timestamps
    const startTime = new Date(minTime + (timeRange[0] / 100) * totalDuration)
    const endTime = new Date(minTime + (timeRange[1] / 100) * totalDuration)
    onTimeChange(startTime, endTime)
  }, [timeRange, minTime, totalDuration, onTimeChange])

  const handlePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const handleReset = () => {
    setCurrentTime(0)
    setIsPlaying(false)
  }

  const handleSkipToEnd = () => {
    setCurrentTime(100)
    setIsPlaying(false)
  }

  const formatTime = (percentage: number) => {
    const timestamp = new Date(minTime + (percentage / 100) * totalDuration)
    return timestamp.toLocaleString()
  }

  const getEventsInRange = () => {
    const startTime = minTime + (timeRange[0] / 100) * totalDuration
    const endTime = minTime + (timeRange[1] / 100) * totalDuration

    return timeEvents.filter((event) => {
      const eventTime = event.timestamp.getTime()
      return eventTime >= startTime && eventTime <= endTime
    })
  }

  const eventsInRange = getEventsInRange()

  return (
    <Card className={`bg-card/95 backdrop-blur border-border ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Intelligence Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <SkipBack className="h-3 w-3" />
          </Button>
          <Button variant="outline" size="sm" onClick={handlePlay}>
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
          <Button variant="outline" size="sm" onClick={handleSkipToEnd}>
            <SkipForward className="h-3 w-3" />
          </Button>
          <div className="flex items-center gap-1 ml-2">
            <span className="text-xs text-muted-foreground">Speed:</span>
            <Button
              variant={playbackSpeed === 0.5 ? "default" : "outline"}
              size="sm"
              onClick={() => setPlaybackSpeed(0.5)}
              className="text-xs px-2 py-1 h-6"
            >
              0.5x
            </Button>
            <Button
              variant={playbackSpeed === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => setPlaybackSpeed(1)}
              className="text-xs px-2 py-1 h-6"
            >
              1x
            </Button>
            <Button
              variant={playbackSpeed === 2 ? "default" : "outline"}
              size="sm"
              onClick={() => setPlaybackSpeed(2)}
              className="text-xs px-2 py-1 h-6"
            >
              2x
            </Button>
          </div>
        </div>

        {/* Time Range Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(timeRange[0])}</span>
            <span>{formatTime(timeRange[1])}</span>
          </div>
          <Slider
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as [number, number])}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Current Time Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Current Time:</span>
            <span className="text-xs font-mono">{formatTime(currentTime)}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1">
            <div
              className="bg-primary h-1 rounded-full transition-all duration-100"
              style={{ width: `${currentTime}%` }}
            />
          </div>
        </div>

        {/* Events in Range */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-card-foreground">Events in Range</span>
            <Badge variant="outline" className="text-xs">
              {eventsInRange.length}
            </Badge>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {eventsInRange.length === 0 ? (
              <p className="text-xs text-muted-foreground">No events in selected time range</p>
            ) : (
              eventsInRange.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-2 bg-muted rounded text-xs">
                  <div>
                    <div className="font-medium text-card-foreground truncate">{event.title}</div>
                    <div className="text-muted-foreground">{event.timestamp.toLocaleString()}</div>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-xs">
                      {event.type}
                    </Badge>
                    <Badge
                      className={
                        event.status === "APPROVED"
                          ? "bg-chart-1 text-white text-xs"
                          : event.status === "PENDING"
                            ? "bg-chart-3 text-white text-xs"
                            : "bg-chart-2 text-white text-xs"
                      }
                    >
                      {event.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
