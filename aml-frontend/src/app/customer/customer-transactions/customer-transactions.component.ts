import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TransactionService, TransactionDto } from '../../core/services/transaction.service';
import { AccountDto } from '../../core/services/account.service';

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

  constructor(private tx: TransactionService) {}

  ngOnInit(): void {
    this.fetch();
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
    const effectiveAccount = this.selectedAccountNumber ?? this.accountNumber;
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

  private updateFilteredTransactions(): void {
    if (this.filterStatus === 'flagged') {
      this.flaggedTransactions = this.transactions.filter(t => t.status?.toLowerCase() === 'flagged');
    } else if (this.filterStatus === 'blocked') {
      this.flaggedTransactions = this.transactions.filter(t => t.status?.toLowerCase() === 'blocked');
    } else {
      this.flaggedTransactions = [];
    }
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
}
