import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, BankAccountDto } from '../../core/services/admin.service';
import { ToastService } from '../../core/services/toast.service';

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
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  Math = Math;

  constructor(
    private adminService: AdminService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
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
      if (!term.trim()) {
        this.filteredPendingAccounts = [...this.pendingAccounts];
      } else {
        this.filteredPendingAccounts = this.pendingAccounts.filter(acc =>
          acc.accountNumber?.toLowerCase().includes(term) ||
          acc.accountType?.toLowerCase().includes(term) ||
          acc.customerName?.toLowerCase().includes(term) ||
          acc.status?.toLowerCase().includes(term)
        );
      }
    } else {
      if (!term.trim()) {
        this.filteredAllAccounts = [...this.allAccounts];
      } else {
        this.filteredAllAccounts = this.allAccounts.filter(acc =>
          acc.accountNumber?.toLowerCase().includes(term) ||
          acc.accountType?.toLowerCase().includes(term) ||
          acc.customerName?.toLowerCase().includes(term) ||
          acc.status?.toLowerCase().includes(term)
        );
      }
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
    this.loadAccounts();
  }

  approveAccount(account: BankAccountDto): void {
    if (!confirm(`Approve account ${account.accountNumber}?`)) return;

    this.adminService.approveAccount(account.id).subscribe({
      next: () => {
        this.toastService.success(`Account ${account.accountNumber} approved successfully`, 5000);
        this.loadAccounts();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to approve account');
      }
    });
  }

  rejectAccount(account: BankAccountDto): void {
    if (!confirm(`Reject account ${account.accountNumber}?`)) return;

    this.adminService.rejectAccount(account.id).subscribe({
      next: () => {
        this.toastService.success(`Account ${account.accountNumber} rejected`, 5000);
        this.loadAccounts();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to reject account');
      }
    });
  }

  suspendAccount(account: BankAccountDto): void {
    if (!confirm(`Suspend account ${account.accountNumber}?`)) return;

    this.adminService.suspendAccount(account.id).subscribe({
      next: () => {
        this.toastService.success(`Account ${account.accountNumber} suspended`, 5000);
        this.loadAccounts();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to suspend account');
      }
    });
  }

  activateAccount(account: BankAccountDto): void {
    if (!confirm(`Activate account ${account.accountNumber}?`)) return;

    this.adminService.activateAccount(account.id).subscribe({
      next: () => {
        this.toastService.success(`Account ${account.accountNumber} activated`, 5000);
        this.loadAccounts();
      },
      error: (err) => {
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
}
