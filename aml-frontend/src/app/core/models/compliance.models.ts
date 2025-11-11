export interface AlertDto {
  id: number;
  transactionId: number;
  reason: string;
  riskScore: number;
  status: 'OPEN' | 'ESCALATED' | 'RESOLVED';
  createdAt: string;
  transaction?: BaseTransactionDto;
}

export interface CaseDto {
  id: number;
  alert: AlertDto;
  assignedTo: string;
  status: 'UNDER_INVESTIGATION' | 'RESOLVED' | 'CLOSED';
  notes?: NoteDto[];
  createdAt: string;
  updatedAt: string;
}

export interface NoteDto {
  id: number;
  author: string;
  content: string;
  createdAt: string;
}

export interface ObstructedRuleDto {
  ruleId: number;
  ruleName: string;
  action: 'FLAG' | 'BLOCK';
  riskWeight: number;
  priority: number;
  details: string;
  evaluatedAt: string;
}

export interface BaseTransactionDto {
  id: number;
  transactionType: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'INTERCURRENCY_TRANSFER';
  fromAccountNumber?: string;
  toAccountNumber?: string;
  customerId: number;
  amount: number;
  currency: string;
  description?: string;
  status: string;
  nlpScore?: number;
  ruleEngineScore?: number;
  combinedRiskScore?: number;
  thresholdExceeded: boolean;
  alertId?: string;
  createdAt: string;
  updatedAt: string;
  transactionReference: string;
  obstructedRules?: ObstructedRuleDto[];
}

export interface TransactionDto extends BaseTransactionDto {
  // Intercurrency exchange specific fields
  originalAmount?: number;
  originalCurrency?: string;
  convertedAmount?: number;
  convertedCurrency?: string;
  exchangeRate?: number;
  conversionCharges?: number;
  totalDebitAmount?: number;
  chargeBreakdown?: string;
  obstructedRules?: ObstructedRuleDto[];
}

export interface CreateCaseRequest {
  alertId: number;
}

export interface AddNoteRequest {
  content: string;
}

export interface TransactionActionRequest {
  reason?: string;
}

export interface ComplianceDashboardStats {
  openAlerts: number;
  activeCases: number;
  pendingReviews: number;
  resolvedToday: number;
}
