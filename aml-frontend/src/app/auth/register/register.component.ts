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
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
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

      // Prepare registration data matching backend RegistrationRequest
      const registrationData = {
        firstName: this.registerForm.value.firstName,
        middleName: this.registerForm.value.middleName || '',
        lastName: this.registerForm.value.lastName,
        email: this.registerForm.value.email,
        phone: this.registerForm.value.phone || '',
        dob: this.registerForm.value.dob,
        password: this.registerForm.value.password,
        street: this.registerForm.value.street || '',
        city: this.registerForm.value.city || '',
        state: this.registerForm.value.state || '',
        country: this.registerForm.value.country || '',
        postalCode: this.registerForm.value.postalCode || '',
        role: 'CUSTOMER'
      };

      // Submit registration - backend will store temporarily and send OTP
      this.authService.register(registrationData).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          console.log('Registration response:', response);
          
          // Navigate to OTP verification page
          this.router.navigate(['/otp-verification'], {
            queryParams: { 
              email: registrationData.email,
              name: `${registrationData.firstName} ${registrationData.lastName}`
            }
          });
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Registration error:', error);
          const errorMessage = error.error?.error || error.error?.message || 'Registration failed. Please try again.';
          alert(errorMessage);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }
}
