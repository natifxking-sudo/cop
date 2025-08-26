import jwt from "jsonwebtoken"
import type { User } from "../types/database"

const JWT_SECRET = process.env.JWT_SECRET || "cop-platform-secret-key"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h"

export interface JWTPayload {
  userId: string
  username: string
  role: User["role"]
  clearanceLevel: string
  iat?: number
  exp?: number
}

export function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    clearanceLevel: user.clearanceLevel,
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    console.error("[v0] JWT verification failed:", error)
    return null
  }
}

export function refreshToken(token: string): string | null {
  const payload = verifyToken(token)
  if (!payload) return null

  // Generate new token with same payload but fresh expiration
  const newPayload: JWTPayload = {
    userId: payload.userId,
    username: payload.username,
    role: payload.role,
    clearanceLevel: payload.clearanceLevel,
  }

  return jwt.sign(newPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}
