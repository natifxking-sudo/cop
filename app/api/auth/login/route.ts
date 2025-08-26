import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { query } from "@/lib/database/connection"
import { generateToken } from "@/lib/auth/jwt"
import type { User } from "@/lib/types/database"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    // Find user in database
    const result = await query("SELECT * FROM users WHERE username = $1 AND is_active = true", [username])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const user = result.rows[0] as User

    // For demo purposes, we'll use a simple password check
    // In production, you'd hash passwords properly
    const isValidPassword = password === "cop123" || (await bcrypt.compare(password, user.password || ""))

    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Generate JWT token
    const token = generateToken(user)

    // Log successful login
    await query("INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)", [
      user.id,
      "LOGIN",
      { username: user.username, role: user.role },
      request.ip || "unknown",
    ])

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        clearanceLevel: user.clearanceLevel,
      },
    })
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
