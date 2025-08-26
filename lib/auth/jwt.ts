import jwt from "jsonwebtoken"
import type { User } from "../types/database"
import { createRemoteJWKSet, jwtVerify } from "jose"

const JWT_SECRET = process.env.JWT_SECRET || "cop-platform-secret-key"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h"
const KEYCLOAK_ISSUER = process.env.NEXT_PUBLIC_KEYCLOAK_URL && process.env.NEXT_PUBLIC_KEYCLOAK_REALM
  ? `${process.env.NEXT_PUBLIC_KEYCLOAK_URL}/realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM}`
  : process.env.KEYCLOAK_ISSUER_URI

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

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    if (KEYCLOAK_ISSUER) {
      const jwks = createRemoteJWKSet(new URL(`${KEYCLOAK_ISSUER}/protocol/openid-connect/certs`))
      const { payload } = await jwtVerify(token, jwks, { issuer: KEYCLOAK_ISSUER, algorithms: ["RS256"] })
      const roles: string[] = (payload as any)?.realm_access?.roles || []
      return {
        userId: (payload as any).sub || "",
        username: (payload as any).preferred_username || "",
        role: (roles.includes("HQ") ? "HQ" : "OBSERVER") as any,
        clearanceLevel: "UNCLASSIFIED",
        iat: payload.iat,
        exp: payload.exp,
      }
    }
  } catch (e) {
    // Fallback to legacy secret verification
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    console.error("[v0] JWT verification failed:", error)
    return null
  }
}

export function refreshTokenLegacy(token: string): string | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload
    const newPayload: JWTPayload = {
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
      clearanceLevel: payload.clearanceLevel,
    }
    return jwt.sign(newPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
  } catch {
    return null
  }
}
