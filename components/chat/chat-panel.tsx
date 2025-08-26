"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Send, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useWebSocket } from "@/lib/hooks/use-websocket"
import { useAuth } from "@/lib/auth/context"

interface ChatMessage {
  id: string
  userId: string
  message: string
  timestamp: string
  channel: string
}

export function ChatPanel() {
  const { user } = useAuth()
  const { messages, sendChatMessage, isConnected } = useWebSocket()
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState("")
  const [activeChannel, setActiveChannel] = useState("general")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const channels = [
    {
      id: "general",
      name: "General",
      access: ["HQ", "ANALYST_SOCMINT", "ANALYST_SIGINT", "ANALYST_HUMINT", "OBSERVER"],
    },
    { id: "hq", name: "HQ Only", access: ["HQ"] },
    { id: "analysts", name: "Analysts", access: ["HQ", "ANALYST_SOCMINT", "ANALYST_SIGINT", "ANALYST_HUMINT"] },
  ]

  useEffect(() => {
    // Process WebSocket messages for chat
    messages.forEach((msg) => {
      if (msg.type === "chat_message") {
        setChatMessages((prev) => {
          const exists = prev.find((m) => m.id === msg.data.id)
          if (exists) return prev
          return [...prev, msg.data]
        })
      }
    })
  }, [messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const handleSendMessage = () => {
    if (!currentMessage.trim() || !isConnected) return

    sendChatMessage(currentMessage, activeChannel)
    setCurrentMessage("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const filteredMessages = chatMessages.filter((msg) => msg.channel === activeChannel)
  const availableChannels = channels.filter((channel) => channel.access.includes(user?.role || ""))

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-700 rounded-lg">
      {/* Channel tabs */}
      <div className="flex items-center gap-2 p-3 border-b border-slate-700">
        <Users className="h-4 w-4 text-slate-400" />
        <div className="flex gap-1">
          {availableChannels.map((channel) => (
            <Button
              key={channel.id}
              variant={activeChannel === channel.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveChannel(channel.id)}
              className="text-xs"
            >
              {channel.name}
            </Button>
          ))}
        </div>
        <div className="ml-auto">
          <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredMessages.map((message) => (
          <div key={message.id} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-300">User {message.userId}</span>
              <span className="text-xs text-slate-500">{new Date(message.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="text-sm text-slate-100 bg-slate-800 rounded-lg p-2">{message.message}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-700">
        <div className="flex gap-2">
          <Input
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message #${activeChannel}...`}
            className="flex-1"
            disabled={!isConnected}
          />
          <Button onClick={handleSendMessage} disabled={!currentMessage.trim() || !isConnected} size="sm">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
