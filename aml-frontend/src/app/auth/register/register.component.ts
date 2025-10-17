import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-7">
          <div class="card shadow-lg">
            <div class="card-body p-5">
              <div class="text-center mb-4">
                <h2 class="fw-bold text-primary">Create Account</h2>
                <p class="text-muted">Join our AML compliance system</p>
              </div>

              <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
                <!-- Personal Information -->
                <div class="row">
                  <div class="col-md-4 mb-3">
                    <label for="firstName" class="form-label">First Name *</label>
                    <input
                      type="text"
                      class="form-control"
                      id="firstName"
                      formControlName="firstName"
                      [class.is-invalid]="isFieldInvalid('firstName')"
                    >
                    <div class="invalid-feedback" *ngIf="isFieldInvalid('firstName')">
                      First name is required
                    </div>
                  </div>

                  <div class="col-md-4 mb-3">
                    <label for="middleName" class="form-label">Middle Name</label>
                    <input
                      type="text"
                      class="form-control"
                      id="middleName"
                      formControlName="middleName"
                    >
                  </div>

                  <div class="col-md-4 mb-3">
                    <label for="lastName" class="form-label">Last Name *</label>
                    <input
                      type="text"
                      class="form-control"
                      id="lastName"
                      formControlName="lastName"
                      [class.is-invalid]="isFieldInvalid('lastName')"
                    >
                    <div class="invalid-feedback" *ngIf="isFieldInvalid('lastName')">
                      Last name is required
                    </div>
                  </div>
                </div>

                <!-- Contact Information -->
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="email" class="form-label">Email Address *</label>
                    <input
                      type="email"
                      class="form-control"
                      id="email"
                      formControlName="email"
                      [class.is-invalid]="isFieldInvalid('email')"
                    >
                    <div class="invalid-feedback" *ngIf="isFieldInvalid('email')">
                      Please enter a valid email address
                    </div>
                  </div>

                  <div class="col-md-6 mb-3">
                    <label for="phone" class="form-label">Phone Number</label>
                    <input
                      type="tel"
                      class="form-control"
                      id="phone"
                      formControlName="phone"
                    >
                  </div>
                </div>

                <!-- Date of Birth and Password -->
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="dob" class="form-label">Date of Birth *</label>
                    <input
                      type="date"
                      class="form-control"
                      id="dob"
                      formControlName="dob"
                      [class.is-invalid]="isFieldInvalid('dob')"
                    >
                    <div class="invalid-feedback" *ngIf="isFieldInvalid('dob')">
                      Date of birth is required
                    </div>
                  </div>

                  <div class="col-md-6 mb-3">
                    <label for="password" class="form-label">Password *</label>
                    <input
                      type="password"
                      class="form-control"
                      id="password"
                      formControlName="password"
                      [class.is-invalid]="isFieldInvalid('password')"
                    >
                    <div class="invalid-feedback" *ngIf="isFieldInvalid('password')">
                      Password must be at least 8 characters long
                    </div>
                  </div>
                </div>

                <!-- Address Information -->
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="street" class="form-label">Street Address</label>
                    <input
                      type="text"
                      class="form-control"
                      id="street"
                      formControlName="street"
                    >
                  </div>

                  <div class="col-md-6 mb-3">
                    <label for="city" class="form-label">City</label>
                    <input
                      type="text"
                      class="form-control"
                      id="city"
                      formControlName="city"
                    >
                  </div>
                </div>

                <div class="row">
                  <div class="col-md-4 mb-3">
                    <label for="state" class="form-label">State</label>
                    <input
                      type="text"
                      class="form-control"
                      id="state"
                      formControlName="state"
                    >
                  </div>

                  <div class="col-md-4 mb-3">
                    <label for="country" class="form-label">Country</label>
                    <input
                      type="text"
                      class="form-control"
                      id="country"
                      formControlName="country"
                    >
                  </div>

                  <div class="col-md-4 mb-3">
                    <label for="postalCode" class="form-label">Postal Code</label>
                    <input
                      type="text"
                      class="form-control"
                      id="postalCode"
                      formControlName="postalCode"
                    >
                  </div>
                </div>

                <!-- reCAPTCHA -->
                <div class="mb-3">
                  <div class="d-flex justify-content-center">
                    <div class="border rounded p-3 bg-light" style="width: 304px; height: 78px;">
                      <small class="text-muted">reCAPTCHA placeholder</small>
                    </div>
                  </div>
                </div>

                <div class="d-grid">
                  <button
                    type="submit"
                    class="btn btn-primary btn-lg"
                    [disabled]="registerForm.invalid || isLoading"
                  >
                    <span *ngIf="isLoading" class="loading-spinner me-2"></span>
                    {{ isLoading ? 'Creating Account...' : 'Create Account' }}
                  </button>
                </div>

                <div class="text-center mt-3">
                  <p class="mb-0">Already have an account?
                    <a routerLink="/login" class="text-decoration-none fw-bold">Sign in</a>
                  </p>
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
  `]
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;
  currentStep = 1; // For multi-step registration with OTP
  otpSent = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      middleName: [''],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      dob: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      street: [''],
      city: [''],
      state: [''],
      country: [''],
      postalCode: ['']
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;

      if (!this.otpSent) {
        // Send OTP first
        this.sendOtp();
      } else {
        // Complete registration with OTP verification
        this.completeRegistration();
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private sendOtp(): void {
    const email = this.registerForm.value.email;
    this.authService.sendOtp(email).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.otpSent = true;
        // In a real implementation, you'd show an OTP input field
        alert('OTP sent to your email. Please check and verify.');
      },
      error: (error) => {
        this.isLoading = false;
        console.error('OTP send error:', error);
        alert('Failed to send OTP. Please try again.');
      }
    });
  }

  private completeRegistration(): void {
    // In a real implementation, you'd collect OTP from user input
    const otp = prompt('Please enter the OTP sent to your email:');
    if (!otp) return;

    const email = this.registerForm.value.email;

    this.authService.verifyOtp(email, otp).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Registration completed successfully
          this.router.navigate(['/login']);
          alert('Registration completed successfully! Please login with your credentials.');
        } else {
          alert('OTP verification failed. Please try again.');
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('OTP verification error:', error);
        alert('OTP verification failed. Please try again.');
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }
}
