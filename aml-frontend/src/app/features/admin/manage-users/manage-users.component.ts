import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { UserDto, AdminCustomerDetailsDto } from '../../../core/models/admin.models';
import { ToastService } from '../../../core/services/toast.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.css']
})
export class ManageUsersComponent implements OnInit {
  activeTab: 'customers' | 'officers' = 'customers';
  
  // Customers
  customers: UserDto[] = [];
  filteredCustomers: UserDto[] = [];
  paginatedCustomers: UserDto[] = [];
  customerSearchTerm = '';
  customerStatusFilter = 'ALL';
  loadingCustomers = false;
  
  // Customer Pagination
  customerCurrentPage = 1;
  customerPageSize = 10;
  customerTotalPages = 1;
  
  // Officers
  officers: UserDto[] = [];
  filteredOfficers: UserDto[] = [];
  paginatedOfficers: UserDto[] = [];
  officerSearchTerm = '';
  loadingOfficers = false;
  
  // Officer Pagination
  officerCurrentPage = 1;
  officerPageSize = 10;
  officerTotalPages = 1;
  
  Math = Math;
  
  // Modals
  showCustomerDetailsModal = false;
  showBlockCustomerModal = false;
  showAddOfficerModal = false;
  showRemoveOfficerModal = false;
  
  selectedCustomer: UserDto | null = null;
  customerDetails: AdminCustomerDetailsDto | null = null;
  loadingDetails = false;
  bankAccountsExpanded = false;
  
  selectedOfficer: UserDto | null = null;
  blockReason = '';
  
  // Add Officer Form
  addOfficerForm!: FormGroup;
  submittingOfficer = false;

  constructor(
    private adminService: AdminService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initAddOfficerForm();
    this.loadCustomers();
    this.loadOfficers();
  }

