import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth/jwt"
import { query } from "@/lib/database/connection"

export async function GET(request: NextRequest, { params }: { params: { fileId: string } }) {
  try {
    const token =
      request.nextUrl.searchParams.get("token") || request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const result = await query("SELECT * FROM files WHERE id = $1", [params.fileId])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const file = result.rows[0]

    if (!hasFileAccess(user.clearanceLevel, file.classification)) {
      return NextResponse.json({ error: "Insufficient clearance" }, { status: 403 })
    }

    const metadata = {
      id: file.id,
      filename: file.filename,
      originalName: file.original_name,
      mimeType: file.mime_type,
      size: Number(file.size),
      classification: file.classification,
      uploadedBy: file.uploaded_by,
      uploadedAt: file.uploaded_at,
      reportId: file.report_id,
      eventId: file.event_id,
      tags: Array.isArray(file.tags) ? file.tags : (() => { try { return JSON.parse(file.tags || '[]') } catch { return [] } })(),
      checksum: file.checksum,
    }

    return NextResponse.json(metadata)
  } catch (error) {
    console.error("[v0] File metadata error:", error)
    return NextResponse.json({ error: "Metadata retrieval failed" }, { status: 500 })
  }
}

function hasFileAccess(userClearance: string, fileClassification: string): boolean {
  const levels = ["UNCLASSIFIED", "CONFIDENTIAL", "SECRET", "TOP_SECRET"]
  return levels.indexOf(userClearance) >= levels.indexOf(fileClassification)
}