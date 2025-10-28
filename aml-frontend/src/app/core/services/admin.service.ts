import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// ===== DTOs =====

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
  field: string;
  operator: string;
  value: string;
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
  documentType: string;
  fileName: string;
  storagePath: string;
  uploadedAt: string;
  status: string; // UPLOADED, VERIFIED, REJECTED
  customerId: number;
  customerName?: string;
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
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly API_URL = 'http://localhost:8080/api';
  private apiUrl = `${this.API_URL}/admin`;

  constructor(private http: HttpClient) {}

  // ===== USER MANAGEMENT =====
  
  getAllUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.apiUrl}/users`);
  }

  createUser(createUserDto: CreateUserDto): Observable<UserDto> {
    return this.http.post<UserDto>(`${this.apiUrl}/users`, createUserDto);
  }

  // ===== RULES MANAGEMENT =====
  
  getAllRules(): Observable<RuleDto[]> {
    return this.http.get<RuleDto[]>(`${this.apiUrl}/rules`);
  }

  createRule(ruleDto: RuleDto): Observable<RuleDto> {
    return this.http.post<RuleDto>(`${this.apiUrl}/rules`, ruleDto);
  }

  updateRule(id: number, ruleDto: RuleDto): Observable<RuleDto> {
    return this.http.put<RuleDto>(`${this.apiUrl}/rules/${id}`, ruleDto);
  }

  toggleRuleStatus(id: number, active: boolean): Observable<RuleDto> {
    const params = new HttpParams().set('active', active.toString());
    return this.http.patch<RuleDto>(`${this.apiUrl}/rules/${id}/toggle`, null, { params });
  }

  deleteRule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/rules/${id}`);
  }

  // ===== KEYWORDS MANAGEMENT =====
  
  getAllKeywords(): Observable<SuspiciousKeywordDto[]> {
    return this.http.get<SuspiciousKeywordDto[]>(`${this.apiUrl}/keywords`);
  }

  addKeyword(keywordDto: SuspiciousKeywordDto): Observable<SuspiciousKeywordDto> {
    return this.http.post<SuspiciousKeywordDto>(`${this.apiUrl}/keywords`, keywordDto);
  }

  deleteKeyword(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/keywords/${id}`);
  }

  // ===== ACCOUNT MANAGEMENT =====
  
  getAllAccounts(): Observable<BankAccountDto[]> {
    return this.http.get<BankAccountDto[]>(`${this.apiUrl}/accounts`);
  }

  getPendingAccounts(): Observable<BankAccountDto[]> {
    return this.http.get<BankAccountDto[]>(`${this.apiUrl}/accounts/pending`);
  }

  getAccountById(id: number): Observable<BankAccountDto> {
    return this.http.get<BankAccountDto>(`${this.apiUrl}/accounts/${id}`);
  }

  approveAccount(id: number): Observable<BankAccountDto> {
    return this.http.post<BankAccountDto>(`${this.apiUrl}/accounts/${id}/approve`, null);
  }

  rejectAccount(id: number): Observable<BankAccountDto> {
    return this.http.post<BankAccountDto>(`${this.apiUrl}/accounts/${id}/reject`, null);
  }

  suspendAccount(id: number): Observable<BankAccountDto> {
    return this.http.post<BankAccountDto>(`${this.apiUrl}/accounts/${id}/suspend`, null);
  }

  activateAccount(id: number): Observable<BankAccountDto> {
    return this.http.post<BankAccountDto>(`${this.apiUrl}/accounts/${id}/activate`, null);
  }

  // ===== COUNTRY RISK MANAGEMENT =====
  
  getCountryRisks(): Observable<CountryRiskDto[]> {
    return this.http.get<CountryRiskDto[]>(`${this.apiUrl}/country-risks`);
  }

  createCountryRisk(dto: CountryRiskDto): Observable<CountryRiskDto> {
    return this.http.post<CountryRiskDto>(`${this.apiUrl}/country-risks`, dto);
  }

  updateCountryRisk(id: number, dto: CountryRiskDto): Observable<CountryRiskDto> {
    return this.http.put<CountryRiskDto>(`${this.apiUrl}/country-risks/${id}`, dto);
  }

  deleteCountryRisk(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/country-risks/${id}`);
  }

  // ===== TRANSACTION MANAGEMENT =====
  
  getTransactionsByAccount(accountNumber: string): Observable<TransactionDto[]> {
    return this.http.get<TransactionDto[]>(`${this.apiUrl}/transactions/account/${accountNumber}`);
  }

  // ===== COMPLIANCE OFFICER MANAGEMENT =====
  
  getComplianceOfficers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.apiUrl}/compliance-officers`);
  }

  createComplianceOfficer(createUserDto: CreateUserDto): Observable<UserDto> {
    return this.http.post<UserDto>(`${this.apiUrl}/compliance-officers`, createUserDto);
  }

  addComplianceOfficer(userId: number): Observable<UserDto> {
    return this.http.post<UserDto>(`${this.apiUrl}/compliance-officers/${userId}`, null);
  }

  removeComplianceOfficer(userId: number): Observable<UserDto> {
    return this.http.post<UserDto>(`${this.apiUrl}/compliance-officers/${userId}/remove`, null);
  }

  // ===== CUSTOMER BLOCKING =====
  
  blockCustomer(userId: number, reason?: string): Observable<UserDto> {
    const params = reason ? new HttpParams().set('reason', reason) : undefined;
    return this.http.post<UserDto>(`${this.apiUrl}/customers/${userId}/block`, null, { params });
  }

  unblockCustomer(userId: number): Observable<UserDto> {
    return this.http.post<UserDto>(`${this.apiUrl}/customers/${userId}/unblock`, null);
  }

  getBlockedCustomers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.apiUrl}/customers/blocked`);
  }

  // ===== AUDIT LOGS =====
  
  getAllAuditLogs(): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.apiUrl}/audit-logs`);
  }

  getAuditLogsByUsername(username: string): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.apiUrl}/audit-logs/user/${username}`);
  }

  getAuditLogsByAction(action: string): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.apiUrl}/audit-logs/action/${action}`);
  }

  // ===== KYC DOCUMENT VERIFICATION =====
  
  getPendingKycDocuments(): Observable<DocumentDTO[]> {
    return this.http.get<DocumentDTO[]>(`${this.apiUrl}/kyc/documents/pending`);
  }

  verifyKycDocument(documentId: number): Observable<DocumentDTO> {
    return this.http.post<DocumentDTO>(`${this.apiUrl}/kyc/documents/${documentId}/verify`, null);
  }

  rejectKycDocument(documentId: number): Observable<DocumentDTO> {
    return this.http.post<DocumentDTO>(`${this.apiUrl}/kyc/documents/${documentId}/reject`, null);
  }
}
