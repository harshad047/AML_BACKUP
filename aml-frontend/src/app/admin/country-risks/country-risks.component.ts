import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { AdminService, CountryRiskDto } from '../../core/services/admin.service';

@Component({
  selector: 'app-country-risks',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './country-risks.component.html',
  styleUrls: ['./country-risks.component.css']
})
export class CountryRisksComponent implements OnInit {
  countryRisks: CountryRiskDto[] = [];
  filteredCountries: CountryRiskDto[] = [];
  paginatedCountries: CountryRiskDto[] = [];
  loading = false;
  error = '';
  success = '';
  
  // Search and pagination
  searchTerm = '';
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  Math = Math;
  
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
        this.filteredCountries = [...countries];
        this.updatePagination();
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load country risks';
        this.loading = false;
      }
    });
  }

  filterCountries(): void {
    if (!this.searchTerm.trim()) {
      this.filteredCountries = [...this.countryRisks];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredCountries = this.countryRisks.filter(country =>
        country.countryCode?.toLowerCase().includes(term) ||
        country.countryName?.toLowerCase().includes(term) ||
        country.riskScore?.toString().includes(term) ||
        this.getRiskLevel(country.riskScore).toLowerCase().includes(term)
      );
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredCountries.sort((a: any, b: any) => {
      const aVal = a[column];
      const bVal = b[column];
      if (aVal === bVal) return 0;
      const comparison = aVal > bVal ? 1 : -1;
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });

    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredCountries.length / this.pageSize);
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedCountries = this.filteredCountries.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, this.currentPage - 2);
      const end = Math.min(this.totalPages, start + maxVisible - 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
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
