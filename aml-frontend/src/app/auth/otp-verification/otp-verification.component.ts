import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-otp-verification',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
          <div class="card shadow-lg">
            <div class="card-body p-5">
              <div class="text-center mb-4">
                <h2 class="fw-bold text-primary">Verify OTP</h2>
                <p class="text-muted">Enter the verification code sent to your email</p>
                <small class="text-muted">{{ email }}</small>
              </div>

              <form [formGroup]="otpForm" (ngSubmit)="onSubmit()">
                <div class="mb-3">
                  <label for="otp" class="form-label">Verification Code</label>
                  <input
                    type="text"
                    class="form-control form-control-lg text-center"
                    id="otp"
                    formControlName="otp"
                    placeholder="Enter 6-digit code"
                    maxlength="6"
                    [class.is-invalid]="isFieldInvalid('otp')"
                    style="letter-spacing: 0.5em; font-size: 1.2em;"
                  >
                  <div class="invalid-feedback" *ngIf="isFieldInvalid('otp')">
                    Please enter a valid 6-digit verification code
                  </div>
                </div>

                <div class="d-grid">
                  <button
                    type="submit"
                    class="btn btn-primary btn-lg"
                    [disabled]="otpForm.invalid || isLoading"
                  >
                    <span *ngIf="isLoading" class="loading-spinner me-2"></span>
                    {{ isLoading ? 'Verifying...' : 'Verify & Login' }}
                  </button>
                </div>

                <div class="text-center mt-3">
                  <button
                    type="button"
                    class="btn btn-link"
                    (click)="resendOtp()"
                    [disabled]="isResendDisabled"
                  >
                    {{ isResendDisabled ? 'Resend in ' + countdown + 's' : 'Resend Code' }}
                  </button>
                </div>

                <div class="text-center mt-2">
                  <button
                    type="button"
                    class="btn btn-link text-decoration-none"
                    (click)="goBackToLogin()"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      border: none;
      border-radius: 1rem;
    }

    .form-control:focus {
      border-color: #0d6efd;
      box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
    }

    .btn-primary {
      border-radius: 0.5rem;
    }

    .loading-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #ffffff;
      border-top: 2px solid transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .btn-link {
      color: #6c757d;
    }

    .btn-link:hover {
      color: #0d6efd;
      text-decoration: none;
    }
  `]
})
export class OtpVerificationComponent implements OnInit, OnDestroy {
  otpForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  email = '';
  isResendDisabled = false;
  countdown = 30;
  private countdownInterval?: ReturnType<typeof setInterval>;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();

    // Get email from route params or navigation state
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
    });

    // Also check navigation state
    const state = history.state;
    if (state && state.email) {
      this.email = state.email;
    }

    if (!this.email) {
      // If no email provided, redirect back to login
      this.router.navigate(['/login']);
      return;
    }

    // Start countdown for resend button
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  private initForm(): void {
    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.otpForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.otpForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const otp = this.otpForm.value.otp;

      this.authService.verifyLoginOtp(this.email, otp).subscribe({
        next: (response) => {
          this.isLoading = false;
          // The auth service already handles storing auth data and setting current user
          // If we get here, the OTP verification was successful
          if (response && response.user) {
            // Navigate to dashboard based on user role
            const user = response.user;
            switch (user.role) {
              case 'CUSTOMER':
                this.router.navigate(['/customer']);
                break;
              case 'OFFICER':
                this.router.navigate(['/compliance']);
                break;
              case 'ADMIN':
              case 'SUPER_ADMIN':
                this.router.navigate(['/admin']);
                break;
              default:
                this.router.navigate(['/']);
            }
          } else {
            this.errorMessage = 'Invalid verification code. Please try again.';
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Verification failed. Please try again.';
          console.error('OTP verification error:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  resendOtp(): void {
    if (this.isResendDisabled) return;

    this.authService.sendLoginOtp(this.email).subscribe({
      next: (response: any) => {
        this.startCountdown();
        alert('Verification code sent to your email.');
      },
      error: (error: any) => {
        console.error('Resend OTP error:', error);
        alert('Failed to resend verification code. Please try again.');
      }
    });
  }

  goBackToLogin(): void {
    this.router.navigate(['/login']);
  }

  private startCountdown(): void {
    this.isResendDisabled = true;
    this.countdown = 30;

    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.isResendDisabled = false;
        if (this.countdownInterval) {
          clearInterval(this.countdownInterval);
        }
      }
    }, 1000);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.otpForm.controls).forEach(key => {
      const control = this.otpForm.get(key);
      control?.markAsTouched();
    });
  }
}
