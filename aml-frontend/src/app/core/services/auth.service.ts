import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, timeout } from 'rxjs';
import { Router } from '@angular/router';
import { User, LoginRequest, AuthResponse, RegistrationRequest, ApiResponse } from '../models/auth.models';

// Re-export types for easier importing
export type { User, LoginRequest, AuthResponse, RegistrationRequest, ApiResponse };

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8080/api';
  private readonly TOKEN_KEY = 'aml_token';
  private readonly USER_KEY = 'aml_user';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadStoredAuth();
  }

  private getStoredAuthResponse(): AuthResponse | null {
    const token = this.getToken();
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!token || !userStr) return null;
    try {
      const user: User = JSON.parse(userStr);
      return {
        token,
        user,
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
      };
    } catch {
      return null;
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<any>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        timeout(15000), // 15 second timeout for login
        map(response => this.transformBackendResponse(response)),
        tap((transformedResponse: AuthResponse) => {
          this.storeAuthData(transformedResponse);
          this.currentUserSubject.next(transformedResponse.user);
        })
      );
  }

  register(userData: RegistrationRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/register`, userData);
  }

  sendOtp(email: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/register/send-otp`, null, {
      params: { email }
    });
  }

  verifyOtp(email: string, otp: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/register/verify-otp`, null, {
      params: { email, otp }
    });
  }

  sendLoginOtp(email: string): Observable<ApiResponse<any>> {
    return this.http.post<any>(`${this.API_URL}/auth/send-login-otp`, null, {
      params: { email },
      responseType: 'text' as 'json'
    });
  }

  verifyLoginOtp(email: string, otp: string): Observable<AuthResponse> {
    return this.http.post<any>(`${this.API_URL}/auth/verify-login-otp`, null, {
      params: { email, otp }
    }).pipe(
      map((response: any) => {
        const hasToken = !!(response?.token || response?.data?.token);
        if (hasToken) {
          return this.transformBackendResponse(response);
        }
        const stored = this.getStoredAuthResponse();
        if (!stored) {
          throw new Error('Verification succeeded but no auth context available');
        }
        return stored;
      }),
      tap((auth: AuthResponse) => {
        this.storeAuthData(auth);
        this.currentUserSubject.next(auth.user);
      })
    );
  }

  getProfile(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/customer/profile`, {
      headers: this.getAuthHeaders()
    });
  }

  updateProfile(profileData: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.API_URL}/customer/profile`, profileData, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap((response) => {
        // Handle both wrapped and direct response formats
        const data = response.data || response;
        if (data && (data.id || data.firstName)) {
          // Update stored user data if profile update includes user info
          const currentUser = this.getCurrentUser();
          if (currentUser) {
            const updatedUser = { ...currentUser };
            this.currentUserSubject.next(updatedUser);
            localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
          }
        }
      })
    );
  }

  sendChangePasswordOtp(): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/customer/change-password/send-otp`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  changePassword(passwordData: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/customer/change-password`, passwordData, {
      headers: this.getAuthHeaders()
    });
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === role : false;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  private storeAuthData(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
  }

  private loadStoredAuth(): void {
    const token = this.getToken();
    const userStr = localStorage.getItem(this.USER_KEY);

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        this.logout();
      }
    }
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private transformBackendResponse(backendResponse: any): AuthResponse {
    // Backend response format:
    // { token: "jwt-token", type: "Bearer", email: "user@example.com", role: "ROLE_CUSTOMER", userId: 8 }

    // Frontend expected format:
    // { token: "jwt-token", user: User, expiresAt: string }

    const payload = backendResponse?.token ? backendResponse : backendResponse?.data ?? backendResponse;

    const role = this.mapBackendRoleToFrontend(payload?.role ?? '');
    const safeEmail: string = payload?.email ?? payload?.username ?? '';
    const nameParts = this.extractNameFromEmail(safeEmail);

    const user: User = {
      id: payload.userId,
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      email: safeEmail,
      username: safeEmail,
      role: role,
      isEnabled: true, // Default to true since backend doesn't provide this
      kycStatus: 'PENDING' // Default status
    };

    return {
      token: payload.token ?? '',
      user: user,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString() // Default 1 hour expiration
    };
  }

  private mapBackendRoleToFrontend(backendRole: string): User['role'] {
    switch (backendRole) {
      case 'ROLE_CUSTOMER':
        return 'CUSTOMER';
      case 'ROLE_OFFICER':
        return 'OFFICER';
      case 'ROLE_ADMIN':
        return 'ADMIN';
      case 'ROLE_SUPER_ADMIN':
        return 'SUPER_ADMIN';
      default:
        return 'CUSTOMER'; // Default fallback
    }
  }

  private extractNameFromEmail(email?: string): { firstName: string; lastName: string } {
    // Handle undefined/empty email gracefully
    if (!email || typeof email !== 'string') {
      return { firstName: 'User', lastName: '' };
    }
    const usernamePart = email.includes('@') ? email.split('@')[0] : email;
    if (!usernamePart) {
      return { firstName: 'User', lastName: '' };
    }
    const parts = usernamePart.split('_').filter(Boolean);
    if (parts.length >= 2) {
      return {
        firstName: this.capitalizeFirstLetter(parts[0]),
        lastName: this.capitalizeFirstLetter(parts[1])
      };
    }
    return {
      firstName: this.capitalizeFirstLetter(usernamePart),
      lastName: ''
    };
  }

  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
}
