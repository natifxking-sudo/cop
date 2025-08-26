import { NextResponse } from "next/server"
import { withAuth, type AuthenticatedRequest } from "@/lib/auth/middleware"
import { IntelService } from "@/lib/services/intel-service"
import { wsService } from "@/lib/services/websocket-service"
import { z } from "zod"

const intelService = new IntelService()

const createReportSchema = z.object({
  type: z.enum(["SOCMINT", "SIGINT", "HUMINT"]),
  title: z.string().min(1).max(255),
  content: z.record(z.any()),
  location: z
    .object({
      coordinates: z.tuple([z.number(), z.number()]),
    })
    .optional(),
  collectionTime: z.string().datetime().optional(),
  classification: z.string().default("UNCLASSIFIED"),
  reliability: z.enum(["A", "B", "C", "D", "E", "F"]).optional(),
  credibility: z.enum(["1", "2", "3", "4", "5", "6"]).optional(),
})

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json()
    const validatedData = createReportSchema.parse(body)

    const report = await intelService.createReport({
      ...validatedData,
      location: validatedData.location
        ? {
            type: "Point",
            coordinates: validatedData.location.coordinates,
          }
        : undefined,
      collectionTime: validatedData.collectionTime ? new Date(validatedData.collectionTime) : undefined,
      submittedBy: req.user!.userId,
      status: "SUBMITTED",
    })

    // Broadcast new report to relevant users
    wsService.broadcast("reports", {
      type: "NEW_REPORT",
      report,
    })

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error("[v0] Create report error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") as "SOCMINT" | "SIGINT" | "HUMINT" | null
    const status = searchParams.get("status") as "SUBMITTED" | "PROCESSING" | "FUSED" | "ARCHIVED" | null
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const reports = await intelService.getReports({
      type: type || undefined,
      status: status || undefined,
      limit,
      offset,
    })

    return NextResponse.json(reports)
  } catch (error) {
    console.error("[v0] Get reports error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})
