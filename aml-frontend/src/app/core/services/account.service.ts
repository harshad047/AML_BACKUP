import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface CreateAccountRequest {
  accountType: 'SAVINGS' | 'CURRENT';
  initialBalance?: number;
  currency: string;
}

export interface AccountDto {
  id: number;
  accountNumber: string;
  accountType: string;
  balance: number;
  currency: string;
  status: string;
  approvalStatus: string;
  createdAt?: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  suspendedAt?: string | null;
  activatedAt?: string | null;
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly API_URL = 'http://localhost:8080/api';

  constructor(private http: HttpClient, private auth: AuthService) {}

  // Backend returns AccountDto directly, not wrapped in ApiResponse
  createAccount(req: CreateAccountRequest): Observable<AccountDto> {
    return this.http.post<AccountDto>(
      `${this.API_URL}/accounts`,
      req,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  // Backend returns AccountDto[] directly, not wrapped in ApiResponse
  getMyAccounts(): Observable<AccountDto[]> {
    return this.http.get<AccountDto[]>(
      `${this.API_URL}/accounts`,
      { headers: this.auth.getAuthHeaders() }
    );
  }
}
