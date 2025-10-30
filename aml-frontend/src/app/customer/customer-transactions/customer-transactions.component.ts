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
  templateUrl: './customer-transactions.component.html',
  styleUrls: ['./customer-transactions.component.css']
})
export class CustomerTransactionsComponent implements OnInit, OnChanges {
  @Input() accountNumber?: string;
  @Input() accounts: AccountDto[] = [];
  transactions: TransactionDto[] = [];
  allTransactions: TransactionDto[] = [];
  flaggedTransactions: TransactionDto[] = [];
  loading = false;
  error = '';
  selectedAccountNumber?: string;
  filterStatus = 'all';
  selectedTransaction: any = null;

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
        this.allTransactions = Array.isArray(transactionsData) ? transactionsData : [];
        this.transactions = [...this.allTransactions];
        this.updateFilteredTransactions();
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load transactions';
        this.allTransactions = [];
        this.transactions = [];
      }
    });
  }

  onFilterChange(value: string): void {
    this.filterStatus = value;
    this.updateFilteredTransactions();
  }

  private updateFilteredTransactions(): void {
    if (this.filterStatus === 'all') {
      this.transactions = [...this.allTransactions];
    } else if (this.filterStatus === 'approved') {
      this.transactions = this.allTransactions.filter(t => {
        const s = t.status?.toLowerCase();
        return s === 'completed' || s === 'success' || s === 'approved';
      });
    } else if (this.filterStatus === 'flagged') {
      this.transactions = this.allTransactions.filter(t => t.status?.toLowerCase() === 'flagged');
    } else if (this.filterStatus === 'blocked') {
      this.transactions = this.allTransactions.filter(t => t.status?.toLowerCase() === 'blocked');
    } else if (this.filterStatus === 'pending') {
      this.transactions = this.allTransactions.filter(t => t.status?.toLowerCase() === 'pending');
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

  // Statistics methods
  getTotalTransactions(): number {
    return this.allTransactions.length;
  }

  getApprovedTransactions(): number {
    return this.allTransactions.filter(t => {
      const s = t.status?.toLowerCase();
      return s === 'completed' || s === 'success' || s === 'approved';
    }).length;
  }

  getFlaggedTransactionsOnly(): number {
    return this.allTransactions.filter(t => t.status?.toLowerCase() === 'flagged').length;
  }

  getBlockedTransactions(): number {
    return this.allTransactions.filter(t => t.status?.toLowerCase() === 'blocked').length;
  }

  // Transaction type icon methods
  getTypeIcon(transaction: TransactionDto): string {
    const type = this.getTransactionType(transaction).toUpperCase();
    if (type.includes('DEPOSIT')) return 'fa-arrow-down';
    if (type.includes('WITHDRAWAL')) return 'fa-arrow-up';
    if (type.includes('TRANSFER')) return 'fa-exchange-alt';
    if (type.includes('INTERCURRENCY')) return 'fa-globe';
    return 'fa-money-bill-wave';
  }

  getTypeIconClass(transaction: TransactionDto): string {
    const type = this.getTransactionType(transaction).toUpperCase();
    if (type.includes('DEPOSIT')) return 'icon-deposit';
    if (type.includes('WITHDRAWAL')) return 'icon-withdrawal';
    if (type.includes('TRANSFER')) return 'icon-transfer';
    if (type.includes('INTERCURRENCY')) return 'icon-intercurrency';
    return 'icon-default';
  }

  getAmountClass(transaction: TransactionDto): string {
    const type = this.getTransactionType(transaction).toUpperCase();
    if (type.includes('DEPOSIT')) return 'amount-positive';
    if (type.includes('WITHDRAWAL')) return 'amount-negative';
    return 'amount-neutral';
  }

  // Risk score methods
  getRiskScore(transaction: any): string {
    if (transaction.combinedRiskScore !== undefined && transaction.combinedRiskScore !== null) {
      return transaction.combinedRiskScore.toString();
    }
    return 'N/A';
  }

  getRiskScoreClass(transaction: any): string {
    const score = transaction.combinedRiskScore;
    if (score === undefined || score === null) return 'risk-na';
    if (score >= 70) return 'risk-high';
    if (score >= 40) return 'risk-medium';
    return 'risk-low';
  }

  getScoreClass(score: number | undefined): string {
    if (score === undefined || score === null) return 'score-na';
    if (score >= 70) return 'score-high';
    if (score >= 40) return 'score-medium';
    return 'score-low';
  }

  getRuleActionClass(action: string): string {
    const a = action?.toUpperCase();
    if (a === 'BLOCK') return 'bg-danger';
    if (a === 'FLAG') return 'bg-warning';
    if (a === 'REVIEW') return 'bg-info';
    return 'bg-secondary';
  }

  // Modal methods
  viewTransactionDetails(transaction: TransactionDto): void {
    this.selectedTransaction = transaction;
    // Use Bootstrap's modal API
    const modalElement = document.getElementById('transactionModal');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }
}
