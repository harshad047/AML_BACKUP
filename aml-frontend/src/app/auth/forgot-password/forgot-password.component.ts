import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface ForgotPasswordResetRequest {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  private readonly API_URL = 'http://localhost:8080/api/auth';
  
  // Flow state
  currentStep: 'email' | 'otp' | 'password' = 'email';
  
  // Forms
  emailForm: FormGroup;
  otpForm: FormGroup;
  passwordForm: FormGroup;
  
  // State
  loading = false;
  error = '';
  success = '';
  
  // Verified state (kept after OTP verification)
  verifiedEmail = '';
  verifiedOtp = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });

    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  // Step 1: Send OTP to email
  sendOtp(): void {
    if (this.emailForm.invalid) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    const email = this.emailForm.get('email')?.value;

    this.http.post(`${this.API_URL}/forgot-password/send-otp`, null, {
      params: { email }
    }).subscribe({
      next: (response: any) => {
        this.success = response.message || 'OTP sent successfully';
        this.verifiedEmail = email; // Store email for later use
        this.currentStep = 'otp';
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to send OTP';
        this.loading = false;
      }
    });
  }

  // Step 2: Verify OTP
  verifyOtp(): void {
    if (this.otpForm.invalid) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    const otp = this.otpForm.get('otp')?.value;

    this.http.post(`${this.API_URL}/forgot-password/verify-otp`, null, {
      params: { 
        email: this.verifiedEmail,
        otp: otp
      }
    }).subscribe({
      next: (response: any) => {
        this.success = response.message || 'OTP verified successfully';
        this.verifiedOtp = otp; // Store OTP for password reset
        this.currentStep = 'password';
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Invalid OTP';
        this.loading = false;
      }
    });
  }

  // Step 3: Reset Password (only new passwords visible to user)
  resetPassword(): void {
    if (this.passwordForm.invalid) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    const formData = this.passwordForm.value;
    
    // Backend still needs email + OTP, but user doesn't see them
    const resetRequest: ForgotPasswordResetRequest = {
      email: this.verifiedEmail,        // Hidden from user
      otp: this.verifiedOtp,           // Hidden from user  
      newPassword: formData.newPassword,
      confirmPassword: formData.confirmPassword
    };

    this.http.post(`${this.API_URL}/forgot-password/reset`, resetRequest).subscribe({
      next: (response: any) => {
        this.success = response.message || 'Password reset successfully';
        this.loading = false;
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to reset password';
        this.loading = false;
      }
    });
  }

  // Navigation helpers
  goBackToEmail(): void {
    this.currentStep = 'email';
    this.error = '';
    this.success = '';
  }

  goBackToOtp(): void {
    this.currentStep = 'otp';
    this.error = '';
    this.success = '';
  }

  resendOtp(): void {
    this.sendOtp();
  }
}
