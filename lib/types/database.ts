export interface User {
  id: string
  username: string
  email: string
  role: "HQ" | "ANALYST_SOCMINT" | "ANALYST_SIGINT" | "ANALYST_HUMINT" | "OBSERVER"
  clearanceLevel: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface Entity {
  id: string
  type: "PERSON" | "ORGANIZATION" | "LOCATION" | "VEHICLE" | "FACILITY" | "EQUIPMENT"
  name: string
  attributes: Record<string, any>
  confidenceScore: number
  location?: {
    type: "Point"
    coordinates: [number, number] // [longitude, latitude]
  }
  createdBy: string
  createdAt: Date
  updatedAt: Date
  classification: string
  isValidated: boolean
}

export interface Event {
  id: string
  type: string
  title: string
  description?: string
  startTime?: Date
  endTime?: Date
  location?: {
    type: "Point"
    coordinates: [number, number]
  }
  areaOfInterest?: {
    type: "Polygon"
    coordinates: number[][][]
  }
  confidenceScore: number
  sensitivity: string
  status: "PENDING" | "APPROVED" | "REJECTED" | "UNDER_REVIEW"
  createdBy: string
  approvedBy?: string
  createdAt: Date
  updatedAt: Date
}

export interface Report {
  id: string
  type: "SOCMINT" | "SIGINT" | "HUMINT"
  title: string
  content: Record<string, any>
  location?: {
    type: "Point"
    coordinates: [number, number]
  }
  collectionTime?: Date
  submittedBy: string
  submittedAt: Date
  classification: string
  reliability?: "A" | "B" | "C" | "D" | "E" | "F"
  credibility?: "1" | "2" | "3" | "4" | "5" | "6"
  status: "SUBMITTED" | "PROCESSING" | "FUSED" | "ARCHIVED"
}

export interface Decision {
  id: string
  decisionType: "APPROVE_EVENT" | "REJECT_EVENT" | "REQUEST_INFO" | "OPERATIONAL_DECISION"
  title: string
  description?: string
  decisionMaker: string
  relatedEventId?: string
  status: "ACTIVE" | "SUPERSEDED" | "CANCELLED"
  classification: string
  createdAt: Date
  effectiveUntil?: Date
}

export interface FusionProvenance {
  id: string
  eventId: string
  sourceReportId: string
  fusionAlgorithm?: string
  weight: number
  createdAt: Date
}

export interface Attachment {
  id: string
  filename: string
  filePath: string
  fileSize?: number
  mimeType?: string
  reportId: string
  uploadedBy: string
  uploadedAt: Date
  classification: string
}

export interface AuditLog {
  id: string
  userId?: string
  action: string
  resourceType?: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  createdAt: Date
}

export interface QAThread {
  id: string
  eventId?: string
  questionerId: string
  question: string
  answer?: string
  answererId?: string
  status: "OPEN" | "ANSWERED" | "CLOSED"
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT"
  createdAt: Date
  answeredAt?: Date
}
