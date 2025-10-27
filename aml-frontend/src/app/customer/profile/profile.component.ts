import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../../core/services/auth.service';

interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface CustomerProfile {
  id: number;
  username: string;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
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
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
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
