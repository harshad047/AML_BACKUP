import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService, ApiResponse } from './auth.service';

export interface TransactionDto {
  id: number;
  transactionType: string;
  toAccountNumber?: string;
  fromAccountNumber?: string;
  customerId: number;
  amount: number;
  currency: string;
  description?: string;
  status: string;
  nlpScore?: number;
  ruleEngineScore?: number;
  combinedRiskScore?: number;
  thresholdExceeded?: boolean;
  alertId?: string;
  createdAt: string;
  updatedAt: string;
  transactionReference: string;
}

export interface CreateTransactionRequest {
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';
  amount: number;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly API_URL = 'http://localhost:8080/api';

  constructor(private http: HttpClient, private auth: AuthService) {}

  // History for current user
  getHistory(): Observable<ApiResponse<TransactionDto[]>> {
    return this.http.get<ApiResponse<TransactionDto[]>>(
      `${this.API_URL}/transactions/history`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  // History by account number
  getHistoryByAccount(accountNumber: string): Observable<ApiResponse<TransactionDto[]>> {
    return this.http.get<ApiResponse<TransactionDto[]>>(
      `${this.API_URL}/transactions/history/${encodeURIComponent(accountNumber)}`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  deposit(body: { toAccountNumber: string; amount: number; currency?: string; description?: string }): Observable<ApiResponse<TransactionDto>> {
    return this.http.post<ApiResponse<TransactionDto>>(
      `${this.API_URL}/transactions/deposit`,
      body,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  withdraw(body: { accountNumber: string; amount: number; description?: string }): Observable<ApiResponse<TransactionDto>> {
    return this.http.post<ApiResponse<TransactionDto>>(
      `${this.API_URL}/transactions/withdraw`,
      body,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  transfer(body: { fromAccountNumber: string; toAccountNumber: string; amount: number; description?: string }): Observable<ApiResponse<TransactionDto>> {
    return this.http.post<ApiResponse<TransactionDto>>(
      `${this.API_URL}/transactions/transfer`,
      body,
      { headers: this.auth.getAuthHeaders() }
    );
  }
}
