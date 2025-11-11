import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService, ApiResponse } from './auth.service';
import {
  AlertDto,
  CaseDto,
  TransactionDto,
  BaseTransactionDto,
  CreateCaseRequest,
  AddNoteRequest,
  TransactionActionRequest,
  ComplianceDashboardStats
} from '../models/compliance.models';

@Injectable({ providedIn: 'root' })
export class ComplianceService {
  private readonly API_URL = `${environment.apiUrl}/compliance`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  // Alert Management
  getAllOpenAlerts(): Observable<AlertDto[]> {
    return this.http.get<AlertDto[]>(
      `${this.API_URL}/alerts`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  getAllAlerts(): Observable<AlertDto[]> {
    return this.http.get<AlertDto[]>(
      `${this.API_URL}/alerts/all`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  getAlertById(id: number): Observable<AlertDto> {
    return this.http.get<AlertDto>(
      `${this.API_URL}/alerts/${id}`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  // Case Management
  createCaseFromAlert(alertId: number): Observable<CaseDto> {
    return this.http.post<CaseDto>(
      `${this.API_URL}/alerts/${alertId}/case`,
      {},
      { headers: this.auth.getAuthHeaders() }
    );
  }

  addNoteToCase(caseId: number, request: AddNoteRequest): Observable<CaseDto> {
    return this.http.post<CaseDto>(
      `${this.API_URL}/cases/${caseId}/notes`,
      request,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  getCasesUnderInvestigation(): Observable<CaseDto[]> {
    return this.http.get<CaseDto[]>(
      `${this.API_URL}/cases/under-investigation`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  getResolvedCases(): Observable<CaseDto[]> {
    return this.http.get<CaseDto[]>(
      `${this.API_URL}/cases/resolved`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  getCaseById(caseId: number): Observable<CaseDto> {
    return this.http.get<CaseDto>(
      `${this.API_URL}/cases/${caseId}`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  // Transaction Management
  getFlaggedTransactions(): Observable<TransactionDto[]> {
    return this.http.get<TransactionDto[]>(
      `${this.API_URL}/transactions/flagged`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  getBlockedTransactions(): Observable<TransactionDto[]> {
    return this.http.get<TransactionDto[]>(
      `${this.API_URL}/transactions/blocked`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  getTransactionsForReview(): Observable<TransactionDto[]> {
    return this.http.get<TransactionDto[]>(
      `${this.API_URL}/transactions/review`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  getAllTransactions(): Observable<TransactionDto[]> {
    return this.http.get<TransactionDto[]>(
      `${this.API_URL}/transactions/all`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  getTransactionById(transactionId: number): Observable<TransactionDto> {
    return this.http.get<TransactionDto>(
      `${this.API_URL}/transactions/${transactionId}`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  // Transaction Actions
  approveTransaction(transactionId: number): Observable<TransactionDto> {
    return this.http.post<TransactionDto>(
      `${this.API_URL}/transactions/${transactionId}/approve`,
      {},
      { headers: this.auth.getAuthHeaders() }
    );
  }

  rejectTransaction(transactionId: number, reason?: string): Observable<TransactionDto> {
    let params = new HttpParams();
    if (reason) {
      params = params.set('reason', reason);
    }
    return this.http.post<TransactionDto>(
      `${this.API_URL}/transactions/${transactionId}/reject`,
      {},
      { 
        headers: this.auth.getAuthHeaders(),
        params
      }
    );
  }

  // Enhanced Transaction-Alert Mapping
  getAlertsForTransaction(transactionId: number): Observable<AlertDto[]> {
    return this.http.get<AlertDto[]>(
      `${this.API_URL}/transactions/${transactionId}/alerts`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  getTransactionWithAlerts(transactionId: number): Observable<TransactionDto> {
    return this.http.get<TransactionDto>(
      `${this.API_URL}/transactions/${transactionId}/with-alerts`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  getTransactionsWithAlerts(): Observable<TransactionDto[]> {
    return this.http.get<TransactionDto[]>(
      `${this.API_URL}/transactions/with-alerts`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  getFlaggedTransactionsWithAlerts(): Observable<TransactionDto[]> {
    return this.http.get<TransactionDto[]>(
      `${this.API_URL}/transactions/flagged-with-alerts`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  // Optimized endpoints
  getFlaggedTransactionsOptimized(): Observable<BaseTransactionDto[]> {
    return this.http.get<BaseTransactionDto[]>(
      `${this.API_URL}/transactions/flagged/optimized`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  getBlockedTransactionsOptimized(): Observable<BaseTransactionDto[]> {
    return this.http.get<BaseTransactionDto[]>(
      `${this.API_URL}/transactions/blocked/optimized`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  // Dashboard Statistics (derived from API calls)
  getDashboardStats(): Observable<ComplianceDashboardStats> {
    return new Observable(observer => {
      Promise.all([
        this.getAllOpenAlerts().toPromise(),
        this.getCasesUnderInvestigation().toPromise(),
        this.getTransactionsForReview().toPromise(),
        this.getResolvedCases().toPromise()
      ]).then(([alerts, cases, pendingTransactions, resolvedCases]) => {
        const today = new Date().toDateString();
        const resolvedToday = resolvedCases?.filter(c => 
          new Date(c.updatedAt).toDateString() === today
        ).length || 0;

        observer.next({
          openAlerts: alerts?.length || 0,
          activeCases: cases?.length || 0,
          pendingReviews: pendingTransactions?.length || 0,
          resolvedToday
        });
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }
}
