import { NextResponse } from "next/server"
import { withAuth, type AuthenticatedRequest } from "@/lib/auth/middleware"
import { query } from "@/lib/database/connection"

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const result = await query(
      "SELECT id, username, email, role, clearance_level, created_at FROM users WHERE id = $1 AND is_active = true",
      [req.user!.userId],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = result.rows[0]
    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      clearanceLevel: user.clearance_level,
      createdAt: user.created_at,
    })
  } catch (error) {
    console.error("[v0] Get user profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})
