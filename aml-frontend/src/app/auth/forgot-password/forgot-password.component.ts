import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
<<<<<<< HEAD
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
=======
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface ForgotPasswordResetRequest {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}
>>>>>>> c961fabc4197c8dd7d87c84eced0e756297f85e9

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
<<<<<<< HEAD

export class ForgotPasswordComponent {
  currentStep: 'email' | 'otp' | 'reset' = 'email';
  emailForm: FormGroup;
  otpForm: FormGroup;
  resetForm: FormGroup;
  
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  email = '';
  verifiedOtp = ''; // Add this to preserve the verified OTP
  
  showNewPassword = false;
  showConfirmPassword = false;
  
  // Timer for OTP resend
  otpTimer = 0;
  private timerInterval: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
=======
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
>>>>>>> c961fabc4197c8dd7d87c84eced0e756297f85e9
    private router: Router
  ) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.otpForm = this.fb.group({
<<<<<<< HEAD
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });

    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
=======
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });

    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
>>>>>>> c961fabc4197c8dd7d87c84eced0e756297f85e9
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

<<<<<<< HEAD
  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  passwordMatchValidator(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  togglePasswordVisibility(field: 'new' | 'confirm') {
    if (field === 'new') {
      this.showNewPassword = !this.showNewPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  onSendOtp() {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.email = this.emailForm.value.email.trim().toLowerCase();
    console.log('Sending OTP to email:', this.email);

    this.authService.sendForgotPasswordOtp(this.email).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.message || 'If the email exists, an OTP has been sent.';
        this.currentStep = 'otp';
        this.startOtpTimer();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error || 'Failed to send OTP. Please try again.';
=======
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
>>>>>>> c961fabc4197c8dd7d87c84eced0e756297f85e9
      }
    });
  }

<<<<<<< HEAD
  onVerifyOtp() {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    const otp = this.otpForm.value.otp;
    console.log('Verifying OTP:', { email: this.email, otp: otp });

    this.authService.verifyForgotPasswordOtp(this.email, otp).subscribe({
      next: (response) => {
        console.log('OTP verification success:', response);
        this.isLoading = false;
        this.successMessage = response.message || 'OTP verified successfully';
        this.verifiedOtp = otp; // Store the verified OTP
        this.currentStep = 'reset';
        this.stopOtpTimer();
      },
      error: (error) => {
        console.error('OTP verification error:', error);
        this.isLoading = false;
        this.errorMessage = error.error?.error || 'Invalid or expired OTP. Please try again.';
=======
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
>>>>>>> c961fabc4197c8dd7d87c84eced0e756297f85e9
      }
    });
  }

<<<<<<< HEAD
  onResetPassword() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    // Validate that we have a verified OTP
    if (!this.verifiedOtp) {
      this.errorMessage = 'Please verify your OTP first.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request = {
      email: this.email,
      otp: this.verifiedOtp, // Use the stored verified OTP
      newPassword: this.resetForm.value.newPassword,
      confirmPassword: this.resetForm.value.confirmPassword
    };

    console.log('Resetting password:', { email: this.email, otp: this.verifiedOtp });

    this.authService.resetPassword(request).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.message || 'Password reset successfully';
=======
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
>>>>>>> c961fabc4197c8dd7d87c84eced0e756297f85e9
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
<<<<<<< HEAD
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error || 'Failed to reset password. Please try again.';
        console.error('Password reset error:', error);
=======
      error: (err) => {
        this.error = err.error?.error || 'Failed to reset password';
        this.loading = false;
>>>>>>> c961fabc4197c8dd7d87c84eced0e756297f85e9
      }
    });
  }

<<<<<<< HEAD
  onResendOtp() {
    if (this.otpTimer > 0) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.sendForgotPasswordOtp(this.email).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'OTP resent successfully';
        this.otpForm.reset();
        this.startOtpTimer();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error || 'Failed to resend OTP. Please try again.';
      }
    });
  }

  goBack() {
    if (this.currentStep === 'otp') {
      this.currentStep = 'email';
      this.otpForm.reset();
      this.stopOtpTimer();
    } else if (this.currentStep === 'reset') {
      this.currentStep = 'otp';
      this.resetForm.reset();
      this.verifiedOtp = ''; // Clear the verified OTP
    }
    this.errorMessage = '';
    this.successMessage = '';
  }

  private startOtpTimer() {
    this.otpTimer = 60; // 60 seconds
    this.timerInterval = setInterval(() => {
      this.otpTimer--;
      if (this.otpTimer <= 0) {
        this.stopOtpTimer();
      }
    }, 1000);
  }

  private stopOtpTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.otpTimer = 0;
  }

  getPasswordStrength(): string {
    const password = this.resetForm.get('newPassword')?.value || '';
    if (password.length === 0) return '';
    if (password.length < 8) return 'weak';
    
    let strength = 0;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    if (strength >= 3) return 'strong';
    if (strength >= 2) return 'medium';
    return 'weak';
=======
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
>>>>>>> c961fabc4197c8dd7d87c84eced0e756297f85e9
  }
}
