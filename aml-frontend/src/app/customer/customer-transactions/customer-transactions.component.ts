import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TransactionService, TransactionDto } from '../../core/services/transaction.service';
import { AccountDto, AccountService } from '../../core/services/account.service';

@Component({
  selector: 'app-customer-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, RouterModule],
  templateUrl: './customer-transactions.component.html'
})
export class CustomerTransactionsComponent implements OnInit, OnChanges {
  @Input() accountNumber?: string;
  @Input() accounts: AccountDto[] = [];
  transactions: TransactionDto[] = [];
  flaggedTransactions: TransactionDto[] = [];
  loading = false;
  error = '';
  selectedAccountNumber?: string;
  filterStatus = 'all';
  accountOptions: { accountNumber: string; label: string }[] = [];

  constructor(private tx: TransactionService, private accountsApi: AccountService) {}

  ngOnInit(): void {
    if (!this.accounts || this.accounts.length === 0) {
      // Load only the current user's accounts
      this.accountsApi.getMyAccounts().subscribe({
        next: (acs) => {
          this.accounts = acs || [];
          this.buildAccountOptions();
          this.fetch();
        },
        error: _ => {
          this.accounts = [];
          this.buildAccountOptions();
          this.fetch();
        }
      });
    } else {
      this.buildAccountOptions();
      this.fetch();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['accounts'] && this.accounts && this.accounts.length > 0 && !this.selectedAccountNumber) {
      // Do not auto-select to avoid surprising the user; keep "All accounts" default
    }
    if (changes['accountNumber'] && this.accountNumber && !this.selectedAccountNumber) {
      // If a specific accountNumber input is provided, use it unless user selected a different one
      this.selectedAccountNumber = this.accountNumber;
    }
  }

  fetch(): void {
    this.loading = true;
    this.error = '';
    const myAccountNumbers = new Set((this.accounts || []).map(a => a.accountNumber));
    let effectiveAccount = this.selectedAccountNumber ?? this.accountNumber;

    // Guard: only allow fetching for user's own account
    if (effectiveAccount && !myAccountNumbers.has(effectiveAccount)) {
      // Invalid selection provided (e.g., from URL). Ignore and fall back to all.
      effectiveAccount = undefined;
    }
    const obs = effectiveAccount
      ? this.tx.getHistoryByAccount(effectiveAccount)
      : this.tx.getHistory();

    obs.subscribe({
      next: (transactionsData: TransactionDto[]) => {
        this.loading = false;
        // Backend returns TransactionDto[] directly
        this.transactions = Array.isArray(transactionsData) ? transactionsData : [];
        this.updateFilteredTransactions();
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load transactions';
        this.transactions = [];
      }
    });
  }

  onFilterChange(value: string): void {
    this.filterStatus = value;
    this.updateFilteredTransactions();
  }

  onAccountChange(accountNumber: string): void {
    this.selectedAccountNumber = accountNumber || undefined;
    this.fetch();
  }

  private updateFilteredTransactions(): void {
    let list = [...this.transactions];
    if (this.selectedAccountNumber) {
      list = list.filter(t => t.fromAccountNumber === this.selectedAccountNumber || t.toAccountNumber === this.selectedAccountNumber);
    }
    if (this.filterStatus === 'flagged') {
      this.flaggedTransactions = list.filter(t => t.status?.toLowerCase() === 'flagged');
    } else if (this.filterStatus === 'blocked') {
      this.flaggedTransactions = list.filter(t => t.status?.toLowerCase() === 'blocked');
    } else {
      this.flaggedTransactions = [];
    }
    // Replace displayed list with filtered list
    this.transactions = list;
  }

  statusClass(status: string): string {
    const s = String(status || '').toLowerCase();
    if (s === 'completed' || s === 'success') return 'bg-success';
    if (s === 'pending') return 'bg-warning';
    if (s === 'rejected' || s === 'failed') return 'bg-danger';
    if (s === 'flagged') return 'bg-info';
    if (s === 'blocked') return 'bg-danger';
    return 'bg-secondary';
  }

  getTransactionType(transaction: TransactionDto): string {
    // Handle different possible field names for transaction type
    return transaction.transactionType ||
           (transaction as any).type ||
           (transaction as any).operationType ||
           (transaction as any).txType ||
           'Unknown';
  }

  getStatusText(transaction: TransactionDto): string {
    return transaction.status || 'Unknown';
  }

  displayAmount(t: TransactionDto): number {
    const type = (t.transactionType || '').toUpperCase();
    if (this.selectedAccountNumber && type === 'INTERCURRENCY_TRANSFER') {
      if (t.toAccountNumber === this.selectedAccountNumber && t.convertedAmount != null) {
        return t.convertedAmount as any;
      }
      if (t.fromAccountNumber === this.selectedAccountNumber && t.originalAmount != null) {
        return t.originalAmount as any;
      }
    }
    return t.amount;
  }

  displayCurrency(t: TransactionDto): string {
    const type = (t.transactionType || '').toUpperCase();
    if (this.selectedAccountNumber && type === 'INTERCURRENCY_TRANSFER') {
      if (t.toAccountNumber === this.selectedAccountNumber && t.convertedCurrency) {
        return t.convertedCurrency;
      }
      if (t.fromAccountNumber === this.selectedAccountNumber && t.originalCurrency) {
        return t.originalCurrency;
      }
    }
    return t.currency;
  }

  private buildAccountOptions(): void {
    // Only show the logged-in user's own accounts
    const list = (this.accounts || []).map(a => a.accountNumber).filter(Boolean);
    this.accountOptions = list.map(acc => ({ accountNumber: acc, label: acc }));
    // If selected account is not in user's accounts, clear it
    if (this.selectedAccountNumber && !list.includes(this.selectedAccountNumber)) {
      this.selectedAccountNumber = undefined;
    }
    // If input accountNumber is not owned by user, clear it
    if (this.accountNumber && !list.includes(this.accountNumber)) {
      this.accountNumber = undefined;
    }
    // Auto-select first account if none selected
    if (!this.selectedAccountNumber && list.length > 0) {
      this.selectedAccountNumber = list[0];
    }
  }
}
