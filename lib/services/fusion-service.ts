import { query } from "@/lib/database/connection"
import type { Report, Event } from "@/lib/types/database"
import { v4 as uuidv4 } from "uuid"

export class FusionService {
  async fuseReports(reportIds: string[], fusedBy: string): Promise<Event> {
    // Get all reports to fuse
    const reports = await this.getReportsByIds(reportIds)

    if (reports.length === 0) {
      throw new Error("No reports found for fusion")
    }

    // Calculate fusion metrics
    const fusionResult = this.calculateFusionMetrics(reports)

    // Create fused event
    const eventId = uuidv4()
    const event = await this.createFusedEvent(eventId, fusionResult, fusedBy)

    // Create provenance records
    await this.createProvenanceRecords(eventId, reports)

    // Update report statuses
    await this.updateReportsStatus(reportIds, "FUSED")

    return event
  }

  async getCorrelatedReports(
    location: { lat: number; lng: number },
    timeWindow: { start: Date; end: Date },
    radiusKm = 5,
  ): Promise<Report[]> {
    const result = await query(
      `SELECT r.*, u.username as submitted_by_username
       FROM reports r
       JOIN users u ON r.submitted_by = u.id
       WHERE r.location IS NOT NULL
       AND ST_DWithin(
         r.location::geography,
         ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
         $3
       )
       AND r.collection_time BETWEEN $4 AND $5
       AND r.status = 'SUBMITTED'
       ORDER BY r.collection_time DESC`,
      [location.lng, location.lat, radiusKm * 1000, timeWindow.start, timeWindow.end],
    )

    return result.rows.map(this.mapReportFromDb)
  }

  async calculateConfidenceScore(reports: Report[]): Promise<number> {
    if (reports.length === 0) return 0

    let totalWeight = 0
    let weightedScore = 0

    for (const report of reports) {
      // Calculate reliability weight (A=1.0, B=0.8, C=0.6, D=0.4, E=0.2, F=0.1)
      const reliabilityWeight = this.getReliabilityWeight(report.reliability)

      // Calculate credibility weight (1=1.0, 2=0.8, 3=0.6, 4=0.4, 5=0.2, 6=0.1)
      const credibilityWeight = this.getCredibilityWeight(report.credibility)

      // Calculate recency weight (newer reports get higher weight)
      const recencyWeight = this.getRecencyWeight(report.collectionTime)

      // Calculate source diversity bonus
      const diversityBonus = this.getSourceDiversityBonus(reports, report.type)

      const reportWeight = reliabilityWeight * credibilityWeight * recencyWeight * diversityBonus
      const reportScore = 0.7 // Base score for submitted reports

      weightedScore += reportScore * reportWeight
      totalWeight += reportWeight
    }

    return Math.min(totalWeight > 0 ? weightedScore / totalWeight : 0, 1.0)
  }

  private async getReportsByIds(ids: string[]): Promise<Report[]> {
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(",")
    const result = await query(
      `SELECT r.*, u.username as submitted_by_username
       FROM reports r
       JOIN users u ON r.submitted_by = u.id
       WHERE r.id IN (${placeholders})`,
      ids,
    )

    return result.rows.map(this.mapReportFromDb)
  }

  private calculateFusionMetrics(reports: Report[]) {
    // Calculate average location
    const locations = reports.filter((r) => r.location).map((r) => r.location!)
    const avgLocation = locations.length > 0 ? this.calculateCentroid(locations) : null

    // Calculate time range
    const times = reports.filter((r) => r.collectionTime).map((r) => r.collectionTime!)
    const startTime = times.length > 0 ? new Date(Math.min(...times.map((t) => t.getTime()))) : null
    const endTime = times.length > 0 ? new Date(Math.max(...times.map((t) => t.getTime()))) : null

    // Generate title and description
    const reportTypes = [...new Set(reports.map((r) => r.type))]
    const title = `Fused Intelligence: ${reportTypes.join(" + ")} Correlation`
    const description = `Fused from ${reports.length} reports: ${reports.map((r) => r.title).join(", ")}`

    // Calculate confidence
    const confidenceScore = this.calculateConfidenceScoreSync(reports)

    return {
      title,
      description,
      location: avgLocation,
      startTime,
      endTime,
      confidenceScore,
      reportTypes,
    }
  }

