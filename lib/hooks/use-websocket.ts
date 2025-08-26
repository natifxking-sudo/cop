"use client"

import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/lib/auth/context"

interface WebSocketMessage {
  type: string
  data?: any
  message?: string
}

export function useWebSocket() {
  const { user } = useAuth()
  const ws = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<WebSocketMessage[]>([])

  useEffect(() => {
    if (!user) return

    // Connect to WebSocket server
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const wsUrl = `${protocol}//${window.location.host}/api/websocket`
    ws.current = new WebSocket(wsUrl)

    ws.current.onopen = () => {
      console.log("[v0] WebSocket connected")
      setIsConnected(true)

      // Authenticate with server
      ws.current?.send(
        JSON.stringify({
          type: "auth",
          userId: user.id,
          role: user.role,
          clearanceLevel: user.clearanceLevel,
        }),
      )
    }

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        setMessages((prev) => [...prev, message])

        // Handle different message types
        if (message.type === "new_event") {
          // Trigger map update
          window.dispatchEvent(new CustomEvent("map-update", { detail: message.data }))
        } else if (message.type === "new_report") {
          // Trigger dashboard update
          window.dispatchEvent(new CustomEvent("dashboard-update", { detail: message.data }))
        } else if (message.type === "decision_update") {
          // Trigger decision log update
          window.dispatchEvent(new CustomEvent("decision-update", { detail: message.data }))
        }
      } catch (error) {
        console.error("[v0] WebSocket message parse error:", error)
      }
    }

    ws.current.onclose = () => {
      console.log("[v0] WebSocket disconnected")
      setIsConnected(false)
    }

    ws.current.onerror = (error) => {
      console.error("[v0] WebSocket error:", error)
    }

    return () => {
      ws.current?.close()
    }
  }, [user])

  const sendMessage = (message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
    }
  }

  const sendChatMessage = (message: string, channel = "general") => {
    sendMessage({
      type: "chat_message",
      message,
      channel,
    })
  }

  return {
    isConnected,
    messages,
    sendMessage,
    sendChatMessage,
  }
}
