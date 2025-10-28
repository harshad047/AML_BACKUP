import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, BankAccountDto } from '../../core/services/admin.service';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.css']
})
export class AccountsComponent implements OnInit {
  allAccounts: BankAccountDto[] = [];
  pendingAccounts: BankAccountDto[] = [];
  loading = false;
  error = '';
  success = '';
  
  activeTab: 'pending' | 'all' = 'pending';

  constructor(private adminService: AdminService) {}

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
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to load pending accounts';
          this.loading = false;
        }
      });
    } else {
      this.adminService.getAllAccounts().subscribe({
        next: (accounts) => {
          this.allAccounts = accounts;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to load accounts';
          this.loading = false;
        }
      });
    }
  }

  switchTab(tab: 'pending' | 'all'): void {
    this.activeTab = tab;
    this.loadAccounts();
  }

  approveAccount(account: BankAccountDto): void {
    if (!confirm(`Approve account ${account.accountNumber}?`)) return;

    this.adminService.approveAccount(account.id).subscribe({
      next: () => {
        this.success = `Account ${account.accountNumber} approved successfully`;
        this.loadAccounts();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to approve account';
      }
    });
  }

  rejectAccount(account: BankAccountDto): void {
    if (!confirm(`Reject account ${account.accountNumber}?`)) return;

    this.adminService.rejectAccount(account.id).subscribe({
      next: () => {
        this.success = `Account ${account.accountNumber} rejected`;
        this.loadAccounts();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to reject account';
      }
    });
  }

  suspendAccount(account: BankAccountDto): void {
    if (!confirm(`Suspend account ${account.accountNumber}?`)) return;

    this.adminService.suspendAccount(account.id).subscribe({
      next: () => {
        this.success = `Account ${account.accountNumber} suspended`;
        this.loadAccounts();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to suspend account';
      }
    });
  }

  activateAccount(account: BankAccountDto): void {
    if (!confirm(`Activate account ${account.accountNumber}?`)) return;

    this.adminService.activateAccount(account.id).subscribe({
      next: () => {
        this.success = `Account ${account.accountNumber} activated`;
        this.loadAccounts();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to activate account';
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
    return this.activeTab === 'pending' ? this.pendingAccounts : this.allAccounts;
  }
}
