import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, type JWTPayload } from "./jwt"
import { hasPermission, type Permission } from "./permissions"

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload
}

export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: AuthenticatedRequest): Promise<NextResponse> => {
    const authHeader = req.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    req.user = payload
    return handler(req)
  }
}

export function withPermission(permission: Permission) {
  return (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) =>
    withAuth(async (req: AuthenticatedRequest): Promise<NextResponse> => {
      if (!req.user || !hasPermission(req.user.role, permission)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      return handler(req)
    })
}

export function withRole(allowedRoles: string[]) {
  return (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) =>
    withAuth(async (req: AuthenticatedRequest): Promise<NextResponse> => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      return handler(req)
    })
}
