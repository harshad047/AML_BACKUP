import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService, ApiResponse } from './auth.service';
import { environment } from '../../../environments/environment';
import { CustomerProfileDto } from '../models/customer.models';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient, private auth: AuthService) {}

  getProfile(): Observable<ApiResponse<CustomerProfileDto>> {
    return this.http.get<ApiResponse<CustomerProfileDto>>(
      `${this.API_URL}/customer/profile`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  getKycStatus(): Observable<ApiResponse<{ status: string }>> {
    return this.http.get<ApiResponse<{ status: string }>>(
      `${this.API_URL}/customer/kyc-status`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  getMyAlerts(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(
      `${this.API_URL}/customer/alerts`,
      { headers: this.auth.getAuthHeaders() }
    );
  }
}
