import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth/jwt"
import { db } from "@/lib/database/connection"
import { hasPermission } from "@/lib/auth/permissions"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user || !hasPermission(user.role, "export_data")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { type, format, filters } = await request.json()

    if (!type || !format) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let data: any[] = []
    let filename = ""

    // Export reports
    if (type === "reports") {
      let query = `
        SELECT r.*, u.username as author_name
        FROM reports r
        JOIN users u ON r.author_id = u.id
        WHERE 1=1
      `
      const params: any[] = []
      let paramIndex = 1

      // Apply filters
      if (filters?.start_date) {
        query += ` AND r.created_at >= $${paramIndex}`
        params.push(filters.start_date)
        paramIndex++
      }

      if (filters?.end_date) {
        query += ` AND r.created_at <= $${paramIndex}`
        params.push(filters.end_date)
        paramIndex++
      }

      if (filters?.type) {
        query += ` AND r.type = $${paramIndex}`
        params.push(filters.type)
        paramIndex++
      }

      if (filters?.status) {
        query += ` AND r.status = $${paramIndex}`
        params.push(filters.status)
        paramIndex++
      }

      // Apply clearance level filtering
      if (user.clearance_level !== "TOP_SECRET") {
        query += ` AND r.classification <= $${paramIndex}`
        params.push(user.clearance_level)
        paramIndex++
      }

      query += " ORDER BY r.created_at DESC"

      const result = await db.query(query, params)
      data = result.rows
      filename = `reports_export_${new Date().toISOString().split("T")[0]}`
    }

    // Export events
    else if (type === "events") {
      let query = `
        SELECT e.*, u.username as created_by_name
        FROM events e
        JOIN users u ON e.created_by = u.id
        WHERE 1=1
      `
      const params: any[] = []
      let paramIndex = 1

      // Apply filters
      if (filters?.start_date) {
        query += ` AND e.created_at >= $${paramIndex}`
        params.push(filters.start_date)
        paramIndex++
      }

      if (filters?.end_date) {
        query += ` AND e.created_at <= $${paramIndex}`
        params.push(filters.end_date)
        paramIndex++
      }

      if (filters?.status) {
        query += ` AND e.status = $${paramIndex}`
        params.push(filters.status)
        paramIndex++
      }

      // Apply clearance level filtering
      if (user.clearance_level !== "TOP_SECRET") {
        query += ` AND e.classification <= $${paramIndex}`
        params.push(user.clearance_level)
        paramIndex++
      }

      query += " ORDER BY e.created_at DESC"

      const result = await db.query(query, params)
      data = result.rows
      filename = `events_export_${new Date().toISOString().split("T")[0]}`
    }

    // Format data based on requested format
    if (format === "json") {
      const jsonData = JSON.stringify(data, null, 2)

      return new NextResponse(jsonData, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}.json"`,
        },
      })
    } else if (format === "csv") {
      if (data.length === 0) {
        return NextResponse.json({ error: "No data to export" }, { status: 400 })
      }

      // Generate CSV headers
      const headers = Object.keys(data[0]).join(",")

      // Generate CSV rows
      const rows = data.map((row) =>
        Object.values(row)
          .map((value) => (typeof value === "string" && value.includes(",") ? `"${value.replace(/"/g, '""')}"` : value))
          .join(","),
      )

      const csvData = [headers, ...rows].join("\n")

      return new NextResponse(csvData, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      })
    }

    return NextResponse.json({ error: "Unsupported format" }, { status: 400 })
  } catch (error) {
    console.error("Error exporting data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
