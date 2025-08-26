import { NextResponse } from "next/server"
import { withPermission, type AuthenticatedRequest, withAuth } from "@/lib/auth/middleware"
import { DecisionService } from "@/lib/services/decision-service"
import { wsService } from "@/lib/services/websocket-service"
import { z } from "zod"

const decisionService = new DecisionService()

const approveEventSchema = z.object({
  eventId: z.string().uuid(),
  notes: z.string().optional(),
})

const rejectEventSchema = z.object({
  eventId: z.string().uuid(),
  reason: z.string().min(1),
})

const requestInfoSchema = z.object({
  eventId: z.string().uuid(),
  question: z.string().min(1),
})

export const POST = withPermission("MAKE_DECISIONS")(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json()
    const { action } = body

    let decision

    switch (action) {
      case "approve":
        const approveData = approveEventSchema.parse(body)
        decision = await decisionService.approveEvent(approveData.eventId, req.user!.userId, approveData.notes)
        wsService.broadcast("decisions", {
          type: "EVENT_APPROVED",
          decision,
          eventId: approveData.eventId,
        })
        break

      case "reject":
        const rejectData = rejectEventSchema.parse(body)
        decision = await decisionService.rejectEvent(rejectData.eventId, req.user!.userId, rejectData.reason)
        wsService.broadcast("decisions", {
          type: "EVENT_REJECTED",
          decision,
          eventId: rejectData.eventId,
        })
        break

      case "request_info":
        const requestData = requestInfoSchema.parse(body)
        await decisionService.requestMoreInfo(requestData.eventId, req.user!.userId, requestData.question)
        wsService.broadcast("qa", {
          type: "INFO_REQUESTED",
          eventId: requestData.eventId,
          question: requestData.question,
        })
        return NextResponse.json({ message: "Information request sent" })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json(decision, { status: 201 })
  } catch (error) {
    console.error("[v0] Decision error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const decisionType = searchParams.get("type") as any
    const relatedEventId = searchParams.get("eventId")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const decisions = await decisionService.getDecisions({
      decisionType,
      relatedEventId: relatedEventId || undefined,
      limit,
      offset,
    })

    return NextResponse.json(decisions)
  } catch (error) {
    console.error("[v0] Get decisions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})
