import { NextResponse } from "next/server"
import { withAuth, type AuthenticatedRequest } from "@/lib/auth/middleware"
import { query } from "@/lib/database/connection"
import { canAccessClassification } from "@/lib/auth/permissions"

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let whereClause = "WHERE 1=1"
    const params: any[] = []
    let paramCount = 0

    if (status) {
      whereClause += ` AND status = $${++paramCount}`
      params.push(status)
    }

    // Filter by user role - observers only see approved events
    if (req.user!.role === "OBSERVER") {
      whereClause += ` AND status = $${++paramCount}`
      params.push("APPROVED")
    }

    const result = await query(
      `SELECT 
        e.id, 
        e.type, 
        e.title, 
        e.description, 
        e.start_time, 
        e.end_time, 
        ST_AsGeoJSON(e.location) as location,
        ST_AsGeoJSON(e.area_of_interest) as area_of_interest,
        e.confidence_score, 
        e.sensitivity, 
        e.status, 
        e.created_by, 
        e.approved_by, 
        e.created_at, 
        e.updated_at,
        u.username as created_by_username
       FROM events e
       JOIN users u ON e.created_by = u.id
       ${whereClause}
       ORDER BY e.created_at DESC
       LIMIT $${++paramCount} OFFSET $${++paramCount}`,
      [...params, limit, offset],
    )

    const events = result.rows
      .filter((event) => canAccessClassification(req.user!.clearanceLevel, event.sensitivity))
      .map((event) => ({
        id: event.id,
        type: event.type,
        title: event.title,
        description: event.description,
        startTime: event.start_time,
        endTime: event.end_time,
        location: event.location ? JSON.parse(event.location) : null,
        areaOfInterest: event.area_of_interest ? JSON.parse(event.area_of_interest) : null,
        confidenceScore: Number.parseFloat(event.confidence_score),
        sensitivity: event.sensitivity,
        status: event.status,
        createdBy: event.created_by,
        approvedBy: event.approved_by,
        createdAt: event.created_at,
        updatedAt: event.updated_at,
        createdByUsername: event.created_by_username,
        classification: event.sensitivity, // For map compatibility
      }))

    return NextResponse.json(events)
  } catch (error) {
    console.error("[v0] Get events error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})
