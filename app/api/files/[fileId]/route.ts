import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth/jwt"
import { query } from "@/lib/database/connection"
import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"

const s3Client = new S3Client({
  forcePathStyle: true,
  region: "us-east-1",
  endpoint: process.env.MINIO_ENDPOINT,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || "",
    secretAccessKey: process.env.MINIO_SECRET_KEY || "",
  },
})

const BUCKET = process.env.MINIO_BUCKET || "cop-files"

export async function GET(request: NextRequest, { params }: { params: { fileId: string } }) {
  try {
    // Verify authentication
    const token =
      request.nextUrl.searchParams.get("token") || request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get file metadata
    const result = await query("SELECT * FROM files WHERE id = $1", [params.fileId])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const file = result.rows[0]

    // Check access permissions based on classification
    if (!hasFileAccess(user.clearanceLevel, file.classification)) {
      return NextResponse.json({ error: "Insufficient clearance" }, { status: 403 })
    }

    // Use stored filename for object key
    const objectKey = `cop-files/${file.filename}`

    const s3Resp = await s3Client.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: objectKey }),
    )

    const stream = s3Resp.Body as ReadableStream

    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": file.mime_type,
        "Content-Disposition": `inline; filename="${file.original_name}"`,
        "Cache-Control": "private, max-age=3600",
      },
    })
  } catch (error) {
    console.error("[v0] File retrieval error:", error)
    return NextResponse.json({ error: "Retrieval failed" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { fileId: string } }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Check if user can delete (must be uploader or HQ)
    const result = await query("SELECT uploaded_by, filename FROM files WHERE id = $1", [params.fileId])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const file = result.rows[0]
    if (file.uploaded_by !== user.userId && user.role !== "HQ") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const objectKey = `cop-files/${file.filename}`

    // Delete from storage first (best-effort)
    try {
      await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: objectKey }))
    } catch {}

    // Delete from database
    await query("DELETE FROM files WHERE id = $1", [params.fileId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] File deletion error:", error)
    return NextResponse.json({ error: "Deletion failed" }, { status: 500 })
  }
}

function hasFileAccess(userClearance: string, fileClassification: string): boolean {
  const levels = ["UNCLASSIFIED", "CONFIDENTIAL", "SECRET", "TOP_SECRET"]
  return levels.indexOf(userClearance) >= levels.indexOf(fileClassification)
}
