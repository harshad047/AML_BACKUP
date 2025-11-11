// Compliance Analytics Service Models

export interface ComplianceAnalyticsData {
  // KPIs
  totalAlerts: number;
  openAlerts: number;
  escalatedAlerts: number;
  resolvedAlerts: number;
  activeCases: number;
  resolvedCases: number;
  averageResponseTime: number; // in hours
  slaComplianceRate: number; // percentage

  // Alert Analytics
  alertTrends: { date: string; open: number; escalated: number; resolved: number }[];
  alertsByRisk: { level: string; count: number }[];
  alertsByType: { type: string; count: number }[];
  topAlertTriggers: { ruleName: string; count: number; action: string }[];
  recentAlerts: { id: number; transactionId: number; reason: string; riskScore: number; status: string; createdAt: string }[];

  // Case Analytics
  caseStatusDistribution: { status: string; count: number }[];
  casesByOfficer: { officer: string; active: number; resolved: number }[];
  caseResolutionTime: { date: string; avgHours: number }[];
  caseOutcomes: { outcome: string; count: number }[];

  // Transaction Review Analytics
  flaggedTransactions: number;
  blockedTransactions: number;
  reviewedTransactions: number;
  transactionReviewOutcomes: { outcome: string; count: number }[];
  highRiskTransactions: { id: number; amount: number; currency: string; riskScore: number; status: string }[];

  // Performance Metrics
  alertResponseTimes: { date: string; avgHours: number }[];
  officerPerformance: { officer: string; alertsReviewed: number; casesResolved: number; avgResponseTime: number }[];

  // Risk Metrics
  riskDistribution: { level: string; count: number }[];
  riskTrends: { date: string; high: number; medium: number; low: number }[];
  highRiskCustomers: { customerId: number; customerName: string; riskScore: number; alertCount: number }[];
}
