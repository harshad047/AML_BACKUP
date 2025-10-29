import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verify-otp.component.html',
  styleUrls: ['./verify-otp.component.css']
})
export class VerifyOtpComponent {
  isLoading = false;
  success = '';
  error = '';
  constructor(private auth: AuthService, private router: Router) {}

  sendOtp() {
    this.isLoading = true;
    this.error = '';
    this.auth.sendChangePasswordOtp().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const payload = res?.data || res;
        if (payload?.sent !== false) {
          this.success = 'Verification code sent to your email.';
          // proceed to enter-otp step
          this.router.navigate(['/customer/change-password/enter-otp']);
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
}
