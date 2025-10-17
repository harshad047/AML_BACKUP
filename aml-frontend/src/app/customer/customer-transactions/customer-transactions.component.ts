import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService, TransactionDto } from '../../core/services/transaction.service';
import { ApiResponse } from '../../core/services/auth.service';
import { AccountDto } from '../../core/services/account.service';

@Component({
  selector: 'app-customer-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="container py-3">
      <h3 class="mb-3">All Transactions</h3>

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
              <thead>
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
                  <td>{{ t.type }}</td>
                  <td>{{ t.amount }}</td>
                  <td>
                    <span class="badge" [ngClass]="statusClass(t.status)">{{ t.status }}</span>
                  </td>
                  <td>{{ t.createdAt | date:'short' }}</td>
                  <td>{{ t.description || '-' }}</td>
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
              <div class="tx-item-title">{{ t.type }} - {{ t.amount }}</div>
              <div class="tx-item-sub">{{ t.description || 'No description' }} ({{ t.createdAt | date:'short' }})</div>
            </div>
            <div class="badge" [ngClass]="statusClass(t.status)">
              {{ t.status }}
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
      next: (resp: ApiResponse<TransactionDto[]>) => {
        this.loading = false;
        const anyResp: any = resp as any;
        let data: any = [];
        if (Array.isArray(anyResp)) {
          data = anyResp;
        } else if (Array.isArray(anyResp?.data)) {
          data = anyResp.data;
        } else if (Array.isArray(anyResp?.data?.content)) {
          data = anyResp.data.content;
        } else if (Array.isArray(anyResp?.content)) {
          data = anyResp.content;
        } else if (Array.isArray(anyResp?.records)) {
          data = anyResp.records;
        } else if (Array.isArray(anyResp?.transactions)) {
          data = anyResp.transactions;
        }
        this.transactions = (data ?? []) as TransactionDto[];
        // Minimal diagnostics to help verify payload shape during debugging
        if (!this.transactions.length) {
          // eslint-disable-next-line no-console
          console.debug('Transactions response received but empty', { resp, effectiveAccount });
        }
        this.updateFilteredTransactions();
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load transactions';
        this.transactions = [];
        // eslint-disable-next-line no-console
        console.debug('Transactions API error', { err, effectiveAccount });
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
}
