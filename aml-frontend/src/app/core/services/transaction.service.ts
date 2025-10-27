import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

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

export interface DepositDto {
  toAccountNumber: string;
  amount: number;
  currency?: string;  // Optional - backend auto-detects from toAccount
  description?: string;
}

export interface WithdrawalDto {
  fromAccountNumber: string;
  amount: number;
  description?: string;
}

export interface TransferDto {
  fromAccountNumber: string;
  toAccountNumber: string;
  amount: number;
  currency?: string;  // Optional - backend auto-detects from fromAccount
  description?: string;
  receiverCountryCode?: string;
}

export interface IntercurrencyTransferDto {
  fromAccountNumber: string;
  toAccountNumber: string;
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  description?: string;
  receiverCountryCode?: string;
}

export interface CurrencyConversionDto {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  convertedAmount?: number;
  exchangeRate?: number;
}

export interface BalanceDto {
  accountNumber: string;
  balance: number;
  currency: string;
}

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly API_URL = 'http://localhost:8080/api';

  constructor(private http: HttpClient, private auth: AuthService) {}

  // Backend returns TransactionDto[] directly
  getHistory(): Observable<TransactionDto[]> {
    return this.http.get<TransactionDto[]>(
      `${this.API_URL}/transactions/history`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  // Backend returns TransactionDto[] directly
  getHistoryByAccount(accountNumber: string): Observable<TransactionDto[]> {
    return this.http.get<TransactionDto[]>(
      `${this.API_URL}/transactions/history/${encodeURIComponent(accountNumber)}`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  // Backend returns TransactionDto directly
  deposit(body: DepositDto): Observable<TransactionDto> {
    return this.http.post<TransactionDto>(
      `${this.API_URL}/transactions/deposit`,
      body,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  // Backend returns TransactionDto directly
  withdraw(body: WithdrawalDto): Observable<TransactionDto> {
    return this.http.post<TransactionDto>(
      `${this.API_URL}/transactions/withdraw`,
      body,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  // Backend returns TransactionDto directly
  transfer(body: TransferDto): Observable<TransactionDto> {
    return this.http.post<TransactionDto>(
      `${this.API_URL}/transactions/transfer`,
      body,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  // Backend returns TransactionDto directly
  intercurrencyTransfer(body: IntercurrencyTransferDto): Observable<TransactionDto> {
    return this.http.post<TransactionDto>(
      `${this.API_URL}/transactions/intercurrency-transfer`,
      body,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  // Calculate currency conversion
  calculateCurrencyConversion(body: CurrencyConversionDto): Observable<CurrencyConversionDto> {
    return this.http.post<CurrencyConversionDto>(
      `${this.API_URL}/transactions/currency-conversion/calculate`,
      body,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  // Get account balance
  getAccountBalance(accountNumber: string): Observable<BalanceDto> {
    return this.http.get<BalanceDto>(
      `${this.API_URL}/transactions/balance/${encodeURIComponent(accountNumber)}`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  // Get transaction status
  getTransactionStatus(transactionId: number): Observable<TransactionDto> {
    return this.http.get<TransactionDto>(
      `${this.API_URL}/transactions/status/${transactionId}`,
      { headers: this.auth.getAuthHeaders() }
    );
  }
}
