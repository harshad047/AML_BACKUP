// Admin Service Models

export interface UserDto {
  id: number;
  username: string;
  role: string; // Backend returns Role enum as string
  // Note: Backend UserDto only returns id, username, role
  // Additional fields would need backend DTO enhancement
  email?: string;
  firstName?: string;
  lastName?: string;
  blocked?: boolean;
  blockReason?: string;
  isEnabled?: boolean;
}

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  role: string; // CUSTOMER, OFFICER, ADMIN, SUPER_ADMIN
}

export interface RuleConditionDto {
  id?: number;
  type: string; // AMOUNT, COUNTRY_RISK, NLP_SCORE, etc.
  field: string;
  operator: string;
  value: string;
  active: boolean;
}

export interface RuleDto {
  id?: number;
  name: string;
  description: string;
  priority: number;
  action: string; // FLAG, BLOCK, REVIEW
  riskWeight: number;
  active: boolean;
  conditions: RuleConditionDto[];
}

export interface SuspiciousKeywordDto {
  id?: number;
  keyword: string;
  riskLevel: string; // CRITICAL, HIGH, MEDIUM, LOW
  riskScore: number;
  category?: string;
  description?: string;
  active: boolean;
  caseSensitive: boolean;
  wholeWordOnly: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CountryRiskDto {
  id?: number;
  countryCode: string;
  countryName: string;
  riskScore: number;
  notes?: string;
}

export interface AuditLog {
  id: number;
  username: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface BankAccountDto {
  id: number;
  accountNumber: string;
  accountType: string;
  balance: number;
  currency: string;
  status: string; // PENDING, ACTIVE, SUSPENDED, REJECTED
  approvalStatus: string; // PENDING, APPROVED, REJECTED
  customerId: number;
  customerName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DocumentDTO {
  id: number;
  docType: string;
  storagePath: string;
  uploadedAt: string;
  status: string; // UPLOADED, VERIFIED, REJECTED
  customerId: number;
  customerName?: string;
  rejectionReason?: string;
}

export interface TransactionDto {
  id: number;
  transactionType: string;
  amount: number;
  currency: string;
  status: string;
  fromAccountNumber?: string;
  toAccountNumber?: string;
  description?: string;
  createdAt: string;
  combinedRiskScore?: number;
  transactionReference: string;
  customerId: number;
  updatedAt: string;
}

export interface AdminCustomerDetailsDto {
  userId: number;
  customerId: number;
  username: string;
  email: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  phone?: string;
  address?: any;
  kycStatus?: string;
  enabled: boolean;
  createdAt?: string;
  transactionCount: number;
  alertCount: number;
  accounts?: BankAccountDto[];
}
