import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AccountService, CreateAccountRequest, AccountDto } from '../../core/services/account.service';

@Component({
  selector: 'app-customer-open-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
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
  loadingAccounts = false;
  accountsError = '';

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
}
