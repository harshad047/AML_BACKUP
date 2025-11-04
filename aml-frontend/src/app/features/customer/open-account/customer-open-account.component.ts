import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { AccountService, CreateAccountRequest, AccountDto } from '../../../core/services/account.service';

@Component({
  selector: 'app-customer-open-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DatePipe],
  templateUrl: './customer-open-account.component.html',
  styleUrls: ['./customer-open-account.component.css']
})
export class CustomerOpenAccountComponent implements OnInit {
  form: FormGroup;
  loading = false;
  error = '';
  success = false;
  created: AccountDto | null = null;

  // New properties for existing accounts
  existingAccounts: AccountDto[] = [];
  filteredAccounts: AccountDto[] = [];
  loadingAccounts = false;
  accountsError = '';
  accountFilter = 'all';
  isAccountsSectionExpanded = true;

  constructor(private fb: FormBuilder, private accounts: AccountService) {
    this.form = this.fb.group({
      accountType: ['SAVINGS', Validators.required],
      initialBalance: [0, [Validators.required, Validators.min(0)]],
      currency: ['INR']
    });
  }

  ngOnInit(): void {
    this.loadExistingAccounts();
  }

  loadExistingAccounts(): void {
    this.loadingAccounts = true;
    this.accountsError = '';

    this.accounts.getMyAccounts().subscribe({
      next: (accountsData) => {
        this.loadingAccounts = false;
        // Backend returns AccountDto[] directly
        this.existingAccounts = Array.isArray(accountsData) ? accountsData : [];
        this.filteredAccounts = [...this.existingAccounts];
        this.onFilterChange();
      },
      error: (err) => {
        this.loadingAccounts = false;
        this.accountsError = err?.error?.message || 'Failed to load accounts';
        console.error('Error loading accounts:', err);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.success = false;

    const formValue = this.form.value;
    const req: CreateAccountRequest = {
      accountType: formValue.accountType,
      initialBalance: formValue.initialBalance, // Map form field to interface field
      currency: formValue.currency
    };

    this.accounts.createAccount(req).subscribe({
      next: (accountDto) => {
        this.loading = false;
        // Backend returns AccountDto directly
        this.created = accountDto;
        this.success = true;

        // Refresh existing accounts list
        this.loadExistingAccounts();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to create account';
      }
    });
  }

  getAccountTypeDisplay(accountType: string): string {
    switch (accountType?.toUpperCase()) {
      case 'SAVINGS': return 'Savings Account';
      case 'CURRENT': return 'Current Account';
      default: return accountType || 'Unknown';
    }
  }

  getAccountStatusClass(account: AccountDto): string {
    switch (account.status?.toUpperCase()) {
      case 'ACTIVE': return 'bg-success';
      case 'PENDING': return 'bg-warning';
      case 'SUSPENDED': return 'bg-danger';
      case 'REJECTED': return 'bg-danger';
      case 'INACTIVE': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  }

  getAccountStatusText(account: AccountDto): string {
    switch (account.status?.toUpperCase()) {
      case 'ACTIVE': return 'Active';
      case 'PENDING': return 'Pending Approval';
      case 'SUSPENDED': return 'Suspended';
      case 'REJECTED': return 'Rejected';
      case 'INACTIVE': return 'Inactive';
      default: return account.status || 'Unknown';
    }
  }

  getApprovalStatusText(account: AccountDto): string {
    switch (account.approvalStatus?.toUpperCase()) {
      case 'APPROVED': return 'Approved';
      case 'PENDING': return 'Pending';
      case 'REJECTED': return 'Rejected';
      default: return account.approvalStatus || 'Unknown';
    }
  }

  getApprovalStatusClass(account: AccountDto): string {
    switch (account.approvalStatus?.toUpperCase()) {
      case 'APPROVED': return 'bg-success';
      case 'PENDING': return 'bg-warning';
      case 'REJECTED': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  // Filter functionality
  onFilterChange(): void {
    if (this.accountFilter === 'all') {
      this.filteredAccounts = [...this.existingAccounts];
    } else if (this.accountFilter === 'active') {
      this.filteredAccounts = this.existingAccounts.filter(a => a.status?.toUpperCase() === 'ACTIVE');
    } else if (this.accountFilter === 'pending') {
      this.filteredAccounts = this.existingAccounts.filter(a => 
        a.approvalStatus?.toUpperCase() === 'PENDING' || a.status?.toUpperCase() === 'PENDING'
      );
    } else if (this.accountFilter === 'savings') {
      this.filteredAccounts = this.existingAccounts.filter(a => a.accountType?.toUpperCase() === 'SAVINGS');
    } else if (this.accountFilter === 'current') {
      this.filteredAccounts = this.existingAccounts.filter(a => a.accountType?.toUpperCase() === 'CURRENT');
    }
  }

  // Statistics methods
  getTotalAccounts(): number {
    return this.existingAccounts.length;
  }

  getActiveAccounts(): number {
    return this.existingAccounts.filter(a => a.status?.toUpperCase() === 'ACTIVE').length;
  }

  getPendingAccounts(): number {
    return this.existingAccounts.filter(a => 
      a.approvalStatus?.toUpperCase() === 'PENDING' || a.status?.toUpperCase() === 'PENDING'
    ).length;
  }

  getTotalBalance(): string {
    const total = this.existingAccounts
      .filter(a => a.status?.toUpperCase() === 'ACTIVE')
      .reduce((sum, a) => sum + (a.balance || 0), 0);
    return '₹' + total.toFixed(2);
  }

  // Account card styling
  getAccountIcon(accountType: string): string {
    return accountType?.toUpperCase() === 'SAVINGS' ? 'fa-piggy-bank' : 'fa-briefcase';
  }

  getAccountHeaderClass(account: AccountDto): string {
    if (account.status?.toUpperCase() === 'ACTIVE') {
      return 'header-active';
    } else if (account.status?.toUpperCase() === 'PENDING') {
      return 'header-pending';
    }
    return 'header-default';
  }

  // Form reset
  resetForm(): void {
    this.form.reset({
      accountType: 'SAVINGS',
      initialBalance: 0,
      currency: 'INR'
    });
    this.error = '';
    this.success = false;
    this.created = null;
  }

  // Toggle accounts section
  toggleAccountsSection(): void {
    this.isAccountsSectionExpanded = !this.isAccountsSectionExpanded;
  }
}
