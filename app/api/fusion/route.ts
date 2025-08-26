import { NextResponse } from "next/server"
import { withPermission, type AuthenticatedRequest } from "@/lib/auth/middleware"
import { FusionService } from "@/lib/services/fusion-service"
import { wsService } from "@/lib/services/websocket-service"
import { z } from "zod"

const fusionService = new FusionService()

const fuseReportsSchema = z.object({
  reportIds: z.array(z.string().uuid()).min(2),
})

export const POST = withPermission("FUSION_ANALYSIS")(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json()
    const { reportIds } = fuseReportsSchema.parse(body)

    const fusedEvent = await fusionService.fuseReports(reportIds, req.user!.userId)

    // Broadcast new fused event
    wsService.broadcast("events", {
      type: "NEW_FUSED_EVENT",
      event: fusedEvent,
    })

    return NextResponse.json(fusedEvent, { status: 201 })
  } catch (error) {
    console.error("[v0] Fusion error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Fusion failed" }, { status: 500 })
  }
})

export const GET = withPermission("FUSION_ANALYSIS")(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const lat = Number.parseFloat(searchParams.get("lat") || "0")
    const lng = Number.parseFloat(searchParams.get("lng") || "0")
    const radius = Number.parseFloat(searchParams.get("radius") || "5")
    const startTime = searchParams.get("startTime")
    const endTime = searchParams.get("endTime")

    if (!startTime || !endTime) {
      return NextResponse.json({ error: "startTime and endTime are required" }, { status: 400 })
    }

    const correlatedReports = await fusionService.getCorrelatedReports(
      { lat, lng },
      { start: new Date(startTime), end: new Date(endTime) },
      radius,
    )

    return NextResponse.json(correlatedReports)
  } catch (error) {
    console.error("[v0] Get correlated reports error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})
