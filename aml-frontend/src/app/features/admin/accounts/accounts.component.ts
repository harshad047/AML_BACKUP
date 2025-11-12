import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { BankAccountDto } from '../../../core/models/admin.models';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.css']
})
export class AccountsComponent implements OnInit {
  allAccounts: BankAccountDto[] = [];
  filteredAllAccounts: BankAccountDto[] = [];
  paginatedAllAccounts: BankAccountDto[] = [];
  
  pendingAccounts: BankAccountDto[] = [];
  filteredPendingAccounts: BankAccountDto[] = [];
  paginatedPendingAccounts: BankAccountDto[] = [];
  
  loading = false;
  error = '';
  success = '';
  
  activeTab: 'pending' | 'all' = 'pending';
  
  // Search and pagination
  searchTerm = '';
  accountTypeFilter = 'ALL';
  statusFilter = 'ALL';
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  Math = Math;
  
  // All accounts for stats
  allAccountsForStats: BankAccountDto[] = [];
  
  // Customer data for blocked status check
  customers: any[] = [];
  
  // Modal states
  showApproveModal = false;
  showRejectModal = false;
  showSuspendModal = false;
  showActivateModal = false;
  selectedAccount: BankAccountDto | null = null;
  rejectionReason = '';
  suspensionReason = '';

  constructor(
    private adminService: AdminService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
    this.loadAllAccountsForStats();
    this.loadCustomers();
  }

  loadAllAccountsForStats(): void {
    this.adminService.getAllAccounts().subscribe({
      next: (accounts) => {
        this.allAccountsForStats = accounts;
      },
      error: () => {}
    });
  }

  loadAccounts(): void {
    this.loading = true;
    this.error = '';
    
    if (this.activeTab === 'pending') {
      this.adminService.getPendingAccounts().subscribe({
        next: (accounts) => {
          this.pendingAccounts = accounts;
          this.filteredPendingAccounts = [...accounts];
          this.updatePagination();
          this.loading = false;
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Failed to load pending accounts');
          this.loading = false;
        }
      });
    } else {
      this.adminService.getAllAccounts().subscribe({
        next: (accounts) => {
          this.allAccounts = accounts;
          this.filteredAllAccounts = [...accounts];
          this.updatePagination();
          this.loading = false;
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Failed to load accounts');
          this.loading = false;
        }
      });
    }
  }

