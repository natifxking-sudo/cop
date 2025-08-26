import type { NextRequest } from "next/server"
import { WebSocketServer } from "ws"

// WebSocket server for real-time communication
let wss: WebSocketServer | null = null

export async function GET(request: NextRequest) {
  if (!wss) {
    wss = new WebSocketServer({ port: 8080 })

    wss.on("connection", (ws, req) => {
      console.log("[v0] New WebSocket connection established")

      // Handle authentication
      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString())

          if (message.type === "auth") {
            // Store user info on connection
            ;(ws as any).userId = message.userId
            ;(ws as any).role = message.role
            ;(ws as any).clearanceLevel = message.clearanceLevel

            ws.send(
              JSON.stringify({
                type: "auth_success",
                message: "Authentication successful",
              }),
            )
          } else if (message.type === "chat_message") {
            // Broadcast chat message to appropriate users
            broadcastMessage(
              {
                type: "chat_message",
                data: {
                  id: Date.now().toString(),
                  userId: (ws as any).userId,
                  message: message.message,
                  timestamp: new Date().toISOString(),
                  channel: message.channel || "general",
                },
              },
              message.channel,
            )
          }
        } catch (error) {
          console.error("[v0] WebSocket message error:", error)
        }
      })

      ws.on("close", () => {
        console.log("[v0] WebSocket connection closed")
      })
    })
  }

  return new Response("WebSocket server running on port 8080", { status: 200 })
}

function broadcastMessage(message: any, channel?: string) {
  if (!wss) return

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      // WebSocket.OPEN
      const userRole = (client as any).role
      const clearanceLevel = (client as any).clearanceLevel

      // Role-based message filtering
      if (shouldReceiveMessage(message, userRole, clearanceLevel, channel)) {
        client.send(JSON.stringify(message))
      }
    }
  })
}

function shouldReceiveMessage(message: any, userRole: string, clearanceLevel: string, channel?: string): boolean {
  // Implement role-based filtering logic
  if (channel === "hq" && userRole !== "HQ") return false
  if (message.data?.classification && !hasAccess(clearanceLevel, message.data.classification)) return false
  return true
}

function hasAccess(userClearance: string, requiredClearance: string): boolean {
  const levels = ["UNCLASSIFIED", "CONFIDENTIAL", "SECRET", "TOP_SECRET"]
  return levels.indexOf(userClearance) >= levels.indexOf(requiredClearance)
}

// Export broadcast function for use in other API routes
export { broadcastMessage }
