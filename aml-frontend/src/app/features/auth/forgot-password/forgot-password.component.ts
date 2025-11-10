import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
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
export class ForgotPasswordComponent implements OnDestroy {
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

  // Password visibility
  showNewPassword = false;
  showConfirmPassword = false;
  
  // Verified state
  verifiedEmail = '';
  verifiedOtp = '';
  resetToken = '';
  
  // Resend OTP timer
  resendTimer = 0;
  resendInterval: any = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern('^[0-9]*$')]]
    });

    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8), this.strongPasswordValidator]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  // Strong password validator: 1 uppercase, 1 lowercase, 1 digit, 1 special character
  strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) {
      return null;
    }

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);

    const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar;

    return !passwordValid ? {
      strongPassword: {
        hasUpperCase,
        hasLowerCase,
        hasNumeric,
        hasSpecialChar
      }
    } : null;
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  // Helper for template validation
  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const control = form.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  // Password visibility toggles
  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Step 1: Send OTP to email
  sendOtp(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';
    const email = (this.emailForm.get('email')?.value || '').trim().toLowerCase();

    // Single API call that checks email existence and sends OTP if exists
    this.http.post(`${this.API_URL}/forgot-password/send-otp`, null, { params: { email } }).subscribe({
      next: (response: any) => {
        console.log('OTP Response:', response); // Debug log
        if (response.sent === true) {
          this.success = response.message || 'OTP sent successfully. Please check your inbox.';
          this.verifiedEmail = email;
          this.currentStep = 'otp';
          this.startResendTimer();
        } else {
          this.error = response.message || 'No account found with this email address.';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to send OTP. Please check the email and try again.';
        this.loading = false;
      }
    });
  }

  // Step 2: Verify OTP
  verifyOtp(): void {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';
    const otp = this.otpForm.get('otp')?.value;

    this.http.post(`${this.API_URL}/forgot-password/verify-otp`, null, { params: { email: this.verifiedEmail, otp } }).subscribe({
      next: (response: any) => {
        this.success = response.message || 'OTP verified successfully!';
        this.verifiedOtp = otp;
        this.resetToken = response.resetToken || '';
        this.currentStep = 'password';
        this.loading = false;
        this.error = '';
      },
      error: (err) => {
        this.error = err.error?.error || 'Invalid OTP. Please try again.';
        this.loading = false;
        this.success = '';
      }
    });
  }

  // Step 3: Reset Password
  resetPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';
    const { newPassword, confirmPassword } = this.passwordForm.value;
    
    const resetRequest: ForgotPasswordResetRequest = {
      email: this.verifiedEmail,
      otp: '',
      newPassword,
      confirmPassword
    } as any;
    // Prefer token-based reset (as backend issues a short-lived token upon OTP verify)
    (resetRequest as any).token = this.resetToken;

    this.http.post(`${this.API_URL}/forgot-password/reset`, resetRequest).subscribe({
      next: (response: any) => {
        this.success = response.message || 'Password reset successfully. Redirecting to login...';
        this.loading = false;
        this.error = '';
        setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to reset password. Please try again.';
        this.loading = false;
        this.success = '';
      }
    });
  }

  // Navigation helpers
  goBackToEmail(): void {
    this.currentStep = 'email';
    this.error = '';
    this.success = '';
    this.otpForm.reset();
  }

  resendOtp(): void {
    if (this.resendTimer > 0) {
      return; // Don't allow resend if timer is still running
    }
    
    this.otpForm.reset();
    this.error = '';
    this.success = '';
    
    // Use a separate loading flag or directly call API without affecting verify button
    const email = this.verifiedEmail;
    
    this.http.post(`${this.API_URL}/forgot-password/send-otp`, null, { params: { email } }).subscribe({
      next: (response: any) => {
        if (response.sent === true) {
          this.success = 'OTP resent successfully. Please check your inbox.';
          this.startResendTimer();
        } else {
          this.error = response.message || 'Failed to resend OTP.';
        }
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to resend OTP. Please try again.';
      }
    });
  }
  
  startResendTimer(): void {
    this.resendTimer = 60; // 1 minute = 60 seconds
    
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
    }
    
    this.resendInterval = setInterval(() => {
      this.resendTimer--;
      if (this.resendTimer <= 0) {
        clearInterval(this.resendInterval);
        this.resendInterval = null;
      }
    }, 1000);
  }
  
  ngOnDestroy(): void {
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
    }
  }
}