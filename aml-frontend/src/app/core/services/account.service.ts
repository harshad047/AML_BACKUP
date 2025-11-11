import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { CreateAccountRequest, AccountDto } from '../models/account.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly API_URL = environment.apiUrl;

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
