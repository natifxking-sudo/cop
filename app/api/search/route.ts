import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth/jwt"
import { db } from "@/lib/database/connection"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const type = searchParams.get("type") // 'reports', 'events', 'all'
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    if (!query) {
      return NextResponse.json({ error: "Search query required" }, { status: 400 })
    }

    const results: any = {
      reports: [],
      events: [],
      total: 0,
    }

    // Search reports
    if (type === "reports" || type === "all" || !type) {
      let reportsQuery = `
        SELECT r.*, u.username as author_name
        FROM reports r
        JOIN users u ON r.author_id = u.id
        WHERE (r.title ILIKE $1 OR r.content ILIKE $1 OR r.source ILIKE $1)
      `

      const params = [`%${query}%`]
      let paramIndex = 2

      // Apply clearance level filtering
      if (user.clearance_level !== "TOP_SECRET") {
        reportsQuery += ` AND r.classification <= $${paramIndex}`
        params.push(user.clearance_level)
        paramIndex++
      }

      // Apply role-based filtering
      if (user.role === "OBSERVER") {
        reportsQuery += ` AND r.status = 'approved'`
      }

      reportsQuery += ` ORDER BY r.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, (page - 1) * limit)

      const reportsResult = await db.query(reportsQuery, params)
      results.reports = reportsResult.rows
    }

    // Search events
    if (type === "events" || type === "all" || !type) {
      let eventsQuery = `
        SELECT e.*, u.username as created_by_name
        FROM events e
        JOIN users u ON e.created_by = u.id
        WHERE (e.title ILIKE $1 OR e.description ILIKE $1)
      `

      const params = [`%${query}%`]
      let paramIndex = 2

      // Apply clearance level filtering
      if (user.clearance_level !== "TOP_SECRET") {
        eventsQuery += ` AND e.classification <= $${paramIndex}`
        params.push(user.clearance_level)
        paramIndex++
      }

      // Apply role-based filtering
      if (user.role === "OBSERVER") {
        eventsQuery += ` AND e.status = 'approved'`
      }

      eventsQuery += ` ORDER BY e.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, (page - 1) * limit)

      const eventsResult = await db.query(eventsQuery, params)
      results.events = eventsResult.rows
    }

    results.total = results.reports.length + results.events.length

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error performing search:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
