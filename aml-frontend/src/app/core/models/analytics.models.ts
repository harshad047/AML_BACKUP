// Analytics Service Models

export interface AnalyticsData {
  // Executive Summary
  totalTransactions: number;
  averageRiskScore: number;
  activeAlerts: number;
  complianceRate: number;

  // Transaction Analytics
  transactionsByType: { type: string; count: number; amount: number }[];
  transactionsByStatus: { status: string; count: number }[];
  transactionTrends: { date: string; total: number; approved: number; flagged: number; blocked: number }[];
  transactionAmountTrends: { date: string; amount: number; currency: string }[];
  topHighValueTransactions: { id: number; amount: number; riskScore: number; currency: string }[];

  // Risk Analytics
  riskDistribution: { level: string; count: number }[];
  riskTrends: { date: string; high: number; medium: number; low: number }[];
  alertTrends: { date: string; open: number; escalated: number; resolved: number }[];
  topTriggeredRules: { ruleName: string; count: number; action: string }[];

  // User Analytics
  userGrowth: { month: string; newUsers: number; totalUsers: number }[];
  userStatusDistribution: { status: string; count: number }[];
  kycStatus: { status: string; count: number }[];
  topCustomersByVolume: { name: string; transactions: number; amount: number }[];

  // Officer Performance
  casesByOfficer: { officer: string; resolved: number; pending: number }[];
  caseResolutionTime: { date: string; avgDays: number }[];
  caseOutcomes: { outcome: string; count: number }[];

  // Country Risk
  transactionsByCountry: { country: string; count: number; riskLevel: string }[];

  // Account Analytics
  accountsByType: { type: string; count: number }[];
  accountsByCurrency: { currency: string; count: number }[];
  accountGrowth: { month: string; count: number }[];

  // Audit Logs
  activityByAction: { action: string; count: number }[];
  activityByRole: { role: string; count: number }[];
}
