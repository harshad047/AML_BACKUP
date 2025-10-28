import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})

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
    private router: Router
  ) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });

    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

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
      }
    });
  }

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
      }
    });
  }

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
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error || 'Failed to reset password. Please try again.';
        console.error('Password reset error:', error);
      }
    });
  }

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
  }
}
