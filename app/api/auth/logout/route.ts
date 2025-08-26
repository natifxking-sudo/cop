import { NextResponse } from "next/server"
import { withAuth, type AuthenticatedRequest } from "@/lib/auth/middleware"
import { query } from "@/lib/database/connection"

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    // Log logout action
    await query("INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)", [
      req.user!.userId,
      "LOGOUT",
      { username: req.user!.username },
      req.ip || "unknown",
    ])

    return NextResponse.json({ message: "Logged out successfully" })
  } catch (error) {
    console.error("[v0] Logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})