  private async createFusedEvent(eventId: string, fusionResult: any, fusedBy: string): Promise<Event> {
    const result = await query(
      `INSERT INTO events (id, type, title, description, start_time, end_time, location, confidence_score, sensitivity, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($7, $8), 4326), $9, $10, $11, $12)
       RETURNING *`,
      [
        eventId,
        "FUSED_INTELLIGENCE",
        fusionResult.title,
        fusionResult.description,
        fusionResult.startTime,
        fusionResult.endTime,
        fusionResult.location?.coordinates[0] || null,
        fusionResult.location?.coordinates[1] || null,
        fusionResult.confidenceScore,
        "SECRET",
        "PENDING",
        fusedBy,
      ],
    )

    return this.mapEventFromDb(result.rows[0])
  }

  private async createProvenanceRecords(eventId: string, reports: Report[]): Promise<void> {
    for (const report of reports) {
      await query(
        "INSERT INTO fusion_provenance (event_id, source_report_id, fusion_algorithm, weight) VALUES ($1, $2, $3, $4)",
        [eventId, report.id, "WEIGHTED_CORRELATION", 1.0],
      )
    }
  }

  private async updateReportsStatus(reportIds: string[], status: Report["status"]): Promise<void> {
    const placeholders = reportIds.map((_, i) => `$${i + 1}`).join(",")
    await query(`UPDATE reports SET status = $${reportIds.length + 1} WHERE id IN (${placeholders})`, [
      ...reportIds,
      status,
    ])
  }

  private calculateCentroid(locations: Array<{ coordinates: [number, number] }>) {
    const avgLng = locations.reduce((sum, loc) => sum + loc.coordinates[0], 0) / locations.length
    const avgLat = locations.reduce((sum, loc) => sum + loc.coordinates[1], 0) / locations.length
    return { type: "Point" as const, coordinates: [avgLng, avgLat] as [number, number] }
  }

  private calculateConfidenceScoreSync(reports: Report[]): number {
    if (reports.length === 0) return 0

    let totalWeight = 0
    let weightedScore = 0

    for (const report of reports) {
      const reliabilityWeight = this.getReliabilityWeight(report.reliability)
      const credibilityWeight = this.getCredibilityWeight(report.credibility)
      const recencyWeight = this.getRecencyWeight(report.collectionTime)
      const diversityBonus = this.getSourceDiversityBonus(reports, report.type)

      const reportWeight = reliabilityWeight * credibilityWeight * recencyWeight * diversityBonus
      const reportScore = 0.7

      weightedScore += reportScore * reportWeight
      totalWeight += reportWeight
    }

    return Math.min(totalWeight > 0 ? weightedScore / totalWeight : 0, 1.0)
  }

  private getReliabilityWeight(reliability?: string): number {
    const weights = { A: 1.0, B: 0.8, C: 0.6, D: 0.4, E: 0.2, F: 0.1 }
    return weights[reliability as keyof typeof weights] || 0.5
  }

  private getCredibilityWeight(credibility?: string): number {
    const weights = { "1": 1.0, "2": 0.8, "3": 0.6, "4": 0.4, "5": 0.2, "6": 0.1 }
    return weights[credibility as keyof typeof weights] || 0.5
  }

  private getRecencyWeight(collectionTime?: Date): number {
    if (!collectionTime) return 0.5

    const hoursAgo = (Date.now() - collectionTime.getTime()) / (1000 * 60 * 60)
    if (hoursAgo <= 1) return 1.0
    if (hoursAgo <= 6) return 0.9
    if (hoursAgo <= 24) return 0.7
    if (hoursAgo <= 72) return 0.5
    return 0.3
  }

  private getSourceDiversityBonus(reports: Report[], currentType: string): number {
    const types = new Set(reports.map((r) => r.type))
    const diversityRatio = types.size / reports.length
    return 1.0 + diversityRatio * 0.2 // Up to 20% bonus for source diversity
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

  private mapEventFromDb(row: any): Event {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      description: row.description,
      startTime: row.start_time,
      endTime: row.end_time,
      location: row.location
        ? {
            type: "Point",
            coordinates: [row.location.coordinates[0], row.location.coordinates[1]],
          }
        : undefined,
      areaOfInterest: row.area_of_interest
        ? {
            type: "Polygon",
            coordinates: row.area_of_interest.coordinates,
          }
        : undefined,
      confidenceScore: Number.parseFloat(row.confidence_score),
      sensitivity: row.sensitivity,
      status: row.status,
      createdBy: row.created_by,
      approvedBy: row.approved_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}
