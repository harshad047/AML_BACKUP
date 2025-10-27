import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../../core/services/auth.service';

interface Address {
  street?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface CustomerProfile {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  username: string;
  phone: string;
  address: Address;
  kycStatus: string;
  createdAt: string;
}

interface ProfileUpdateRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  phone: string;
  address: Address;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container-fluid mt-4">
      <div class="row">
        <div class="col-12">
          <div class="card shadow-lg">
            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h4 class="mb-0">
                <i class="fas fa-user me-2"></i>
                {{ isEditMode ? 'Update Profile' : 'My Profile' }}
              </h4>
              <button
                *ngIf="!isEditMode && profileData"
                class="btn btn-light btn-sm"
                (click)="toggleEditMode()"
              >
                <i class="fas fa-edit me-1"></i>
                Edit Profile
              </button>
            </div>
            <div class="card-body">
              <!-- Loading State -->
              <div *ngIf="isLoading" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading profile information...</p>
              </div>

              <!-- Profile Display Mode - Grid Layout -->
              <div *ngIf="!isLoading && !isEditMode && profileData" class="profile-display">
                <div class="row g-4">
                  <!-- Personal Information Card -->
                  <div class="col-lg-4 col-md-6">
                    <div class="info-card">
                      <h5 class="text-primary section-title">
                        <i class="fas fa-id-card me-2"></i>
                        Personal Information
                      </h5>
                      <div class="info-item">
                        <strong>Full Name:</strong>
                        <span>{{ profileData.firstName }} {{ profileData.middleName ? profileData.middleName + ' ' : '' }}{{ profileData.lastName }}</span>
                      </div>
                      <div class="info-item">
                        <strong>Email:</strong>
                        <span>{{ profileData.email }}</span>
                      </div>
                      <div class="info-item">
                        <strong>Username:</strong>
                        <span>{{ profileData.username }}</span>
                      </div>
                      <div class="info-item">
                        <strong>Phone:</strong>
                        <span>{{ profileData.phone }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Address Information Card -->
                  <div class="col-lg-4 col-md-6">
                    <div class="info-card">
                      <h5 class="text-primary section-title">
                        <i class="fas fa-map-marker-alt me-2"></i>
                        Address Information
                      </h5>
                      <div class="info-item">
                        <strong>Street:</strong>
                        <span>{{ profileData.address.street || 'N/A' }}</span>
                      </div>
                      <div class="info-item">
                        <strong>City:</strong>
                        <span>{{ profileData.address.city }}</span>
                      </div>
                      <div class="info-item">
                        <strong>State:</strong>
                        <span>{{ profileData.address.state }}</span>
                      </div>
                      <div class="info-item">
                        <strong>Country:</strong>
                        <span>{{ profileData.address.country }}</span>
                      </div>
                      <div class="info-item">
                        <strong>Postal Code:</strong>
                        <span>{{ profileData.address.postalCode }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Account Information Card -->
                  <div class="col-lg-4 col-md-6">
                    <div class="info-card">
                      <h5 class="text-primary section-title">
                        <i class="fas fa-info-circle me-2"></i>
                        Account Information
                      </h5>
                      <div class="info-item">
                        <strong>KYC Status:</strong>
                        <span class="badge"
                              [ngClass]="{
                                'bg-success': profileData.kycStatus === 'APPROVED',
                                'bg-warning': profileData.kycStatus === 'PENDING',
                                'bg-danger': profileData.kycStatus === 'REJECTED'
                              }">
                          {{ profileData.kycStatus }}
                        </span>
                      </div>
                      <div class="info-item">
                        <strong>Member Since:</strong>
                        <span>{{ formatDate(profileData.createdAt) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Profile Edit Mode -->
              <form *ngIf="isEditMode" [formGroup]="profileForm" (ngSubmit)="onSubmit()">
                <!-- Personal Information -->
                <div class="row">
                  <div class="col-md-4 mb-3">
                    <label for="firstName" class="form-label">First Name</label>
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
                    <label for="lastName" class="form-label">Last Name</label>
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

                <div class="mb-3">
                  <label for="phone" class="form-label">Phone Number</label>
                  <input
                    type="tel"
                    class="form-control"
                    id="phone"
                    formControlName="phone"
                    placeholder="+1234567890"
                    [class.is-invalid]="isFieldInvalid('phone')"
                  >
                  <div class="invalid-feedback" *ngIf="isFieldInvalid('phone')">
                    Please enter a valid phone number
                  </div>
                </div>

                <!-- Address Information -->
                <h5 class="mt-4 mb-3">Address Information</h5>
                <div class="mb-3">
                  <label for="street" class="form-label">Street Address</label>
                  <input
                    type="text"
                    class="form-control"
                    id="street"
                    formControlName="street"
                    placeholder="Street address"
                  >
                </div>

                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="city" class="form-label">City</label>
                    <input
                      type="text"
                      class="form-control"
                      id="city"
                      formControlName="city"
                      [class.is-invalid]="isFieldInvalid('city')"
                    >
                    <div class="invalid-feedback" *ngIf="isFieldInvalid('city')">
                      City is required
                    </div>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label for="state" class="form-label">State</label>
                    <input
                      type="text"
                      class="form-control"
                      id="state"
                      formControlName="state"
                      [class.is-invalid]="isFieldInvalid('state')"
                    >
                    <div class="invalid-feedback" *ngIf="isFieldInvalid('state')">
                      State is required
                    </div>
                  </div>
                </div>

                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="postalCode" class="form-label">Postal Code</label>
                    <input
                      type="text"
                      class="form-control"
                      id="postalCode"
                      formControlName="postalCode"
                      [class.is-invalid]="isFieldInvalid('postalCode')"
                    >
                    <div class="invalid-feedback" *ngIf="isFieldInvalid('postalCode')">
                      Postal code is required
                    </div>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label for="country" class="form-label">Country</label>
                    <input
                      type="text"
                      class="form-control"
                      id="country"
                      formControlName="country"
                      [class.is-invalid]="isFieldInvalid('country')"
                    >
                    <div class="invalid-feedback" *ngIf="isFieldInvalid('country')">
                      Country is required
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="d-flex gap-2">
                  <button
                    type="submit"
                    class="btn btn-primary"
                    [disabled]="profileForm.invalid || isLoading"
                  >
                    <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                    {{ isLoading ? 'Updating...' : 'Update Profile' }}
                  </button>
                  <button
                    type="button"
                    class="btn btn-secondary"
                    (click)="toggleEditMode()"
                    [disabled]="isLoading"
                  >
                    Cancel
                  </button>
                </div>

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
              </form>

              <!-- Error State -->
              <div *ngIf="!isLoading && errorMessage && !profileData" class="text-center py-4">
                <div class="alert alert-danger">
                  <i class="fas fa-exclamation-triangle me-2"></i>
                  {{ errorMessage }}
                </div>
                <button class="btn btn-primary" (click)="loadProfileData()">
                  <i class="fas fa-refresh me-2"></i>
                  Try Again
                </button>
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
      box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.1);
      background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
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

    /* Responsive adjustments */
    @media (max-width: 576px) {
      .card-body {
        padding: 1rem;
      }

      .section-title {
        font-size: 1.1rem;
      }

      .btn {
        font-size: 0.9rem;
        padding: 0.6rem 1.2rem;
      }

      .btn-primary {
        font-size: 0.9rem;
        padding: 0.6rem 1.2rem;
      }

      .btn-secondary {
        font-size: 0.9rem;
        padding: 0.6rem 1.2rem;
      }
    }

    .form-control {
      border-radius: 0.5rem;
      border: 2px solid #e9ecef;
      transition: all 0.3s ease;
    }

    .form-control:focus {
      border-color: #0d6efd;
      box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
      transform: translateY(-1px);
    }

    .btn-primary {
      border-radius: 0.5rem;
      padding: 0.75rem 2rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: linear-gradient(135deg, #0d6efd 0%, #0056b3 100%);
      border: none;
      transition: all 0.3s ease;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 0.5rem 1rem rgba(13, 110, 253, 0.3);
    }

    .btn-secondary {
      border-radius: 0.5rem;
      padding: 0.75rem 2rem;
      font-weight: 600;
      border: 2px solid #6c757d;
      background: transparent;
      color: #6c757d;
      transition: all 0.3s ease;
    }

    .btn-secondary:hover {
      background: #6c757d;
      color: white;
      transform: translateY(-2px);
    }

    .spinner-border-sm {
      width: 1rem;
      height: 1rem;
    }

    .profile-display {
      padding: 1rem 0;
    }

    .info-card {
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      border-radius: 1rem;
      padding: 1.5rem;
      height: 100%;
      box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      border: 1px solid rgba(0, 0, 0, 0.05);
    }

    .info-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.15);
    }

    .info-item {
      display: flex;
      flex-direction: column;
      padding: 0.75rem 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .info-item:hover {
      background: rgba(13, 110, 253, 0.05);
      border-radius: 0.5rem;
      padding: 0.75rem 0.5rem;
      margin: 0 -0.5rem;
    }

    .info-item strong {
      color: #495057;
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-item span {
      color: #212529;
      font-size: 1rem;
      font-weight: 500;
    }

    .badge {
      font-size: 0.8em;
      padding: 0.5rem 1rem;
      border-radius: 1rem;
      font-weight: 600;
    }

    .alert {
      border-radius: 0.5rem;
      border: none;
      font-weight: 500;
    }

    .alert-success {
      background: linear-gradient(135deg, #d1edff 0%, #bee5eb 100%);
      color: #0c5460;
    }

    .alert-danger {
      background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
      color: #721c24;
    }

    .text-primary {
      color: #0d6efd !important;
      font-weight: 600;
    }

    .section-title {
      position: relative;
      margin-bottom: 1.5rem;
    }

    .section-title::after {
      content: '';
      position: absolute;
      bottom: -0.5rem;
      left: 0;
      width: 3rem;
      height: 3px;
      background: linear-gradient(135deg, #0d6efd 0%, #0056b3 100%);
      border-radius: 2px;
    }

    .form-label {
      font-weight: 600;
      color: #495057;
      margin-bottom: 0.5rem;
    }

    .invalid-feedback {
      font-size: 0.875rem;
      font-weight: 500;
    }

    .loading-container {
      text-align: center;
      padding: 3rem;
    }

    .loading-container .spinner-border {
      width: 3rem;
      height: 3rem;
    }

    .error-container {
      text-align: center;
      padding: 2rem;
    }

    .btn-outline-primary {
      border: 2px solid #0d6efd;
      color: #0d6efd;
      background: transparent;
      border-radius: 0.5rem;
      padding: 0.75rem 2rem;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .btn-outline-primary:hover {
      background: #0d6efd;
      color: white;
      transform: translateY(-2px);
    }
  `]
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  profileData: CustomerProfile | null = null;
  currentUser: User | null = null;
  isLoading = false;
  isEditMode = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadProfileData();
  }

  loadProfileData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.getProfile().subscribe({
      next: (response: any) => {
        this.isLoading = false;
        // Handle both direct response and wrapped response formats
        const profileData = response.data || response;

        if (profileData && (profileData.id || profileData.firstName)) {
          this.profileData = profileData;
          if (this.isEditMode) {
            this.initForm(profileData);
          }
        } else {
          console.warn('Profile data not found in response:', response);
          this.errorMessage = 'Profile data not found. Please try again.';
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Failed to load profile data:', error);
        this.errorMessage = error.error?.message || 'Failed to load profile data. Please try again.';
      }
    });
  }

  private initForm(profileData: CustomerProfile): void {
    this.profileForm = this.fb.group({
      firstName: [profileData.firstName, [Validators.required]],
      middleName: [profileData.middleName || ''],
      lastName: [profileData.lastName, [Validators.required]],
      phone: [profileData.phone, [Validators.required, Validators.pattern(/^[\+]?[0-9\-\s\(\)]+$/)]],
      street: [profileData.address.street || ''],
      city: [profileData.address.city, [Validators.required]],
      state: [profileData.address.state, [Validators.required]],
      postalCode: [profileData.address.postalCode, [Validators.required]],
      country: [profileData.address.country, [Validators.required]]
    });
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    this.successMessage = '';
    this.errorMessage = '';

    if (this.isEditMode && this.profileData) {
      this.initForm(this.profileData);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.isLoading = true;
      this.successMessage = '';
      this.errorMessage = '';

      const formValue = this.profileForm.value;
      const profileData: ProfileUpdateRequest = {
        firstName: formValue.firstName,
        middleName: formValue.middleName || undefined,
        lastName: formValue.lastName,
        phone: formValue.phone,
        address: {
          street: formValue.street,
          city: formValue.city,
          state: formValue.state,
          postalCode: formValue.postalCode,
          country: formValue.country
        }
      };

      this.authService.updateProfile(profileData).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.successMessage = 'Profile updated successfully!';
          // Refresh profile data
          this.loadProfileData();
          // Exit edit mode after successful update
          setTimeout(() => {
            this.toggleEditMode();
          }, 1500);
        },
        error: (error: any) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Failed to update profile. Please try again.';
          console.error('Profile update error:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.profileForm.controls).forEach(key => {
      const control = this.profileForm.get(key);
      control?.markAsTouched();
    });
  }
}