  filterAccounts(): void {
    const term = this.searchTerm.toLowerCase();
    
    if (this.activeTab === 'pending') {
      let filtered = [...this.pendingAccounts];
      
      // Apply search filter
      if (term.trim()) {
        filtered = filtered.filter(acc =>
          acc.accountNumber?.toLowerCase().includes(term) ||
          acc.accountType?.toLowerCase().includes(term) ||
          acc.customerName?.toLowerCase().includes(term) ||
          acc.status?.toLowerCase().includes(term)
        );
      }
      
      // Apply account type filter
      if (this.accountTypeFilter !== 'ALL') {
        filtered = filtered.filter(acc => acc.accountType === this.accountTypeFilter);
      }
      
      // Apply status filter
      if (this.statusFilter !== 'ALL') {
        filtered = filtered.filter(acc => acc.status === this.statusFilter);
      }
      
      this.filteredPendingAccounts = filtered;
    } else {
      let filtered = [...this.allAccounts];
      
      // Apply search filter
      if (term.trim()) {
        filtered = filtered.filter(acc =>
          acc.accountNumber?.toLowerCase().includes(term) ||
          acc.accountType?.toLowerCase().includes(term) ||
          acc.customerName?.toLowerCase().includes(term) ||
          acc.status?.toLowerCase().includes(term)
        );
      }
      
      // Apply account type filter
      if (this.accountTypeFilter !== 'ALL') {
        filtered = filtered.filter(acc => acc.accountType === this.accountTypeFilter);
      }
      
      // Apply status filter
      if (this.statusFilter !== 'ALL') {
        filtered = filtered.filter(acc => acc.status === this.statusFilter);
      }
      
      this.filteredAllAccounts = filtered;
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

    const accounts = this.activeTab === 'pending' ? this.filteredPendingAccounts : this.filteredAllAccounts;
    accounts.sort((a: any, b: any) => {
      const aVal = a[column];
      const bVal = b[column];
      if (aVal === bVal) return 0;
      const comparison = aVal > bVal ? 1 : -1;
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });

    this.updatePagination();
  }

  updatePagination(): void {
    const filtered = this.activeTab === 'pending' ? this.filteredPendingAccounts : this.filteredAllAccounts;
    this.totalPages = Math.ceil(filtered.length / this.pageSize);
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    
    if (this.activeTab === 'pending') {
      this.paginatedPendingAccounts = this.filteredPendingAccounts.slice(startIndex, endIndex);
    } else {
      this.paginatedAllAccounts = this.filteredAllAccounts.slice(startIndex, endIndex);
    }
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

  switchTab(tab: 'pending' | 'all'): void {
    this.activeTab = tab;
    this.searchTerm = '';
    this.accountTypeFilter = 'ALL';
    this.statusFilter = 'ALL';
    this.loadAccounts();
  }

  // Stats Methods
  getPendingCount(): number {
    return this.allAccountsForStats.filter(a => a.approvalStatus === 'PENDING').length;
  }

  getActiveCount(): number {
    return this.allAccountsForStats.filter(a => a.status === 'ACTIVE').length;
  }

  getSuspendedCount(): number {
    return this.allAccountsForStats.filter(a => a.status === 'SUSPENDED').length;
  }

  getTotalCount(): number {
    return this.allAccountsForStats.length;
  }

  // Modal Methods
  openApproveModal(account: BankAccountDto): void {
    this.selectedAccount = account;
    this.showApproveModal = true;
  }

  closeApproveModal(): void {
    this.showApproveModal = false;
    this.selectedAccount = null;
  }

  confirmApprove(): void {
    if (!this.selectedAccount) return;

    this.adminService.approveAccount(this.selectedAccount.id).subscribe({
      next: () => {
        this.toastService.success(`Account ${this.selectedAccount?.accountNumber} approved successfully`, 5000);
        this.closeApproveModal();
        this.loadAccounts();
        this.loadAllAccountsForStats();
      },
      error: (err: any) => {
        this.toastService.error(err.error?.message || 'Failed to approve account');
      }
    });
  }

  openRejectModal(account: BankAccountDto): void {
    this.selectedAccount = account;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedAccount = null;
    this.rejectionReason = '';
  }

  confirmReject(): void {
    if (!this.selectedAccount) return;

    this.adminService.rejectAccount(this.selectedAccount.id).subscribe({
      next: () => {
        this.toastService.success(`Account ${this.selectedAccount?.accountNumber} rejected`, 5000);
        this.closeRejectModal();
        this.loadAccounts();
        this.loadAllAccountsForStats();
      },
      error: (err: any) => {
        this.toastService.error(err.error?.message || 'Failed to reject account');
      }
    });
  }

  openSuspendModal(account: BankAccountDto): void {
    this.selectedAccount = account;
    this.suspensionReason = '';
    this.showSuspendModal = true;
  }

  closeSuspendModal(): void {
    this.showSuspendModal = false;
    this.selectedAccount = null;
    this.suspensionReason = '';
  }

  confirmSuspend(): void {
    if (!this.selectedAccount) return;

    this.adminService.suspendAccount(this.selectedAccount.id).subscribe({
      next: () => {
        this.toastService.success(`Account ${this.selectedAccount?.accountNumber} suspended`, 5000);
        this.closeSuspendModal();
        this.loadAccounts();
        this.loadAllAccountsForStats();
      },
      error: (err: any) => {
        this.toastService.error(err.error?.message || 'Failed to suspend account');
      }
    });
  }

  openActivateModal(account: BankAccountDto): void {
    this.selectedAccount = account;
    this.showActivateModal = true;
  }

  closeActivateModal(): void {
    this.showActivateModal = false;
    this.selectedAccount = null;
  }

  confirmActivate(): void {
    if (!this.selectedAccount) return;

    this.adminService.activateAccount(this.selectedAccount.id).subscribe({
      next: () => {
        this.toastService.success(`Account ${this.selectedAccount?.accountNumber} activated`, 5000);
        this.closeActivateModal();
        this.loadAccounts();
        this.loadAllAccountsForStats();
      },
      error: (err: any) => {
        this.toastService.error(err.error?.message || 'Failed to activate account');
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'bg-success';
      case 'PENDING': return 'bg-warning';
      case 'SUSPENDED': return 'bg-danger';
      case 'REJECTED': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getApprovalBadgeClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'APPROVED': return 'bg-success';
      case 'PENDING': return 'bg-warning';
      case 'REJECTED': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  get displayedAccounts(): BankAccountDto[] {
    return this.activeTab === 'pending' ? this.paginatedPendingAccounts : this.paginatedAllAccounts;
  }

  get filteredCount(): number {
    return this.activeTab === 'pending' ? this.filteredPendingAccounts.length : this.filteredAllAccounts.length;
  }

  // Load customers to check blocked status
  loadCustomers(): void {
    // Load both active and blocked customers like in manage-users component
    this.adminService.getActiveCustomers().subscribe({
      next: (active) => {
        const activeCustomers = active.map(u => ({ ...u, blocked: false }));
        this.customers = [...activeCustomers];
        
        // Also load blocked customers
        this.adminService.getBlockedCustomers().subscribe({
          next: (blocked) => {
            const blockedCustomers = blocked.map(u => ({ ...u, blocked: true }));
            this.customers = [...activeCustomers, ...blockedCustomers];
          },
          error: () => {
            // If blocked customers API fails, continue with just active customers
          }
        });
      },
      error: () => {
        // Handle error silently as this is supplementary data
      }
    });
  }

  // Check if a customer is blocked
  isCustomerBlocked(customerId: number): boolean {
    const customer = this.customers.find(c => c.id === customerId);
    return customer ? customer.blocked === true : false;
  }
}
