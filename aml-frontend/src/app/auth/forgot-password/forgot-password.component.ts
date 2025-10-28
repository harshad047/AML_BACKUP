import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

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
  // Form groups
  emailForm: FormGroup;
  otpForm: FormGroup;
  resetForm: FormGroup;
  
  // State
  currentStep: 'email' | 'otp' | 'reset' = 'email';
  email: string = '';
  otp: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;
  otpTimer: number = 0;
  private timerInterval: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });

    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  // Password match validator
  passwordMatchValidator(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  // Get field error message
  getFieldError(form: FormGroup, field: string): string {
    const control = form.get(field);
    if (control?.hasError('required')) {
      return 'This field is required';
    } else if (control?.hasError('email')) {
      return 'Please enter a valid email';
    } else if (control?.hasError('minlength')) {
      return `Minimum length is ${control.errors?.['minlength'].requiredLength} characters`;
    } else if (control?.hasError('maxlength')) {
      return `Maximum length is ${control.errors?.['maxlength'].requiredLength} characters`;
    } else if (form.hasError('passwordMismatch') && field === 'confirmPassword') {
      return 'Passwords do not match';
    }
    return '';
  }

  // Step 1: Send OTP to email
  onSendOtp() {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.email = this.emailForm.value.email.trim().toLowerCase();

    this.authService.sendOtp(this.email).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.successMessage = 'OTP has been sent to your email.';
        this.currentStep = 'otp';
        this.startOtpTimer();
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error || 'Failed to send OTP. Please try again.';
      }
    });
  }

  // Step 2: Verify OTP
  onVerifyOtp() {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.otp = this.otpForm.value.otp;

    this.authService.verifyOtp(this.email, this.otp).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.successMessage = 'OTP verified successfully. Please set your new password.';
        this.currentStep = 'reset';
      },
      error: (error: any) => {
        console.error('OTP verification error:', error);
        this.isLoading = false;
        this.errorMessage = error.error?.error || 'Invalid or expired OTP. Please try again.';
      }
    });
  }

  // Step 3: Reset password
  onResetPassword() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    // Validate that we have a verified OTP
    if (!this.otp) {
      this.errorMessage = 'Please verify your OTP first.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const resetData: ForgotPasswordResetRequest = {
      email: this.email,
      otp: this.otp,
      newPassword: this.resetForm.value.newPassword,
      confirmPassword: this.resetForm.value.confirmPassword
    };

    this.authService.resetPassword(resetData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.successMessage = 'Password has been reset successfully. Redirecting to login...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error || 'Failed to reset password. Please try again.';
      }
    });
  }

  // Resend OTP
  onResendOtp() {
    if (this.otpTimer > 0) {
      return; // Prevent multiple rapid requests
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.sendOtp(this.email).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.successMessage = 'New OTP has been sent to your email.';
        this.startOtpTimer();
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error || 'Failed to resend OTP. Please try again.';
      }
    });
  }

  // Navigation
  goBack() {
    if (this.currentStep === 'otp') {
      this.currentStep = 'email';
      this.otpForm.reset();
      this.stopOtpTimer();
    } else if (this.currentStep === 'reset') {
      this.currentStep = 'otp';
      this.resetForm.reset();
    }
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Toggle password visibility
  togglePasswordVisibility(field: 'new' | 'confirm') {
    if (field === 'new') {
      this.showNewPassword = !this.showNewPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  // Start OTP countdown timer
  private startOtpTimer() {
    this.otpTimer = 60; // 60 seconds
    this.timerInterval = setInterval(() => {
      this.otpTimer--;
      if (this.otpTimer <= 0) {
        this.stopOtpTimer();
      }
    }, 1000);
  }

  // Stop OTP timer
  private stopOtpTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.otpTimer = 0;
  }

  // Clean up on component destroy
  ngOnDestroy() {
    this.stopOtpTimer();
  }
}
