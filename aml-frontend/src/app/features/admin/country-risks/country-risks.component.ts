import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { CountryRiskDto } from '../../../core/models/admin.models';
import { ToastService } from '../../../core/services/toast.service';

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
  
  // All 195 countries with their codes
  allCountries = [
    { code: 'AF', name: 'Afghanistan' },
    { code: 'AL', name: 'Albania' },
    { code: 'DZ', name: 'Algeria' },
    { code: 'AD', name: 'Andorra' },
    { code: 'AO', name: 'Angola' },
    { code: 'AG', name: 'Antigua and Barbuda' },
    { code: 'AR', name: 'Argentina' },
    { code: 'AM', name: 'Armenia' },
    { code: 'AU', name: 'Australia' },
    { code: 'AT', name: 'Austria' },
    { code: 'AZ', name: 'Azerbaijan' },
    { code: 'BS', name: 'Bahamas' },
    { code: 'BH', name: 'Bahrain' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'BB', name: 'Barbados' },
    { code: 'BY', name: 'Belarus' },
    { code: 'BE', name: 'Belgium' },
    { code: 'BZ', name: 'Belize' },
    { code: 'BJ', name: 'Benin' },
    { code: 'BT', name: 'Bhutan' },
    { code: 'BO', name: 'Bolivia' },
    { code: 'BA', name: 'Bosnia and Herzegovina' },
    { code: 'BW', name: 'Botswana' },
    { code: 'BR', name: 'Brazil' },
    { code: 'BN', name: 'Brunei' },
    { code: 'BG', name: 'Bulgaria' },
    { code: 'BF', name: 'Burkina Faso' },
    { code: 'BI', name: 'Burundi' },
    { code: 'CV', name: 'Cabo Verde' },
    { code: 'KH', name: 'Cambodia' },
    { code: 'CM', name: 'Cameroon' },
    { code: 'CA', name: 'Canada' },
    { code: 'CF', name: 'Central African Republic' },
    { code: 'TD', name: 'Chad' },
    { code: 'CL', name: 'Chile' },
    { code: 'CN', name: 'China' },
    { code: 'CO', name: 'Colombia' },
    { code: 'KM', name: 'Comoros' },
    { code: 'CG', name: 'Congo' },
    { code: 'CD', name: 'Congo (Democratic Republic)' },
    { code: 'CR', name: 'Costa Rica' },
    { code: 'HR', name: 'Croatia' },
    { code: 'CU', name: 'Cuba' },
    { code: 'CY', name: 'Cyprus' },
    { code: 'CZ', name: 'Czech Republic' },
    { code: 'CI', name: 'Côte d\'Ivoire' },
    { code: 'DK', name: 'Denmark' },
    { code: 'DJ', name: 'Djibouti' },
    { code: 'DM', name: 'Dominica' },
    { code: 'DO', name: 'Dominican Republic' },
    { code: 'EC', name: 'Ecuador' },
    { code: 'EG', name: 'Egypt' },
    { code: 'SV', name: 'El Salvador' },
    { code: 'GQ', name: 'Equatorial Guinea' },
    { code: 'ER', name: 'Eritrea' },
    { code: 'EE', name: 'Estonia' },
    { code: 'SZ', name: 'Eswatini' },
    { code: 'ET', name: 'Ethiopia' },
    { code: 'FJ', name: 'Fiji' },
    { code: 'FI', name: 'Finland' },
    { code: 'FR', name: 'France' },
    { code: 'GA', name: 'Gabon' },
    { code: 'GM', name: 'Gambia' },
    { code: 'GE', name: 'Georgia' },
    { code: 'DE', name: 'Germany' },
    { code: 'GH', name: 'Ghana' },
    { code: 'GR', name: 'Greece' },
    { code: 'GD', name: 'Grenada' },
    { code: 'GT', name: 'Guatemala' },
    { code: 'GN', name: 'Guinea' },
    { code: 'GW', name: 'Guinea-Bissau' },
    { code: 'GY', name: 'Guyana' },
    { code: 'HT', name: 'Haiti' },
    { code: 'HN', name: 'Honduras' },
    { code: 'HU', name: 'Hungary' },
    { code: 'IS', name: 'Iceland' },
    { code: 'IN', name: 'India' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'IR', name: 'Iran' },
    { code: 'IQ', name: 'Iraq' },
    { code: 'IE', name: 'Ireland' },
    { code: 'IL', name: 'Israel' },
    { code: 'IT', name: 'Italy' },
    { code: 'JM', name: 'Jamaica' },
    { code: 'JP', name: 'Japan' },
    { code: 'JO', name: 'Jordan' },
    { code: 'KZ', name: 'Kazakhstan' },
    { code: 'KE', name: 'Kenya' },
    { code: 'KI', name: 'Kiribati' },
    { code: 'KP', name: 'Korea (North)' },
    { code: 'KR', name: 'Korea (South)' },
    { code: 'KW', name: 'Kuwait' },
    { code: 'KG', name: 'Kyrgyzstan' },
    { code: 'LA', name: 'Laos' },
    { code: 'LV', name: 'Latvia' },
    { code: 'LB', name: 'Lebanon' },
    { code: 'LS', name: 'Lesotho' },
    { code: 'LR', name: 'Liberia' },
    { code: 'LY', name: 'Libya' },
    { code: 'LI', name: 'Liechtenstein' },
    { code: 'LT', name: 'Lithuania' },
    { code: 'LU', name: 'Luxembourg' },
    { code: 'MG', name: 'Madagascar' },
    { code: 'MW', name: 'Malawi' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'MV', name: 'Maldives' },
    { code: 'ML', name: 'Mali' },
    { code: 'MT', name: 'Malta' },
    { code: 'MH', name: 'Marshall Islands' },
    { code: 'MR', name: 'Mauritania' },
    { code: 'MU', name: 'Mauritius' },
    { code: 'MX', name: 'Mexico' },
    { code: 'FM', name: 'Micronesia' },
    { code: 'MD', name: 'Moldova' },
    { code: 'MC', name: 'Monaco' },
    { code: 'MN', name: 'Mongolia' },
    { code: 'ME', name: 'Montenegro' },
    { code: 'MA', name: 'Morocco' },
    { code: 'MZ', name: 'Mozambique' },
    { code: 'MM', name: 'Myanmar' },
    { code: 'NA', name: 'Namibia' },
    { code: 'NR', name: 'Nauru' },
    { code: 'NP', name: 'Nepal' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'NI', name: 'Nicaragua' },
    { code: 'NE', name: 'Niger' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'MK', name: 'North Macedonia' },
    { code: 'NO', name: 'Norway' },
    { code: 'OM', name: 'Oman' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'PW', name: 'Palau' },
    { code: 'PS', name: 'Palestine' },
    { code: 'PA', name: 'Panama' },
    { code: 'PG', name: 'Papua New Guinea' },
    { code: 'PY', name: 'Paraguay' },
    { code: 'PE', name: 'Peru' },
    { code: 'PH', name: 'Philippines' },
    { code: 'PL', name: 'Poland' },
    { code: 'PT', name: 'Portugal' },
    { code: 'QA', name: 'Qatar' },
    { code: 'RO', name: 'Romania' },
    { code: 'RU', name: 'Russia' },
    { code: 'RW', name: 'Rwanda' },
    { code: 'KN', name: 'Saint Kitts and Nevis' },
    { code: 'LC', name: 'Saint Lucia' },
    { code: 'VC', name: 'Saint Vincent and the Grenadines' },
    { code: 'WS', name: 'Samoa' },
    { code: 'SM', name: 'San Marino' },
    { code: 'ST', name: 'Sao Tome and Principe' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'SN', name: 'Senegal' },
    { code: 'RS', name: 'Serbia' },
    { code: 'SC', name: 'Seychelles' },
    { code: 'SL', name: 'Sierra Leone' },
    { code: 'SG', name: 'Singapore' },
    { code: 'SK', name: 'Slovakia' },
    { code: 'SI', name: 'Slovenia' },
    { code: 'SB', name: 'Solomon Islands' },
    { code: 'SO', name: 'Somalia' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'SS', name: 'South Sudan' },
    { code: 'ES', name: 'Spain' },
    { code: 'LK', name: 'Sri Lanka' },
    { code: 'SD', name: 'Sudan' },
    { code: 'SR', name: 'Suriname' },
    { code: 'SE', name: 'Sweden' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'SY', name: 'Syria' },
    { code: 'TJ', name: 'Tajikistan' },
    { code: 'TZ', name: 'Tanzania' },
    { code: 'TH', name: 'Thailand' },
    { code: 'TL', name: 'Timor-Leste' },
    { code: 'TG', name: 'Togo' },
    { code: 'TO', name: 'Tonga' },
    { code: 'TT', name: 'Trinidad and Tobago' },
    { code: 'TN', name: 'Tunisia' },
    { code: 'TR', name: 'Turkey' },
    { code: 'TM', name: 'Turkmenistan' },
    { code: 'TV', name: 'Tuvalu' },
    { code: 'UG', name: 'Uganda' },
    { code: 'UA', name: 'Ukraine' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' },
    { code: 'UY', name: 'Uruguay' },
    { code: 'UZ', name: 'Uzbekistan' },
    { code: 'VU', name: 'Vanuatu' },
    { code: 'VA', name: 'Vatican City' },
    { code: 'VE', name: 'Venezuela' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'YE', name: 'Yemen' },
    { code: 'ZM', name: 'Zambia' },
    { code: 'ZW', name: 'Zimbabwe' }
  ];
  
  availableCountries: { code: string; name: string }[] = [];
  
  // Search and pagination
  searchTerm = '';
  riskLevelFilter = 'ALL';
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
  
  // Delete confirmation modal
  showDeleteModal = false;
  countryToDelete: CountryRiskDto | null = null;
  
  // Add country modal
  showAddModal = false;
  selectedCountryName = '';
  selectedCountryCode = '';

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder,
    private toastService: ToastService
  ) {
    this.countryForm = this.fb.group({
      countryCode: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(3), Validators.pattern(/^[A-Z]+$/)]],
      countryName: ['', [Validators.required, Validators.maxLength(100)]],
      riskScore: [50, [Validators.required, Validators.min(0), Validators.max(100)]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadCountryRisks();
    this.updateAvailableCountries();
  }

  loadCountryRisks(): void {
    this.loading = true;
    this.error = '';
    
    this.adminService.getCountryRisks().subscribe({
      next: (countries) => {
        this.countryRisks = countries;
        this.filteredCountries = [...countries];
        this.updatePagination();
        this.updateAvailableCountries();
        this.loading = false;
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to load country risks');
        this.loading = false;
      }
    });
  }
  
  updateAvailableCountries(): void {
    // Filter out countries that already exist in the database
    const existingCodes = this.countryRisks.map(c => c.countryCode.toUpperCase());
    this.availableCountries = this.allCountries.filter(
      country => !existingCodes.includes(country.code)
    );
  }

  filterCountries(): void {
    let filtered = [...this.countryRisks];
    
    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(country =>
        country.countryCode?.toLowerCase().includes(term) ||
        country.countryName?.toLowerCase().includes(term) ||
        country.riskScore?.toString().includes(term) ||
        this.getRiskLevel(country.riskScore).toLowerCase().includes(term)
      );
    }
    
    // Apply risk level filter
    if (this.riskLevelFilter !== 'ALL') {
      filtered = filtered.filter(c => this.getRiskLevel(c.riskScore) === this.riskLevelFilter);
    }
    
    this.filteredCountries = filtered;
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
    if (!this.showCreateForm) {
      this.editingCountry = null;
      this.resetForm();
    }
  }
  
  openAddModal(): void {
    this.showAddModal = true;
    this.selectedCountryName = '';
    this.selectedCountryCode = '';
    this.countryForm.reset({
      riskScore: 50
    });
  }
  
  closeAddModal(): void {
    this.showAddModal = false;
    this.selectedCountryName = '';
    this.selectedCountryCode = '';
    this.resetForm();
  }
  
  onCountrySelect(event: any): void {
    const selectedCountry = this.allCountries.find(c => c.name === event.target.value);
    if (selectedCountry) {
      this.selectedCountryName = selectedCountry.name;
      this.selectedCountryCode = selectedCountry.code;
      
      // Check if country already exists
      const exists = this.countryRisks.some(
        c => c.countryCode.toUpperCase() === selectedCountry.code
      );
      
      if (exists) {
        this.toastService.error(`${selectedCountry.name} is already in the database!`, 4000);
        this.selectedCountryName = '';
        this.selectedCountryCode = '';
      } else {
        this.countryForm.patchValue({
          countryCode: selectedCountry.code,
          countryName: selectedCountry.name
        });
      }
    }
  }
  
  onAddCountry(): void {
    if (!this.selectedCountryName || !this.selectedCountryCode) {
      this.toastService.error('Please select a country', 3000);
      return;
    }
    
    if (this.countryForm.invalid) {
      this.toastService.error('Please fill all required fields', 3000);
      return;
    }

    this.savingCountry = true;
    const countryDto: CountryRiskDto = this.countryForm.getRawValue();

    this.adminService.createCountryRisk(countryDto).subscribe({
      next: (country) => {
        this.toastService.success(`Country "${country.countryName}" added successfully!`, 5000);
        this.savingCountry = false;
        this.closeAddModal();
        this.loadCountryRisks();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to add country risk');
        this.savingCountry = false;
      }
    });
  }

  resetForm(): void {
    this.countryForm.reset({
      riskScore: 50
    });
    // Re-enable fields
    this.countryForm.get('countryCode')?.enable();
    this.countryForm.get('countryName')?.enable();
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
    
    // Disable country code and name fields when editing
    this.countryForm.get('countryCode')?.disable();
    this.countryForm.get('countryName')?.disable();
  }

  onSaveCountry(): void {
    if (this.countryForm.invalid) return;

    this.savingCountry = true;
    this.error = '';
    this.success = '';

    // Use getRawValue() to get values from disabled fields too
    const countryDto: CountryRiskDto = this.countryForm.getRawValue();

    const request = this.editingCountry
      ? this.adminService.updateCountryRisk(this.editingCountry.id!, countryDto)
      : this.adminService.createCountryRisk(countryDto);

    request.subscribe({
      next: (country) => {
        this.toastService.success(`Country "${country.countryName}" ${this.editingCountry ? 'updated' : 'added'} successfully!`, 5000);
        this.savingCountry = false;
        this.resetForm();
        this.showCreateForm = false;
        this.editingCountry = null;
        this.loadCountryRisks();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to save country risk');
        this.savingCountry = false;
      }
    });
  }

  openDeleteModal(country: CountryRiskDto): void {
    this.countryToDelete = country;
    this.showDeleteModal = true;
  }
  
  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.countryToDelete = null;
  }
  
  confirmDelete(): void {
    if (!this.countryToDelete) return;

    this.adminService.deleteCountryRisk(this.countryToDelete.id!).subscribe({
      next: () => {
        this.toastService.success(`Country "${this.countryToDelete!.countryName}" deleted successfully`, 5000);
        this.closeDeleteModal();
        this.loadCountryRisks();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to delete country risk');
        this.closeDeleteModal();
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
  
  // Stats Methods
  getHighRiskCount(): number {
    return this.countryRisks.filter(c => c.riskScore >= 80).length;
  }
  
  getMediumRiskCount(): number {
    return this.countryRisks.filter(c => c.riskScore >= 50 && c.riskScore < 80).length;
  }
  
  getLowRiskCount(): number {
    return this.countryRisks.filter(c => c.riskScore < 50).length;
  }
  
  getTotalCount(): number {
    return this.countryRisks.length;
  }
}
