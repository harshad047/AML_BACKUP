import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
          <div class="card shadow-lg">
            <div class="card-body p-5">
              <div class="text-center mb-4">
                <h2 class="fw-bold text-primary">AML System</h2>
                <p class="text-muted">Sign in to your account</p>
              </div>

              <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
                <div class="mb-3">
                  <label for="email" class="form-label">Email address</label>
                  <input
                    type="email"
                    class="form-control form-control-lg"
                    id="email"
                    formControlName="email"
                    placeholder="Enter your email"
                    [class.is-invalid]="isFieldInvalid('email')"
                  >
                  <div class="invalid-feedback" *ngIf="isFieldInvalid('email')">
                    Please enter a valid email address
                  </div>
                </div>

                <div class="mb-3">
                  <label for="password" class="form-label">Password</label>
                  <input
                    type="password"
                    class="form-control form-control-lg"
                    id="password"
                    formControlName="password"
                    placeholder="Enter your password"
                    [class.is-invalid]="isFieldInvalid('password')"
                  >
                  <div class="invalid-feedback" *ngIf="isFieldInvalid('password')">
                    Password is required
                  </div>
                </div>

                <!-- reCAPTCHA placeholder -->
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
                    [disabled]="loginForm.invalid || isLoading"
                  >
                    <span *ngIf="isLoading" class="loading-spinner me-2"></span>
                    {{ isLoading ? 'Signing in...' : 'Sign In' }}
                  </button>
                </div>

                <div class="text-center mt-3">
                  <a href="#" class="text-decoration-none">Forgot password?</a>
                </div>
              </form>

              <div class="text-center mt-4">
                <p class="mb-0">Don't have an account?
                  <a routerLink="/register" class="text-decoration-none fw-bold">Sign up</a>
                </p>
              </div>
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
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
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
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const credentials = this.loginForm.value;

      // First, authenticate the user credentials
      this.authService.login(credentials).subscribe({
        next: (response) => {
          this.isLoading = false;
          // Directly navigate to dashboard based on role
          const user = response?.user;
          if (user) {
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
            this.errorMessage = 'Login succeeded but user data is missing.';
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Login failed. Please try again.';
          console.error('Login error:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }
}
