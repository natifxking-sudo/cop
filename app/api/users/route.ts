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
    if (!user || !hasPermission(user.role, "manage_users")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const role = searchParams.get("role")
    const status = searchParams.get("status")

    let query = "SELECT id, username, email, role, clearance_level, status, created_at, last_login FROM users WHERE 1=1"
    const params: any[] = []
    let paramIndex = 1

    if (role) {
      query += ` AND role = $${paramIndex}`
      params.push(role)
      paramIndex++
    }

    if (status) {
      query += ` AND status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, (page - 1) * limit)

    const result = await db.query(query, params)

    // Get total count
    let countQuery = "SELECT COUNT(*) FROM users WHERE 1=1"
    const countParams: any[] = []
    let countParamIndex = 1

    if (role) {
      countQuery += ` AND role = $${countParamIndex}`
      countParams.push(role)
      countParamIndex++
    }

    if (status) {
      countQuery += ` AND status = $${countParamIndex}`
      countParams.push(status)
    }

    const countResult = await db.query(countQuery, countParams)
    const total = Number.parseInt(countResult.rows[0].count)

    return NextResponse.json({
      users: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching users:", error)
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
    if (!user || !hasPermission(user.role, "manage_users")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { username, email, password, role, clearance_level } = await request.json()

    // Validate required fields
    if (!username || !email || !password || !role || !clearance_level) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await db.query("SELECT id FROM users WHERE username = $1 OR email = $2", [username, email])

    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    // Hash password (in production, use proper password hashing)
    const hashedPassword = Buffer.from(password).toString("base64")

    // Create user
    const result = await db.query(
      `INSERT INTO users (username, email, password_hash, role, clearance_level, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'active', NOW())
       RETURNING id, username, email, role, clearance_level, status, created_at`,
      [username, email, hashedPassword, role, clearance_level],
    )

    // Log audit event
    await db.query(
      `INSERT INTO audit_log (user_id, action, resource_type, resource_id, details, timestamp)
       VALUES ($1, 'CREATE', 'user', $2, $3, NOW())`,
      [user.id, result.rows[0].id, JSON.stringify({ created_user: username, role, clearance_level })],
    )

    return NextResponse.json({ user: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
