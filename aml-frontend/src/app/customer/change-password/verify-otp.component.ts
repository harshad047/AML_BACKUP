import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './verify-otp.component.html',
  styleUrls: ['./verify-otp.component.css']
})
export class VerifyOtpComponent implements OnInit {
  form: FormGroup;
  isLoading = false;
  success = '';
  error = '';
  email: string = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  ngOnInit(): void {
    // Load actual registered email from profile to ensure we verify the same key that received the OTP
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

  sendOtp() {
    this.isLoading = true;
    this.error = '';
    this.auth.sendChangePasswordOtp().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const payload = res?.data || res;
        if (payload?.sent !== false) {
          this.success = 'Verification code sent to your email.';
        } else {
          this.error = payload?.message || 'Failed to send code.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Failed to send code.';
      }
    });
  }

  verify() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const email = this.email || this.auth.getCurrentUser()?.email || '';
    const otp = this.form.value.otp;
    this.isLoading = true;
    this.error = '';
    this.auth.verifyForgotPasswordOtp(email, otp).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const payload = res?.data || res;
        const token = payload?.resetToken;
        if (payload?.verified && token) {
          sessionStorage.setItem('reset_token', token);
          if (email) {
            sessionStorage.setItem('reset_email', email);
          }
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
