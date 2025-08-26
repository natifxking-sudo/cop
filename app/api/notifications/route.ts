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
    const unreadOnly = searchParams.get("unread") === "true"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    let query = `
      SELECT n.*, u.username as sender_name
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.id
      WHERE n.recipient_id = $1
    `

    const params = [user.id]
    const paramIndex = 2

    if (unreadOnly) {
      query += ` AND n.read_at IS NULL`
    }

    query += ` ORDER BY n.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, (page - 1) * limit)

    const result = await db.query(query, params)

    // Get unread count
    const unreadResult = await db.query(
      "SELECT COUNT(*) FROM notifications WHERE recipient_id = $1 AND read_at IS NULL",
      [user.id],
    )

    return NextResponse.json({
      notifications: result.rows,
      unread_count: Number.parseInt(unreadResult.rows[0].count),
      pagination: {
        page,
        limit,
        total: result.rows.length,
      },
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { recipient_id, type, title, message, priority, metadata } = await request.json()

    if (!recipient_id || !type || !title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await db.query(
      `INSERT INTO notifications (recipient_id, sender_id, type, title, message, priority, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [recipient_id, user.id, type, title, message, priority || "normal", JSON.stringify(metadata || {})],
    )

    return NextResponse.json({ notification: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { notification_ids, action } = await request.json()

    if (!notification_ids || !Array.isArray(notification_ids) || !action) {
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 })
    }

    if (action === "mark_read") {
      await db.query(
        `UPDATE notifications 
         SET read_at = NOW() 
         WHERE id = ANY($1) AND recipient_id = $2 AND read_at IS NULL`,
        [notification_ids, user.id],
      )
    } else if (action === "mark_unread") {
      await db.query(
        `UPDATE notifications 
         SET read_at = NULL 
         WHERE id = ANY($1) AND recipient_id = $2`,
        [notification_ids, user.id],
      )
    } else if (action === "delete") {
      await db.query(
        `DELETE FROM notifications 
         WHERE id = ANY($1) AND recipient_id = $2`,
        [notification_ids, user.id],
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
