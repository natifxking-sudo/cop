import { WebSocketServer, WebSocket } from "ws"
import type { IncomingMessage } from "http"
import { verifyToken, type JWTPayload } from "@/lib/auth/jwt"

interface AuthenticatedWebSocket extends WebSocket {
  user?: JWTPayload
  subscriptions?: Set<string>
}

export class WebSocketService {
  private wss: WebSocketServer | null = null
  private clients: Set<AuthenticatedWebSocket> = new Set()

  initialize(server: any) {
    this.wss = new WebSocketServer({ server })

    this.wss.on("connection", (ws: AuthenticatedWebSocket, request: IncomingMessage) => {
      console.log("[v0] WebSocket connection established")

      // Handle authentication
      ws.on("message", (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString())

          if (message.type === "auth") {
            const payload = verifyToken(message.token)
            if (payload) {
              ws.user = payload
              ws.subscriptions = new Set()
              this.clients.add(ws)
              ws.send(JSON.stringify({ type: "auth_success", user: payload }))
              console.log(`[v0] WebSocket authenticated: ${payload.username}`)
            } else {
              ws.send(JSON.stringify({ type: "auth_error", message: "Invalid token" }))
              ws.close()
            }
          } else if (message.type === "subscribe" && ws.user) {
            // Subscribe to specific channels (events, reports, decisions)
            if (message.channel) {
              ws.subscriptions?.add(message.channel)
              ws.send(JSON.stringify({ type: "subscribed", channel: message.channel }))
            }
          } else if (message.type === "unsubscribe" && ws.user) {
            if (message.channel) {
              ws.subscriptions?.delete(message.channel)
              ws.send(JSON.stringify({ type: "unsubscribed", channel: message.channel }))
            }
          }
        } catch (error) {
          console.error("[v0] WebSocket message error:", error)
        }
      })

      ws.on("close", () => {
        this.clients.delete(ws)
        console.log("[v0] WebSocket connection closed")
      })

      ws.on("error", (error) => {
        console.error("[v0] WebSocket error:", error)
        this.clients.delete(ws)
      })
    })
  }

  broadcast(channel: string, data: any, excludeRoles?: string[]) {
    const message = JSON.stringify({
      type: "broadcast",
      channel,
      data,
      timestamp: new Date().toISOString(),
    })

    this.clients.forEach((client) => {
      if (
        client.readyState === WebSocket.OPEN &&
        client.user &&
        client.subscriptions?.has(channel) &&
        (!excludeRoles || !excludeRoles.includes(client.user.role))
      ) {
        client.send(message)
      }
    })
  }

  sendToUser(userId: string, data: any) {
    const message = JSON.stringify({
      type: "direct",
      data,
      timestamp: new Date().toISOString(),
    })

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client.user?.userId === userId) {
        client.send(message)
      }
    })
  }

  sendToRole(role: string, data: any) {
    const message = JSON.stringify({
      type: "role_broadcast",
      data,
      timestamp: new Date().toISOString(),
    })

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client.user?.role === role) {
        client.send(message)
      }
    })
  }

  getConnectedUsers(): Array<{ userId: string; username: string; role: string }> {
    return Array.from(this.clients)
      .filter((client) => client.user)
      .map((client) => ({
        userId: client.user!.userId,
        username: client.user!.username,
        role: client.user!.role,
      }))
  }
}

export const wsService = new WebSocketService()
