import { query } from "@/lib/database/connection"
import type { Decision } from "@/lib/types/database"
import { v4 as uuidv4 } from "uuid"

export class DecisionService {
  async createDecision(decisionData: Omit<Decision, "id" | "createdAt">): Promise<Decision> {
    const id = uuidv4()
    const createdAt = new Date()

    const result = await query(
      `INSERT INTO decisions (id, decision_type, title, description, decision_maker, related_event_id, status, classification, effective_until)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        id,
        decisionData.decisionType,
        decisionData.title,
        decisionData.description,
        decisionData.decisionMaker,
        decisionData.relatedEventId,
        decisionData.status,
        decisionData.classification,
        decisionData.effectiveUntil,
      ],
    )

    // Log the decision
    await query(
      "INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES ($1, $2, $3, $4, $5)",
      [
        decisionData.decisionMaker,
        "CREATE_DECISION",
        "DECISION",
        id,
        { type: decisionData.decisionType, title: decisionData.title },
      ],
    )

    return this.mapDecisionFromDb(result.rows[0])
  }

  async approveEvent(eventId: string, approverId: string, notes?: string): Promise<Decision> {
    // Update event status
    await query("UPDATE events SET status = $1, approved_by = $2 WHERE id = $3", ["APPROVED", approverId, eventId])

    // Create approval decision
    const decision = await this.createDecision({
      decisionType: "APPROVE_EVENT",
      title: "Event Approved",
      description: notes || "Event approved for operational use",
      decisionMaker: approverId,
      relatedEventId: eventId,
      status: "ACTIVE",
      classification: "SECRET",
    })

    return decision
  }

  async rejectEvent(eventId: string, rejectorId: string, reason: string): Promise<Decision> {
    // Update event status
    await query("UPDATE events SET status = $1 WHERE id = $2", ["REJECTED", eventId])

    // Create rejection decision
    const decision = await this.createDecision({
      decisionType: "REJECT_EVENT",
      title: "Event Rejected",
      description: reason,
      decisionMaker: rejectorId,
      relatedEventId: eventId,
      status: "ACTIVE",
      classification: "SECRET",
    })

    return decision
  }

  async requestMoreInfo(eventId: string, requesterId: string, question: string): Promise<void> {
    // Create Q&A thread
    await query(
      "INSERT INTO qa_threads (event_id, questioner_id, question, status, priority) VALUES ($1, $2, $3, $4, $5)",
      [eventId, requesterId, question, "OPEN", "NORMAL"],
    )

    // Create decision record
    await this.createDecision({
      decisionType: "REQUEST_INFO",
      title: "Information Request",
      description: question,
      decisionMaker: requesterId,
      relatedEventId: eventId,
      status: "ACTIVE",
      classification: "SECRET",
    })
  }

  async getDecisions(
    filters: {
      decisionMaker?: string
      decisionType?: Decision["decisionType"]
      relatedEventId?: string
      status?: Decision["status"]
      limit?: number
      offset?: number
    } = {},
  ): Promise<Decision[]> {
    let whereClause = "WHERE 1=1"
    const params: any[] = []
    let paramCount = 0

    if (filters.decisionMaker) {
      whereClause += ` AND decision_maker = $${++paramCount}`
      params.push(filters.decisionMaker)
    }

    if (filters.decisionType) {
      whereClause += ` AND decision_type = $${++paramCount}`
      params.push(filters.decisionType)
    }

    if (filters.relatedEventId) {
      whereClause += ` AND related_event_id = $${++paramCount}`
      params.push(filters.relatedEventId)
    }

    if (filters.status) {
      whereClause += ` AND status = $${++paramCount}`
      params.push(filters.status)
    }

    const limit = filters.limit || 50
    const offset = filters.offset || 0

    const result = await query(
      `SELECT d.*, u.username as decision_maker_username, e.title as event_title
       FROM decisions d
       JOIN users u ON d.decision_maker = u.id
       LEFT JOIN events e ON d.related_event_id = e.id
       ${whereClause}
       ORDER BY d.created_at DESC
       LIMIT $${++paramCount} OFFSET $${++paramCount}`,
      [...params, limit, offset],
    )

    return result.rows.map(this.mapDecisionFromDb)
  }

  async getDecisionById(id: string): Promise<Decision | null> {
    const result = await query(
      `SELECT d.*, u.username as decision_maker_username, e.title as event_title
       FROM decisions d
       JOIN users u ON d.decision_maker = u.id
       LEFT JOIN events e ON d.related_event_id = e.id
       WHERE d.id = $1`,
      [id],
    )

    return result.rows.length > 0 ? this.mapDecisionFromDb(result.rows[0]) : null
  }

  private mapDecisionFromDb(row: any): Decision {
    return {
      id: row.id,
      decisionType: row.decision_type,
      title: row.title,
      description: row.description,
      decisionMaker: row.decision_maker,
      relatedEventId: row.related_event_id,
      status: row.status,
      classification: row.classification,
      createdAt: row.created_at,
      effectiveUntil: row.effective_until,
    }
  }
}
