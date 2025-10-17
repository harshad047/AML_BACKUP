export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  role: 'CUSTOMER' | 'OFFICER' | 'ADMIN' | 'SUPER_ADMIN';
  kycStatus?: string;
  isEnabled: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  recaptchaToken?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresAt: string;
}

export interface RegistrationRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone?: string;
  dob: string;
  password: string;
  role?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  recaptchaToken?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
