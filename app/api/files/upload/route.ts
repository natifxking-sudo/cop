import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { verifyToken } from "@/lib/auth/jwt"
import { query } from "@/lib/database/connection"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const metadataStr = formData.get("metadata") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const metadata = JSON.parse(metadataStr || "{}")

    // Generate file ID and checksum
    const fileId = crypto.randomUUID()
    const buffer = Buffer.from(await file.arrayBuffer())
    const checksum = crypto.createHash("sha256").update(buffer).digest("hex")

    // Upload to Vercel Blob
    const blob = await put(`cop-files/${fileId}`, buffer, {
      access: "private",
      contentType: file.type,
    })

    // Store metadata in database
    const fileMetadata = {
      id: fileId,
      filename: `${fileId}.${file.name.split(".").pop()}`,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      classification: metadata.classification || "UNCLASSIFIED",
      uploadedBy: user.id,
      uploadedAt: new Date().toISOString(),
      reportId: metadata.reportId || null,
      eventId: metadata.eventId || null,
      tags: JSON.stringify(metadata.tags || []),
      checksum,
      blobUrl: blob.url,
    }

    await query(
      `INSERT INTO files (id, filename, original_name, mime_type, size, classification, 
       uploaded_by, uploaded_at, report_id, event_id, tags, checksum, blob_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        fileMetadata.id,
        fileMetadata.filename,
        fileMetadata.originalName,
        fileMetadata.mimeType,
        fileMetadata.size,
        fileMetadata.classification,
        fileMetadata.uploadedBy,
        fileMetadata.uploadedAt,
        fileMetadata.reportId,
        fileMetadata.eventId,
        fileMetadata.tags,
        fileMetadata.checksum,
        fileMetadata.blobUrl,
      ],
    )

    return NextResponse.json(fileMetadata)
  } catch (error) {
    console.error("[v0] File upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
