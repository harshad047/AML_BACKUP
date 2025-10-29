import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-enter-otp',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styles: [
    `:host { display:block; }
     .container-fluid { margin-top: 1rem; }
    `
  ],
  template: `
  <div class="container-fluid mt-3 px-2">
    <div class="row justify-content-center">
      <div class="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
        <div class="card shadow-lg">
          <div class="card-header bg-primary text-white">
            <h4 class="mb-0 text-center">
              <i class="fas fa-key me-2"></i>
              Enter Verification Code
            </h4>
          </div>
          <div class="card-body p-3 p-md-4">
            <form [formGroup]="form" (ngSubmit)="verify()">
              <div class="mb-3">
                <label class="form-label" for="otp">Verification Code</label>
                <input id="otp" type="text" class="form-control form-control-lg" placeholder="Enter 6-digit code"
                       formControlName="otp" maxlength="6"
                       [class.is-invalid]="form.get('otp')?.invalid && (form.get('otp')?.dirty || form.get('otp')?.touched)">
                <div class="invalid-feedback">Enter a valid 6-digit code</div>
              </div>
              <button class="btn btn-primary w-100" type="submit" [disabled]="form.invalid || isLoading">
                <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                Verify Code
              </button>
              <div class="text-danger small mt-3" *ngIf="error">{{ error }}</div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
  `
})
export class EnterOtpComponent implements OnInit {
  form!: FormGroup;
  isLoading = false;
  error = '';
  email = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });

    // Load email from profile to ensure we verify against the same key
    this.auth.getProfile().subscribe({
      next: (res: any) => {
        const data = res?.data || res;
        this.email = data?.email || '';
      },
      error: () => {
        this.email = '';
      }
    });
  }

  verify() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const otp = this.form.value.otp;
    const email = this.email || this.auth.getCurrentUser()?.email || '';
    this.isLoading = true;
    this.error = '';
    this.auth.verifyForgotPasswordOtp(email, otp).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const payload = res?.data || res;
        const token = payload?.resetToken;
        if (payload?.verified && token) {
          sessionStorage.setItem('reset_token', token);
          if (email) sessionStorage.setItem('reset_email', email);
          this.router.navigate(['/customer/change-password']);
        } else {
          this.error = 'Invalid code. Please try again.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Invalid or expired code.';
      }
    });
  }
}
