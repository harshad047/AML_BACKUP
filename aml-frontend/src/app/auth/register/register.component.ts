import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

// Custom Validators
class CustomValidators {
  // Validate name fields - no digits, minimum length 2
  static noDigits(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Don't validate empty values, use Validators.required for that
      }
      const hasDigit = /\d/.test(control.value);
      return hasDigit ? { hasDigit: true } : null;
    };
  }

  // Validate minimum age (18 years)
  static minimumAge(minAge: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const birthDate = new Date(control.value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age >= minAge ? null : { minimumAge: { requiredAge: minAge, actualAge: age } };
    };
  }

  // Validate phone number - exactly 10 digits
  static phoneNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const phoneRegex = /^\d{10}$/;
      return phoneRegex.test(control.value) ? null : { invalidPhone: true };
    };
  }

  // Validate email with proper regex
  static emailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return emailRegex.test(control.value) ? null : { invalidEmail: true };
    };
  }

  // Strong password validator
  static strongPassword(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      const password = control.value;
      const errors: any = {};
      
      // Check minimum length
      if (password.length < 8) {
        errors.minLength = true;
      }
      
      // Check for uppercase letter
      if (!/[A-Z]/.test(password)) {
        errors.noUppercase = true;
      }
      
      // Check for lowercase letter
      if (!/[a-z]/.test(password)) {
        errors.noLowercase = true;
      }
      
      // Check for digit
      if (!/\d/.test(password)) {
        errors.noDigit = true;
      }
      
      // Check for special character
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.noSpecialChar = true;
      }
      
      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

  // Confirm password match validator
  static passwordMatch(passwordField: string, confirmPasswordField: string): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const password = formGroup.get(passwordField)?.value;
      const confirmPassword = formGroup.get(confirmPasswordField)?.value;
      
      if (!confirmPassword) {
        return null;
      }
      
      return password === confirmPassword ? null : { passwordMismatch: true };
    };
  }
}

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
  currentStep = 1; // Multi-step: 1=Personal, 2=Contact, 3=Address
  totalSteps = 3;
  otpSent = false;
  showPassword = false;
  showConfirmPassword = false;
  showTermsModal = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.registerForm = this.fb.group({
      firstName: ['', [
        Validators.required,
        Validators.minLength(2),
        CustomValidators.noDigits()
      ]],
      middleName: ['', [
        CustomValidators.noDigits()
      ]],
      lastName: ['', [
        Validators.required,
        Validators.minLength(2),
        CustomValidators.noDigits()
      ]],
      email: ['', [
        Validators.required,
        CustomValidators.emailValidator()
      ]],
      phone: ['', [
        Validators.required,
        CustomValidators.phoneNumber()
      ]],
      dob: ['', [
        Validators.required,
        CustomValidators.minimumAge(18)
      ]],
      password: ['', [
        Validators.required,
        CustomValidators.strongPassword()
      ]],
      confirmPassword: ['', [
        Validators.required
      ]],
      street: [''],
      city: [''],
      state: [''],
      country: [''],
      postalCode: [''],
      agreeToTerms: [false, Validators.requiredTrue]
    }, {
      validators: CustomValidators.passwordMatch('password', 'confirmPassword')
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (!field || !field.errors || !field.touched) {
      return '';
    }

    const errors = field.errors;
    
    // Name field errors
    if (errors['required']) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (errors['minlength']) {
      return `${this.getFieldLabel(fieldName)} must be at least ${errors['minlength'].requiredLength} characters`;
    }
    if (errors['hasDigit']) {
      return `${this.getFieldLabel(fieldName)} cannot contain digits`;
    }
    
    // Email errors
    if (errors['invalidEmail']) {
      return 'Please enter a valid email address (e.g., user@example.com)';
    }
    
    // Phone errors
    if (errors['invalidPhone']) {
      return 'Phone number must be exactly 10 digits';
    }
    
    // Date of birth errors
    if (errors['minimumAge']) {
      return `You must be at least ${errors['minimumAge'].requiredAge} years old`;
    }
    
    // Password errors
    if (errors['minLength']) {
      return 'Password must be at least 8 characters long';
    }
    if (errors['noUppercase']) {
      return 'Password must contain at least one uppercase letter';
    }
    if (errors['noLowercase']) {
      return 'Password must contain at least one lowercase letter';
    }
    if (errors['noDigit']) {
      return 'Password must contain at least one digit';
    }
    if (errors['noSpecialChar']) {
      return 'Password must contain at least one special character (!@#$%^&*...)';
    }
    
    return 'Invalid input';
  }

  getConfirmPasswordError(): string {
    const confirmPassword = this.registerForm.get('confirmPassword');
    if (!confirmPassword || !confirmPassword.touched) {
      return '';
    }
    
    if (confirmPassword.errors?.['required']) {
      return 'Please confirm your password';
    }
    
    if (this.registerForm.errors?.['passwordMismatch']) {
      return 'Passwords do not match';
    }
    
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'First name',
      middleName: 'Middle name',
      lastName: 'Last name',
      email: 'Email',
      phone: 'Phone number',
      dob: 'Date of birth',
      password: 'Password'
    };
    return labels[fieldName] || fieldName;
  }

  getPasswordStrength(): string {
    const password = this.registerForm.get('password')?.value;
    if (!password) return '';
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    
    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
  }

  // Multi-step navigation methods
  nextStep(): void {
    if (this.isCurrentStepValid()) {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      this.markCurrentStepTouched();
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goToStep(step: number): void {
    // Only allow going to previous steps or current step
    if (step <= this.currentStep && step >= 1) {
      this.currentStep = step;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  isCurrentStepValid(): boolean {
    const step1Fields = ['firstName', 'middleName', 'lastName', 'dob', 'phone'];
    const step2Fields = ['email', 'password', 'confirmPassword'];
    const step3Fields = ['street', 'city', 'state', 'country', 'postalCode', 'agreeToTerms'];

    let fieldsToValidate: string[] = [];
    
    if (this.currentStep === 1) {
      fieldsToValidate = step1Fields;
    } else if (this.currentStep === 2) {
      fieldsToValidate = step2Fields;
    } else if (this.currentStep === 3) {
      fieldsToValidate = step3Fields;
    }

    // Check if all required fields in current step are valid
    for (const fieldName of fieldsToValidate) {
      const field = this.registerForm.get(fieldName);
      if (field && field.invalid && fieldName !== 'middleName') {
        // middleName is optional, skip validation
        if (fieldName === 'street' || fieldName === 'city' || fieldName === 'state' || 
            fieldName === 'country' || fieldName === 'postalCode') {
          // Address fields are optional
          continue;
        }
        return false;
      }
    }

    // Check form-level validators (like password match)
    if (this.currentStep === 2 && this.registerForm.errors?.['passwordMismatch']) {
      return false;
    }

    return true;
  }

  markCurrentStepTouched(): void {
    const step1Fields = ['firstName', 'middleName', 'lastName', 'dob', 'phone'];
    const step2Fields = ['email', 'password', 'confirmPassword'];
    const step3Fields = ['street', 'city', 'state', 'country', 'postalCode', 'agreeToTerms'];

    let fieldsToTouch: string[] = [];
    
    if (this.currentStep === 1) {
      fieldsToTouch = step1Fields;
    } else if (this.currentStep === 2) {
      fieldsToTouch = step2Fields;
    } else if (this.currentStep === 3) {
      fieldsToTouch = step3Fields;
    }

    fieldsToTouch.forEach(fieldName => {
      const field = this.registerForm.get(fieldName);
      field?.markAsTouched();
    });
  }

  getStepTitle(): string {
    switch (this.currentStep) {
      case 1: return 'Personal Information';
      case 2: return 'Contact & Security';
      case 3: return 'Address Information';
      default: return '';
    }
  }

  getStepIcon(): string {
    switch (this.currentStep) {
      case 1: return '👤';
      case 2: return '📧';
      case 3: return '🏠';
      default: return '';
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  openTermsModal(): void {
    this.showTermsModal = true;
  }

  closeTermsModal(): void {
    this.showTermsModal = false;
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
          this.toastService.error(errorMessage, 6000);
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
