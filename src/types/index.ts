export type IssueStatus =
  | "reported"
  | "verified"
  | "in_progress"
  | "resolved";

export type IssueCategory =
  | "pothole"
  | "water_leak"
  | "streetlight"
  | "waste"
  | "infrastructure"
  | "other";

export type SeverityLevel = "low" | "medium" | "high";

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  severity: number;
  severityLevel: SeverityLevel;
  lat: number;
  lng: number;
  address: string;
  zone: string;
  images: string[];
  video?: string;
  afterImage?: string;
  reporterId: string;
  reporterName: string;
  confirmations: number;
  upvotes: number;
  spamReports: number;
  aiCategory: string;
  aiCauses: string[];
  aiLetter?: string;
  aiSummary?: string;
  aiConfidence?: number;
  aiRecommendedAction?: string;
  aiEstimatedFixDays?: number;
  aiUrgencyLabel?: string;
  clusterId?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  daysOpen: number;
  hasUserMedia?: boolean;
}

export interface User {
  id: string;
  callsign: string;
  email: string;
  xp: number;
  level: number;
  badges: string[];
  verified: boolean;
  genuineReports: number;
  reportsCount: number;
  verificationsCount: number;
  streak: number;
  dailyMissionsCompleted: string[];
  lastMissionDate: string;
}

export interface TickerEvent {
  id: string;
  message: string;
  timestamp: string;
}

export interface MonthlyStats {
  month: string;
  year: number;
  reported: number;
  resolved: number;
  pending: number;
  topZones: { zone: string; count: number }[];
  topReporters: { name: string; count: number }[];
}

export type TabId = "map" | "report" | "queue" | "intel";

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  completed: boolean;
}

export const STATUS_LABELS: Record<IssueStatus, string> = {
  reported: "REPORTED",
  verified: "VERIFIED",
  in_progress: "IN PROGRESS",
  resolved: "RESOLVED",
};

export const STATUS_COLORS: Record<IssueStatus, string> = {
  reported: "#c47a2c",
  verified: "#b8956a",
  in_progress: "#4a5d23",
  resolved: "#4a7c59",
};

export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  low: "#4a7c59",
  medium: "#c47a2c",
  high: "#8b2e2e",
};

export const CATEGORY_LABELS: Record<IssueCategory, string> = {
  pothole: "Pothole",
  water_leak: "Water Leak",
  streetlight: "Streetlight",
  waste: "Waste Management",
  infrastructure: "Infrastructure",
  other: "Other",
};

export function getSeverityLevel(score: number): SeverityLevel {
  if (score >= 7) return "high";
  if (score >= 4) return "medium";
  return "low";
}

export function getPulseSpeed(daysOpen: number, severity: number): "slow" | "medium" | "fast" {
  if (daysOpen > 14 || severity >= 8) return "fast";
  if (daysOpen > 7 || severity >= 5) return "medium";
  return "slow";
}
