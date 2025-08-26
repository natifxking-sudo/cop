import { query } from "@/lib/database/connection"
import type { Report } from "@/lib/types/database"
import { v4 as uuidv4 } from "uuid"

export class IntelService {
  async createReport(reportData: Omit<Report, "id" | "submittedAt">): Promise<Report> {
    const id = uuidv4()
    const submittedAt = new Date()

    const result = await query(
      `INSERT INTO reports (id, type, title, content, location, collection_time, submitted_by, classification, reliability, credibility, status)
       VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326), $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        id,
        reportData.type,
        reportData.title,
        JSON.stringify(reportData.content),
        reportData.location?.coordinates[0] || null,
        reportData.location?.coordinates[1] || null,
        reportData.collectionTime,
        reportData.submittedBy,
        reportData.classification,
        reportData.reliability,
        reportData.credibility,
        reportData.status,
      ],
    )

    // Log the report creation
    await query(
      "INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES ($1, $2, $3, $4, $5)",
      [reportData.submittedBy, "CREATE_REPORT", "REPORT", id, { type: reportData.type, title: reportData.title }],
    )

    return this.mapReportFromDb(result.rows[0])
  }

  async getReports(
    filters: {
      type?: Report["type"]
      submittedBy?: string
      status?: Report["status"]
      limit?: number
      offset?: number
    } = {},
  ): Promise<Report[]> {
    let whereClause = "WHERE 1=1"
    const params: any[] = []
    let paramCount = 0

    if (filters.type) {
      whereClause += ` AND type = $${++paramCount}`
      params.push(filters.type)
    }

    if (filters.submittedBy) {
      whereClause += ` AND submitted_by = $${++paramCount}`
      params.push(filters.submittedBy)
    }

    if (filters.status) {
      whereClause += ` AND status = $${++paramCount}`
      params.push(filters.status)
    }

    const limit = filters.limit || 50
    const offset = filters.offset || 0

    const result = await query(
      `SELECT r.*, u.username as submitted_by_username 
       FROM reports r 
       JOIN users u ON r.submitted_by = u.id 
       ${whereClause} 
       ORDER BY r.submitted_at DESC 
       LIMIT $${++paramCount} OFFSET $${++paramCount}`,
      [...params, limit, offset],
    )

    return result.rows.map(this.mapReportFromDb)
  }

  async getReportById(id: string): Promise<Report | null> {
    const result = await query(
      `SELECT r.*, u.username as submitted_by_username 
       FROM reports r 
       JOIN users u ON r.submitted_by = u.id 
       WHERE r.id = $1`,
      [id],
    )

    return result.rows.length > 0 ? this.mapReportFromDb(result.rows[0]) : null
  }

  async updateReportStatus(id: string, status: Report["status"], updatedBy: string): Promise<void> {
    await query("UPDATE reports SET status = $1 WHERE id = $2", [status, id])

    await query(
      "INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES ($1, $2, $3, $4, $5)",
      [updatedBy, "UPDATE_REPORT_STATUS", "REPORT", id, { newStatus: status }],
    )
  }

  private mapReportFromDb(row: any): Report {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      content: row.content,
      location: row.location
        ? {
            type: "Point",
            coordinates: [row.location.coordinates[0], row.location.coordinates[1]],
          }
        : undefined,
      collectionTime: row.collection_time,
      submittedBy: row.submitted_by,
      submittedAt: row.submitted_at,
      classification: row.classification,
      reliability: row.reliability,
      credibility: row.credibility,
      status: row.status,
    }
  }
}
