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
  template: `
    <div class="container-fluid mt-3 px-2">
      <div class="row justify-content-center">
        <div class="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
          <div class="card shadow-lg">
            <div class="card-header bg-primary text-white">
              <h4 class="mb-0 text-center">
                <i class="fas fa-key me-2"></i>
                Change Password
              </h4>
            </div>
            <div class="card-body p-3 p-md-4">
              <!-- Step 1: Send OTP -->
              <div *ngIf="!otpSent" class="text-center">
                <div class="mb-4">
                  <i class="fas fa-envelope fa-3x text-primary mb-3"></i>
                  <h5 class="mb-3">Verify Your Identity</h5>
                  <p class="text-muted small">We'll send a verification code to your registered email address</p>
                </div>
                <button
                  class="btn btn-primary btn-lg w-100"
                  (click)="sendOtp()"
                  [disabled]="isLoading"
                >
                  <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                  {{ isLoading ? 'Sending...' : 'Send Verification Code' }}
                </button>
              </div>

              <!-- Step 2: Enter OTP and New Password -->
              <form *ngIf="otpSent" [formGroup]="passwordForm" (ngSubmit)="changePassword()">
                <div class="alert alert-info">
                  <i class="fas fa-info-circle me-2"></i>
                  <small>Verification code has been sent to your registered email address</small>
                </div>

                <!-- OTP Input -->
                <div class="mb-3">
                  <label for="otp" class="form-label">Verification Code</label>
                  <input
                    type="text"
                    class="form-control form-control-lg"
                    id="otp"
                    formControlName="otp"
                    placeholder="Enter 6-digit code"
                    maxlength="6"
                    [class.is-invalid]="isFieldInvalid('otp')"
                  >
                  <div class="invalid-feedback" *ngIf="isFieldInvalid('otp')">
                    Please enter the verification code
                  </div>
                </div>

                <!-- Current Password -->
                <div class="mb-3">
                  <label for="oldPassword" class="form-label">Current Password</label>
                  <input
                    type="password"
                    class="form-control form-control-lg"
                    id="oldPassword"
                    formControlName="oldPassword"
                    placeholder="Enter current password"
                    [class.is-invalid]="isFieldInvalid('oldPassword')"
                  >
                  <div class="invalid-feedback" *ngIf="isFieldInvalid('oldPassword')">
                    Current password is required
                  </div>
                </div>

                <!-- New Password -->
                <div class="mb-3">
                  <label for="newPassword" class="form-label">New Password</label>
                  <input
                    type="password"
                    class="form-control form-control-lg"
                    id="newPassword"
                    formControlName="newPassword"
                    placeholder="Enter new password"
                    [class.is-invalid]="isFieldInvalid('newPassword')"
                  >
                  <div class="invalid-feedback" *ngIf="isFieldInvalid('newPassword')">
                    <span *ngIf="passwordForm.get('newPassword')?.errors?.['required']">New password is required</span>
                    <span *ngIf="passwordForm.get('newPassword')?.errors?.['minlength']">Password must be at least 8 characters</span>
                  </div>
                </div>

                <!-- Confirm New Password -->
                <div class="mb-3">
                  <label for="confirmPassword" class="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    class="form-control form-control-lg"
                    id="confirmPassword"
                    formControlName="confirmPassword"
                    placeholder="Confirm new password"
                    [class.is-invalid]="isFieldInvalid('confirmPassword')"
                  >
                  <div class="invalid-feedback" *ngIf="isFieldInvalid('confirmPassword')">
                    <span *ngIf="passwordForm.get('confirmPassword')?.errors?.['required']">Please confirm your password</span>
                    <span *ngIf="passwordForm.get('confirmPassword')?.errors?.['mismatch']">Passwords do not match</span>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="d-flex flex-column flex-sm-row gap-2">
                  <button
                    type="submit"
                    class="btn btn-primary flex-fill"
                    [disabled]="passwordForm.invalid || isLoading"
                  >
                    <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                    {{ isLoading ? 'Changing...' : 'Change Password' }}
                  </button>
                  <button
                    type="button"
                    class="btn btn-secondary flex-fill"
                    (click)="resetForm()"
                  >
                    Cancel
                  </button>
                </div>
              </form>

              <!-- Success/Error Messages -->
              <div class="mt-3" *ngIf="successMessage">
                <div class="alert alert-success">
                  <i class="fas fa-check-circle me-2"></i>
                  {{ successMessage }}
                </div>
              </div>

              <div class="mt-3" *ngIf="errorMessage">
                <div class="alert alert-danger">
                  <i class="fas fa-exclamation-circle me-2"></i>
                  {{ errorMessage }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container-fluid {
      min-height: 100vh;
      padding: 0.5rem;
    }

    .card {
      border: none;
      border-radius: 1rem;
      box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.1);
      background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
      margin: 1rem 0;
    }

    .card-header {
      background: linear-gradient(135deg, #0d6efd 0%, #0056b3 100%);
      border-radius: 1rem 1rem 0 0 !important;
      border: none;
      padding: 1.5rem;
    }

    .card-body {
      padding: 1.5rem;
    }

    .form-control {
      border-radius: 0.5rem;
      border: 2px solid #e9ecef;
      transition: all 0.3s ease;
      padding: 0.75rem 1rem;
      font-size: 1rem;
    }

    .form-control:focus {
      border-color: #0d6efd;
      box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
      transform: translateY(-1px);
    }

    .form-control-lg {
      padding: 1rem 1.25rem;
      font-size: 1.1rem;
    }

    .btn-primary {
      border-radius: 0.5rem;
      padding: 0.75rem 1.5rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: linear-gradient(135deg, #0d6efd 0%, #0056b3 100%);
      border: none;
      transition: all 0.3s ease;
      font-size: 1rem;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 0.5rem 1rem rgba(13, 110, 253, 0.3);
    }

    .btn-secondary {
      border-radius: 0.5rem;
      padding: 0.75rem 1.5rem;
      font-weight: 600;
      border: 2px solid #6c757d;
      background: transparent;
      color: #6c757d;
      transition: all 0.3s ease;
      font-size: 1rem;
    }

    .btn-secondary:hover {
      background: #6c757d;
      color: white;
      transform: translateY(-2px);
    }

    .btn-lg {
      padding: 1rem 2rem;
      font-size: 1.1rem;
    }

    .btn-block {
      width: 100%;
    }

    .spinner-border-sm {
      width: 1rem;
      height: 1rem;
    }

    .alert {
      border-radius: 0.5rem;
      border: none;
      font-weight: 500;
      padding: 1rem 1.5rem;
      font-size: 0.9rem;
    }

    .alert-info {
      background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
      color: #0c5460;
      border-left: 4px solid #17a2b8;
    }

    .alert-success {
      background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
      color: #155724;
      border-left: 4px solid #28a745;
    }

    .alert-danger {
      background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
      color: #721c24;
      border-left: 4px solid #dc3545;
    }

    .form-label {
      font-weight: 600;
      color: #495057;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }

    .invalid-feedback {
      font-size: 0.8rem;
      font-weight: 500;
      margin-top: 0.25rem;
    }

    .text-center {
      text-align: center;
    }

    .mb-3 {
      margin-bottom: 1rem !important;
    }

    .mb-4 {
      margin-bottom: 1.5rem !important;
    }

    .mt-3 {
      margin-top: 1rem !important;
    }

    .fa-3x {
      opacity: 0.7;
      margin-bottom: 1rem;
    }

    .small {
      font-size: 0.875rem;
    }

    .d-flex {
      display: flex;
    }

    .flex-column {
      flex-direction: column;
    }

    .flex-sm-row {
      flex-direction: row;
    }

    .gap-2 {
      gap: 0.5rem;
    }

    .flex-fill {
      flex: 1 1 auto;
    }

    .w-100 {
      width: 100% !important;
    }

    /* Responsive adjustments */
    @media (max-width: 576px) {
      .container-fluid {
        padding: 0.25rem;
      }

      .card {
        margin: 0.5rem 0;
      }

      .card-body {
        padding: 1rem;
      }

      .btn {
        font-size: 0.9rem;
        padding: 0.6rem 1.2rem;
      }

      .btn-lg {
        padding: 0.8rem 1.5rem;
        font-size: 1rem;
      }

      .form-control-lg {
        padding: 0.8rem 1rem;
        font-size: 1rem;
      }

      .alert {
        padding: 0.8rem 1rem;
        font-size: 0.85rem;
      }
    }

    @media (min-width: 577px) and (max-width: 768px) {
      .card-body {
        padding: 1.25rem;
      }
    }
  `]
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
