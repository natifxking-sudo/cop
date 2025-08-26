import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth/jwt"
import { query } from "@/lib/database/connection"
import crypto from "crypto"
import { S3Client, PutObjectCommand, HeadBucketCommand, CreateBucketCommand } from "@aws-sdk/client-s3"

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

async function ensureBucketExists() {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET }))
  } catch {
    await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET }))
  }
}

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

    const extension = file.name.includes(".") ? `.${file.name.split(".").pop()}` : ""
    const objectKey = `cop-files/${fileId}${extension}`

    // Ensure bucket exists then upload to MinIO (S3-compatible)
    await ensureBucketExists()

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: objectKey,
        Body: buffer,
        ContentType: file.type,
      }),
    )

    const s3Url = `${process.env.MINIO_ENDPOINT}/${BUCKET}/${objectKey}`

    // Store metadata in database
    const fileMetadata = {
      id: fileId,
      filename: `${fileId}${extension}`,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      classification: metadata.classification || "UNCLASSIFIED",
      uploadedBy: user.userId,
      uploadedAt: new Date().toISOString(),
      reportId: metadata.reportId || null,
      eventId: metadata.eventId || null,
      tags: JSON.stringify(metadata.tags || []),
      checksum,
      s3Url,
    }

    await query(
      `INSERT INTO files (id, filename, original_name, mime_type, size, classification, 
       uploaded_by, uploaded_at, report_id, event_id, tags, checksum, s3_url)
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
        fileMetadata.s3Url,
      ],
    )

    return NextResponse.json(fileMetadata)
  } catch (error) {
    console.error("[v0] File upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
