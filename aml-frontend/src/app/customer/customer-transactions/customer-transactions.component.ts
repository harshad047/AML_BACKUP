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
  template: `
    <div class="container py-3">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h3 class="mb-0">All Transactions</h3>
        <a class="btn btn-primary" [routerLink]="['/customer/new-transaction']">
          <i class="fas fa-plus me-2"></i>
          New Transaction
        </a>
      </div>

      <div class="row g-2 mb-3">
        <div class="col-auto">
          <label class="col-form-label">Show:</label>
        </div>
        <div class="col-auto">
          <select class="form-select" [ngModel]="filterStatus" (ngModelChange)="onFilterChange($event)">
            <option value="all">All transactions</option>
            <option value="flagged">Flagged transactions</option>
            <option value="blocked">Blocked transactions</option>
          </select>
        </div>
      </div>

      <div class="card">
        <div class="card-body p-0">
          <div class="text-center text-muted py-4" *ngIf="loading">Loading...</div>
          <div class="text-danger p-3" *ngIf="error">{{ error }}</div>
          <div class="table-responsive" *ngIf="!loading && transactions.length > 0">
            <table class="table table-striped mb-0">
              <thead class="table-light">
                <tr>
                  <th>#</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let t of transactions; index as i">
                  <td>{{ i + 1 }}</td>
                  <td><strong class="text-dark">{{ getTransactionType(t) }}</strong></td>
                  <td class="text-dark">{{ t.amount | currency:'INR':'symbol':'1.2-2' }}</td>
                  <td>
                    <span class="badge" [ngClass]="statusClass(t.status)">{{ getStatusText(t) }}</span>
                  </td>
                  <td class="text-dark">{{ t.createdAt | date:'medium' }}</td>
                  <td class="text-dark">{{ t.description || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="text-center text-muted py-4" *ngIf="!loading && transactions.length === 0">
            No transactions found.
          </div>
        </div>
      </div>

      <!-- Flagged/Blocked Transactions Alerts -->
      <div class="card mt-3" *ngIf="flaggedTransactions.length > 0">
        <div class="card-header">
          <h5 class="mb-0">Transaction Alerts</h5>
        </div>
        <div class="list-group list-group-flush">
          <div class="list-group-item d-flex justify-content-between align-items-center" *ngFor="let t of flaggedTransactions">
            <div>
              <div class="tx-item-title text-dark">{{ getTransactionType(t) }} - {{ t.amount | currency:'INR':'symbol':'1.2-2' }}</div>
              <div class="tx-item-sub">{{ t.description || 'No description' }} ({{ t.createdAt | date:'short' }})</div>
            </div>
            <div class="badge" [ngClass]="statusClass(t.status)">
              {{ getStatusText(t) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `
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
