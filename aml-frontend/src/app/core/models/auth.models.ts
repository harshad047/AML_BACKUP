export interface Address {
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phone?: string;
  address?: Address;
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

export interface ForgotPasswordRequest {
  email: string;
  otp?: string; // legacy single-step support
  token?: string; // preferred two-step token
  newPassword: string;
  confirmPassword: string;
}

export interface CountryDto {
  code: string;
  name: string;
}

// Profile Management DTOs
export interface CustomerProfile {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  username: string;
  phone: string;
  address: Address;
  kycStatus: string;
  createdAt: string;
}

export interface ProfileUpdateRequest {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
}

// OTP and Authentication DTOs
export interface OtpResponse {
  sent: boolean;
  message: string;
  expiresIn?: number;
}

export interface OtpVerificationResponse {
  verified: boolean;
  message: string;
  token?: string;
}

export interface RegistrationResponse {
  success: boolean;
  message: string;
  userId?: number;
}

// Password Management DTOs
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  otp?: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  token?: string;
}

export interface ForgotPasswordVerifyResponse {
  success: boolean;
  message: string;
  token: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

// Backend Raw Response DTOs (for transformation)
export interface BackendLoginResponse {
  token?: string;
  type?: string;
  email?: string;
  username?: string;
  role?: string;
  userId?: number;
  data?: {
    token?: string;
    type?: string;
    email?: string;
    username?: string;
    role?: string;
    userId?: number;
  };
}
