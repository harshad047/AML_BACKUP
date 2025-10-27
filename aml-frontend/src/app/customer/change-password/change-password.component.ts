import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface PasswordChangeRequest {
  oldPassword: string;
  newPassword: string;
  otp: string;
}

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {
  passwordForm!: FormGroup;
  isLoading = false;
  otpSent = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.passwordForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(group: FormGroup) {
    const newPassword = group.get('newPassword');
    const confirmPassword = group.get('confirmPassword');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }

    return null;
  }

  sendOtp(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.sendChangePasswordOtp().subscribe({
      next: (response: any) => {
        this.isLoading = false;
        // Handle both direct response and wrapped response formats
        const responseData = response.data || response;

        if ((responseData && responseData.sent) || (response && response.sent)) {
          this.otpSent = true;
          this.successMessage = 'Verification code sent to your email successfully!';
        } else {
          this.errorMessage = 'Failed to send verification code. Please try again.';
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to send verification code. Please try again.';
        console.error('OTP send error:', error);
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.valid) {
      this.isLoading = true;
      this.successMessage = '';
      this.errorMessage = '';

      const formValue = this.passwordForm.value;
      const passwordData: PasswordChangeRequest = {
        oldPassword: formValue.oldPassword,
        newPassword: formValue.newPassword,
        otp: formValue.otp
      };

      this.authService.changePassword(passwordData).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          // Handle both direct response and wrapped response formats
          const responseData = response.data || response;

          if (responseData?.message || response?.message) {
            this.successMessage = responseData.message || response.message || 'Password changed successfully!';
          } else {
            this.successMessage = 'Password changed successfully!';
          }

          // Redirect to profile page after successful password change
          setTimeout(() => {
            this.router.navigate(['/customer/profile']);
          }, 2000);
        },
        error: (error: any) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Failed to change password. Please try again.';
          console.error('Password change error:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  resetForm(): void {
    this.otpSent = false;
    this.successMessage = '';
    this.errorMessage = '';
    this.initForm();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.passwordForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  private markFormGroupTouched(): void {
    Object.keys(this.passwordForm.controls).forEach(key => {
      const control = this.passwordForm.get(key);
      control?.markAsTouched();
    });
  }
}