  initAddOfficerForm(): void {
    this.addOfficerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required]
    });
  }

  // Tab Management
  switchTab(tab: 'customers' | 'officers'): void {
    this.activeTab = tab;
  }

  // ========== CUSTOMERS SECTION ==========
  
  loadCustomers(): void {
    this.loadingCustomers = true;
    // Load both active and blocked customers
    forkJoin({
      active: this.adminService.getActiveCustomers(),
      blocked: this.adminService.getBlockedCustomers()
    }).subscribe({
      next: ({ active, blocked }) => {
        // Mark blocked customers
        const blockedCustomers = blocked.map(u => ({ ...u, blocked: true }));
        const activeCustomers = active.map(u => ({ ...u, blocked: false }));
        
        // Combine both lists
        const allCustomers = [...activeCustomers, ...blockedCustomers];
        this.customers = allCustomers;
        this.filteredCustomers = allCustomers;
        
        // Initialize pagination immediately with basic data
        this.updateCustomerPagination();
        
        // Enrich with details
        if (allCustomers.length) {
          forkJoin(allCustomers.map(u => this.adminService.getCustomerDetails(u.id))).subscribe({
            next: (detailsList: AdminCustomerDetailsDto[]) => {
              const byId = new Map(detailsList.map(d => [d.userId, d]));
              this.customers = this.customers.map(u => {
                const d = byId.get(u.id);
                return d ? { ...u, firstName: d.firstName, lastName: d.lastName, email: d.email } : u;
              });
              this.filteredCustomers = this.customers;
              this.updateCustomerPagination();
              this.loadingCustomers = false;
            },
            error: _ => {
              // Even on error, update pagination with basic data
              this.updateCustomerPagination();
              this.loadingCustomers = false;
            }
          });
        } else {
          this.updateCustomerPagination();
          this.loadingCustomers = false;
        }
      },
      error: err => {
        this.toastService.error(err.error?.message || 'Failed to load customers');
        this.filteredCustomers = [];
        this.updateCustomerPagination();
        this.loadingCustomers = false;
      }
    });
  }

  searchCustomers(): void {
    const term = this.customerSearchTerm.toLowerCase().trim();
    let filtered = [...this.customers];
    
    // Apply search filter
    if (term) {
      filtered = filtered.filter(c =>
        c.username?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.firstName?.toLowerCase().includes(term) ||
        c.lastName?.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (this.customerStatusFilter !== 'ALL') {
      if (this.customerStatusFilter === 'ACTIVE') {
        filtered = filtered.filter(c => !c.blocked);
      } else if (this.customerStatusFilter === 'BLOCKED') {
        filtered = filtered.filter(c => c.blocked);
      }
    }
    
    this.filteredCustomers = filtered;
    this.customerCurrentPage = 1;
    this.updateCustomerPagination();
  }
  
  updateCustomerPagination(): void {
    this.customerTotalPages = Math.ceil(this.filteredCustomers.length / this.customerPageSize);
    if (this.customerCurrentPage > this.customerTotalPages) {
      this.customerCurrentPage = Math.max(1, this.customerTotalPages);
    }
    const startIndex = (this.customerCurrentPage - 1) * this.customerPageSize;
    const endIndex = startIndex + this.customerPageSize;
    this.paginatedCustomers = this.filteredCustomers.slice(startIndex, endIndex);
  }
  
  goToCustomerPage(page: number): void {
    if (page >= 1 && page <= this.customerTotalPages) {
      this.customerCurrentPage = page;
      this.updateCustomerPagination();
    }
  }
  
  onCustomerPageSizeChange(): void {
    this.customerCurrentPage = 1;
    this.updateCustomerPagination();
  }
  
  getCustomerPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    if (this.customerTotalPages <= maxVisible) {
      for (let i = 1; i <= this.customerTotalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, this.customerCurrentPage - 2);
      const end = Math.min(this.customerTotalPages, start + maxVisible - 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  }

  viewCustomerDetails(customer: UserDto): void {
    this.selectedCustomer = customer;
    this.showCustomerDetailsModal = true;
    this.loadCustomerDetails(customer.id);
  }

  loadCustomerDetails(userId: number): void {
    this.loadingDetails = true;
    this.adminService.getCustomerDetails(userId).subscribe({
      next: (details) => {
        this.customerDetails = details;
        this.loadingDetails = false;
      },
      error: (err) => {
        this.toastService.error('Failed to load customer details');
        this.loadingDetails = false;
      }
    });
  }

  openBlockCustomerModal(customer: UserDto): void {
    this.selectedCustomer = customer;
    this.blockReason = '';
    this.showBlockCustomerModal = true;
  }

  confirmBlockCustomer(): void {
    if (!this.selectedCustomer || !this.blockReason.trim()) {
      this.toastService.warning('Block reason is required');
      return;
    }

    this.adminService.blockCustomer(this.selectedCustomer.id, this.blockReason).subscribe({
      next: () => {
        this.toastService.success(`Customer ${this.selectedCustomer?.username} has been blocked successfully`, 5000);
        this.showBlockCustomerModal = false;
        this.blockReason = '';
        this.loadCustomers();
      },
      error: (err: any) => {
        this.toastService.error(err.error?.message || 'Failed to block customer');
      }
    });
  }

  reactivateCustomer(customer: UserDto): void {
    this.adminService.unblockCustomer(customer.id).subscribe({
      next: () => {
        this.toastService.success(`Customer ${customer.username} has been reactivated successfully`, 5000);
        this.loadCustomers();
      },
      error: (err: any) => {
        this.toastService.error(err.error?.message || 'Failed to reactivate customer');
      }
    });
  }

  closeCustomerDetailsModal(): void {
    this.showCustomerDetailsModal = false;
    this.selectedCustomer = null;
    this.customerDetails = null;
  }

  // ========== OFFICERS SECTION ==========
  
  loadOfficers(): void {
    this.loadingOfficers = true;
    this.adminService.getComplianceOfficers().subscribe({
      next: (officers) => {
        this.officers = officers;
        this.filteredOfficers = officers;
        this.updateOfficerPagination();
        this.loadingOfficers = false;
      },
      error: err => {
        this.toastService.error(err.error?.message || 'Failed to load officers');
        this.loadingOfficers = false;
      }
    });
  }

  searchOfficers(): void {
    const term = this.officerSearchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredOfficers = this.officers;
    } else {
      this.filteredOfficers = this.officers.filter(o =>
        o.username?.toLowerCase().includes(term) ||
        o.email?.toLowerCase().includes(term) ||
        o.firstName?.toLowerCase().includes(term) ||
        o.lastName?.toLowerCase().includes(term)
      );
    }
    this.officerCurrentPage = 1;
    this.updateOfficerPagination();
  }
  
  updateOfficerPagination(): void {
    this.officerTotalPages = Math.ceil(this.filteredOfficers.length / this.officerPageSize);
    if (this.officerCurrentPage > this.officerTotalPages) {
      this.officerCurrentPage = Math.max(1, this.officerTotalPages);
    }
    const startIndex = (this.officerCurrentPage - 1) * this.officerPageSize;
    const endIndex = startIndex + this.officerPageSize;
    this.paginatedOfficers = this.filteredOfficers.slice(startIndex, endIndex);
  }
  
  goToOfficerPage(page: number): void {
    if (page >= 1 && page <= this.officerTotalPages) {
      this.officerCurrentPage = page;
      this.updateOfficerPagination();
    }
  }
  
  onOfficerPageSizeChange(): void {
    this.officerCurrentPage = 1;
    this.updateOfficerPagination();
  }
  
  getOfficerPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    if (this.officerTotalPages <= maxVisible) {
      for (let i = 1; i <= this.officerTotalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, this.officerCurrentPage - 2);
      const end = Math.min(this.officerTotalPages, start + maxVisible - 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  }

  openAddOfficerModal(): void {
    this.addOfficerForm.reset();
    this.showAddOfficerModal = true;
  }

  confirmAddOfficer(): void {
    if (this.addOfficerForm.invalid) {
      this.toastService.warning('Please fill all required fields correctly');
      return;
    }

    this.submittingOfficer = true;
    this.adminService.createComplianceOfficer(this.addOfficerForm.value).subscribe({
      next: (officer) => {
        this.toastService.success(`Officer ${officer.username} has been added successfully`, 5000);
        this.showAddOfficerModal = false;
        this.addOfficerForm.reset();
        this.submittingOfficer = false;
        this.loadOfficers();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to add officer');
        this.submittingOfficer = false;
      }
    });
  }

  openRemoveOfficerModal(officer: UserDto): void {
    this.selectedOfficer = officer;
    this.showRemoveOfficerModal = true;
  }

  confirmRemoveOfficer(): void {
    if (!this.selectedOfficer) return;

    this.adminService.removeComplianceOfficer(this.selectedOfficer.id).subscribe({
      next: () => {
        this.toastService.success(`Officer ${this.selectedOfficer?.username} has been removed successfully`, 5000);
        this.showRemoveOfficerModal = false;
        this.selectedOfficer = null;
        this.loadOfficers();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to remove officer');
      }
    });
  }

  promoteToSuperAdmin(officer: UserDto): void {
    // Note: Implement this method in AdminService if needed
    this.toastService.info('Promote to Super Admin feature coming soon');
  }

  getAccountStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'bg-success';
      case 'PENDING': return 'bg-warning text-dark';
      case 'SUSPENDED': return 'bg-danger';
      case 'CLOSED': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  }

  getApprovalStatusClass(approvalStatus: string): string {
    switch (approvalStatus?.toUpperCase()) {
      case 'APPROVED': return 'bg-success';
      case 'PENDING': return 'bg-warning text-dark';
      case 'REJECTED': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  toggleBankAccountsExpansion(): void {
    this.bankAccountsExpanded = !this.bankAccountsExpanded;
  }

  isBankAccountsExpanded(): boolean {
    return this.bankAccountsExpanded;
  }

  closeAllModals(): void {
    this.showCustomerDetailsModal = false;
    this.showBlockCustomerModal = false;
    this.showAddOfficerModal = false;
    this.showRemoveOfficerModal = false;
    this.selectedCustomer = null;
    this.selectedOfficer = null;
    this.customerDetails = null;
    this.blockReason = '';
    this.bankAccountsExpanded = false;
  }
}
