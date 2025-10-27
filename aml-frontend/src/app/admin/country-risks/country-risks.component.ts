import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService, CountryRiskDto } from '../../core/services/admin.service';

@Component({
  selector: 'app-country-risks',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './country-risks.component.html',
  styleUrls: ['./country-risks.component.css']
})
export class CountryRisksComponent implements OnInit {
  countryRisks: CountryRiskDto[] = [];
  loading = false;
  error = '';
  success = '';
  
  showCreateForm = false;
  countryForm: FormGroup;
  savingCountry = false;
  editingCountry: CountryRiskDto | null = null;

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder
  ) {
    this.countryForm = this.fb.group({
      countryCode: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(3), Validators.pattern(/^[A-Z]+$/)]],
      countryName: ['', [Validators.required, Validators.maxLength(100)]],
      riskScore: [50, [Validators.required, Validators.min(0), Validators.max(100)]],
      notes: [''],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadCountryRisks();
  }

  loadCountryRisks(): void {
    this.loading = true;
    this.error = '';
    
    this.adminService.getCountryRisks().subscribe({
      next: (countries) => {
        this.countryRisks = countries;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load country risks';
        this.loading = false;
      }
    });
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.editingCountry = null;
    if (!this.showCreateForm) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.countryForm.reset({
      riskScore: 50,
      isActive: true
    });
  }

  editCountry(country: CountryRiskDto): void {
    this.editingCountry = country;
    this.showCreateForm = true;
    
    this.countryForm.patchValue({
      countryCode: country.countryCode,
      countryName: country.countryName,
      riskScore: country.riskScore,
      notes: country.notes,
      isActive: country.isActive
    });
  }

  onSaveCountry(): void {
    if (this.countryForm.invalid) return;

    this.savingCountry = true;
    this.error = '';
    this.success = '';

    const countryDto: CountryRiskDto = this.countryForm.value;

    const request = this.editingCountry
      ? this.adminService.updateCountryRisk(this.editingCountry.id!, countryDto)
      : this.adminService.createCountryRisk(countryDto);

    request.subscribe({
      next: (country) => {
        this.success = `Country "${country.countryName}" ${this.editingCountry ? 'updated' : 'added'} successfully!`;
        this.savingCountry = false;
        this.resetForm();
        this.showCreateForm = false;
        this.editingCountry = null;
        this.loadCountryRisks();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to save country risk';
        this.savingCountry = false;
      }
    });
  }

  deleteCountry(country: CountryRiskDto): void {
    if (!confirm(`Delete country risk profile for "${country.countryName}"?`)) return;

    this.adminService.deleteCountryRisk(country.id!).subscribe({
      next: () => {
        this.success = `Country "${country.countryName}" deleted successfully`;
        this.loadCountryRisks();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to delete country risk';
      }
    });
  }

  getRiskLevelBadgeClass(riskScore: number): string {
    if (riskScore >= 80) return 'bg-danger';
    if (riskScore >= 50) return 'bg-warning';
    if (riskScore >= 20) return 'bg-info';
    return 'bg-success';
  }

  getRiskLevel(riskScore: number): string {
    if (riskScore >= 80) return 'HIGH';
    if (riskScore >= 50) return 'MEDIUM';
    if (riskScore >= 20) return 'LOW';
    return 'VERY_LOW';
  }
}
