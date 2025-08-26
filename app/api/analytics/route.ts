import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth/jwt"
import { db } from "@/lib/database/connection"
import { hasPermission } from "@/lib/auth/permissions"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user || !hasPermission(user.role, "view_analytics")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get("timeframe") || "7d" // 1d, 7d, 30d, 90d

    let timeCondition = ""
    switch (timeframe) {
      case "1d":
        timeCondition = "AND created_at >= NOW() - INTERVAL '1 day'"
        break
      case "7d":
        timeCondition = "AND created_at >= NOW() - INTERVAL '7 days'"
        break
      case "30d":
        timeCondition = "AND created_at >= NOW() - INTERVAL '30 days'"
        break
      case "90d":
        timeCondition = "AND created_at >= NOW() - INTERVAL '90 days'"
        break
    }

    // Get report statistics
    const reportStats = await db.query(`
      SELECT 
        COUNT(*) as total_reports,
        COUNT(CASE WHEN type = 'SOCMINT' THEN 1 END) as socmint_count,
        COUNT(CASE WHEN type = 'SIGINT' THEN 1 END) as sigint_count,
        COUNT(CASE WHEN type = 'HUMINT' THEN 1 END) as humint_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reports,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_reports,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_reports
      FROM reports 
      WHERE 1=1 ${timeCondition}
    `)

    // Get event statistics
    const eventStats = await db.query(`
      SELECT 
        COUNT(*) as total_events,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_events,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_events,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_events,
        AVG(confidence_score) as avg_confidence
      FROM events 
      WHERE 1=1 ${timeCondition}
    `)

    // Get user activity
    const userActivity = await db.query(`
      SELECT 
        COUNT(DISTINCT user_id) as active_users,
        COUNT(*) as total_actions
      FROM audit_log 
      WHERE 1=1 ${timeCondition}
    `)

    // Get fusion statistics
    const fusionStats = await db.query(`
      SELECT 
        COUNT(*) as total_fusions,
        AVG(confidence_score) as avg_fusion_confidence,
        COUNT(CASE WHEN confidence_score >= 0.8 THEN 1 END) as high_confidence_fusions
      FROM fusion_provenance 
      WHERE 1=1 ${timeCondition}
    `)

    // Get geographic distribution
    const geoStats = await db.query(`
      SELECT 
        ST_X(location) as longitude,
        ST_Y(location) as latitude,
        COUNT(*) as event_count
      FROM events 
      WHERE location IS NOT NULL ${timeCondition}
      GROUP BY ST_X(location), ST_Y(location)
      ORDER BY event_count DESC
      LIMIT 20
    `)

    // Get timeline data
    const timelineData = await db.query(`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(CASE WHEN 'reports' = 'reports' THEN 1 END) as reports,
        COUNT(CASE WHEN 'events' = 'events' THEN 1 END) as events
      FROM (
        SELECT created_at, 'reports' as type FROM reports WHERE 1=1 ${timeCondition}
        UNION ALL
        SELECT created_at, 'events' as type FROM events WHERE 1=1 ${timeCondition}
      ) combined
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date DESC
      LIMIT 30
    `)

    const analytics = {
      reports: reportStats.rows[0],
      events: eventStats.rows[0],
      users: userActivity.rows[0],
      fusion: fusionStats.rows[0],
      geographic: geoStats.rows,
      timeline: timelineData.rows,
      timeframe,
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
