import type { User } from "../types/database"

export type Permission =
  | "READ_REPORTS"
  | "WRITE_REPORTS"
  | "APPROVE_EVENTS"
  | "VIEW_CLASSIFIED"
  | "MANAGE_USERS"
  | "VIEW_AUDIT_LOGS"
  | "MAKE_DECISIONS"
  | "VIEW_ALL_INTEL"
  | "FUSION_ANALYSIS"

export const ROLE_PERMISSIONS: Record<User["role"], Permission[]> = {
  HQ: [
    "READ_REPORTS",
    "APPROVE_EVENTS",
    "VIEW_CLASSIFIED",
    "MANAGE_USERS",
    "VIEW_AUDIT_LOGS",
    "MAKE_DECISIONS",
    "VIEW_ALL_INTEL",
    "FUSION_ANALYSIS",
  ],
  ANALYST_SOCMINT: ["READ_REPORTS", "WRITE_REPORTS", "VIEW_CLASSIFIED", "FUSION_ANALYSIS"],
  ANALYST_SIGINT: ["READ_REPORTS", "WRITE_REPORTS", "VIEW_CLASSIFIED", "FUSION_ANALYSIS"],
  ANALYST_HUMINT: ["READ_REPORTS", "WRITE_REPORTS", "VIEW_CLASSIFIED", "FUSION_ANALYSIS"],
  OBSERVER: ["READ_REPORTS", "VIEW_ALL_INTEL"],
}

export const CLEARANCE_HIERARCHY = {
  UNCLASSIFIED: 0,
  CONFIDENTIAL: 1,
  SECRET: 2,
  TOP_SECRET: 3,
}

export function hasPermission(userRole: User["role"], permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false
}

export function canAccessClassification(userClearance: string, dataClassification: string): boolean {
  const userLevel = CLEARANCE_HIERARCHY[userClearance as keyof typeof CLEARANCE_HIERARCHY] || 0
  const dataLevel = CLEARANCE_HIERARCHY[dataClassification as keyof typeof CLEARANCE_HIERARCHY] || 0
  return userLevel >= dataLevel
}

export function filterByClassification<T extends { classification: string }>(items: T[], userClearance: string): T[] {
  return items.filter((item) => canAccessClassification(userClearance, item.classification))
}
