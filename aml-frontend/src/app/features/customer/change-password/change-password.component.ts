import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
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
  successMessage = '';
  errorMessage = '';
  showOld = false;
  showNew = false;
  showConfirm = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    // Ensure reset token exists; if not, redirect to verify step
    const token = sessionStorage.getItem('reset_token');
    if (!token) {
      this.router.navigate(['/customer/change-password/verify']);
      return;
    }
    this.initForm();
  }

  private initForm(): void {
    this.passwordForm = this.fb.group({
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

  changePassword(): void {
    if (this.passwordForm.valid) {
      this.isLoading = true;
      this.successMessage = '';
      this.errorMessage = '';

      const formValue = this.passwordForm.value;
      const token = sessionStorage.getItem('reset_token') || '';
      const payload = {
        oldPassword: formValue.oldPassword,
        newPassword: formValue.newPassword,
        token
      };

      this.authService.changePassword(payload).subscribe({
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
            sessionStorage.removeItem('reset_token');
            this.router.navigate(['/customer/profile']);
          }, 2000);
        },
        error: (error: any) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Failed to change password. Please try again.';
          console.error('Password change error:', error);
          // Show toast to inform wrong current password
          this.toast.error('Current password is wrong', 6000);
          // Redirect to verify step if change failed
          this.router.navigate(['/customer/change-password/verify']);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  resetForm(): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.initForm();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.passwordForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  toggleOldVisibility(): void { this.showOld = !this.showOld; }
  toggleNewVisibility(): void { this.showNew = !this.showNew; }
  toggleConfirmVisibility(): void { this.showConfirm = !this.showConfirm; }

  private markFormGroupTouched(): void {
    Object.keys(this.passwordForm.controls).forEach(key => {
      const control = this.passwordForm.get(key);
      control?.markAsTouched();
    });
  }
}
