import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/auth.models';
import { TransactionService, TransactionDto } from '../../core/services/transaction.service';
import { DocumentService, DocumentDto } from '../../core/services/document.service';
import { AccountService, AccountDto } from '../../core/services/account.service';
import { CustomerService } from '../../core/services/customer.service';

interface Transaction {
  type: string;
  date: Date;
  status: string;
}

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <h1 class="mb-4">Customer Dashboard</h1>
          <p class="text-muted">Welcome back, {{ currentUser?.firstName }}!</p>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card bg-primary text-white">
            <div class="card-body">
              <h5 class="card-title">KYC Status</h5>
              <h3>{{ kycStatus }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-success text-white">
            <div class="card-body">
              <h5 class="card-title">Active Accounts</h5>
              <h3>{{ activeAccounts }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-warning text-white">
            <div class="card-body">
              <h5 class="card-title">Pending Transactions</h5>
              <h3>{{ pendingTransactions }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-info text-white">
            <div class="card-body">
              <h5 class="card-title">Documents</h5>
              <h3>{{ totalDocuments }}</h3>
              <div class="tx-item-sub text-white-50">Pending: {{ pendingDocuments }} · Approved: {{ approvedDocuments }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="row">
        <div class="col-md-8">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Recent Transactions</h5>
            </div>
            <div class="card-body">
              <div class="text-center text-muted py-4" *ngIf="recentTransactions.length === 0">
                <i class="fas fa-exchange-alt fa-3x mb-3"></i>
                <p>No transactions yet</p>
              </div>
              <div class="list-group list-group-flush" *ngIf="recentTransactions.length > 0">
                <div class="list-group-item d-flex justify-content-between align-items-center"
                     *ngFor="let transaction of recentTransactions">
                  <div>
                    <div class="tx-item-title">{{ transaction.type }}</div>
                    <div class="tx-item-sub">{{ transaction.date | date:'short' }}</div>
                  </div>
                  <span class="badge" [ngClass]="getStatusClass(transaction.status)">
                    {{ transaction.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Quick Actions</h5>
            </div>
            <div class="card-body">
              <div class="d-grid gap-2">
                <a class="btn btn-outline-primary" [routerLink]="['/customer/new-transaction']">
                  <i class="fas fa-plus me-2"></i>
                  New Transaction
                </a>
                <a class="btn btn-outline-info" [routerLink]="['/customer/open-account']">
                  <i class="fas fa-credit-card me-2"></i>
                  Request Account
                </a>
              </div>
            </div>
          </div>

          <div class="card mt-3" *ngIf="accounts.length">
            <div class="card-header">
              <h5 class="mb-0">My Accounts</h5>
            </div>
            <div class="list-group list-group-flush">
              <div class="list-group-item d-flex justify-content-between align-items-center" *ngFor="let acc of accounts | slice:0:5">
                <div>
                  <div class="tx-item-title">{{ acc.accountNumber }}</div>
                  <div class="tx-item-sub">{{ acc.accountType }}</div>
                </div>
                <div class="text-end">
                  <div class="tx-item-title">{{ acc.balance }} {{ acc.currency }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card mt-3" *ngIf="transactionAlerts.length > 0">
            <div class="card-header">
              <h5 class="mb-0">Transaction Alerts</h5>
            </div>
            <div class="list-group list-group-flush">
              <div class="list-group-item d-flex justify-content-between align-items-center" *ngFor="let alert of transactionAlerts">
                <div>
                  <div class="tx-item-title">{{ alert.title || 'Transaction Alert' }}</div>
                  <div class="tx-item-sub">{{ alert.message || 'A transaction requires attention' }}</div>
                </div>
                <div class="badge bg-warning">{{ alert.severity || 'Medium' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      border: none;
      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
      border-radius: 0.5rem;
    }

    .badge {
      font-size: 0.75rem;
      padding: 0.35rem 0.6rem;
      letter-spacing: 0.3px;
    }

    .tx-item-title {
      font-weight: 600;
      color: #212529;
    }

    .tx-item-sub {
      color: #6c757d;
    }
  `]
})
export class CustomerDashboardComponent implements OnInit {
  currentUser: User | null = null;
  kycStatus = 'PENDING';
  activeAccounts = 0;
  pendingTransactions = 0;
  totalDocuments = 0;
  pendingDocuments = 0;
  approvedDocuments = 0;

  recentTransactions: Transaction[] = [];
  accounts: AccountDto[] = [];
  alertsCount: number | null = null;
  transactionAlerts: any[] = [];

  constructor(private authService: AuthService, private txService: TransactionService, private docService: DocumentService, private accountService: AccountService, private customerService: CustomerService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user: User | null) => {
      this.currentUser = user;
    });

    // Load dashboard data
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.kycStatus = this.currentUser?.kycStatus || 'PENDING';
    this.txService.getHistory().subscribe({
      next: (resp) => {
        const list: TransactionDto[] = (resp as any)?.data ?? (resp as any) ?? [];
        const recent = (list || []).slice(0, 5);
        this.recentTransactions = recent.map(t => ({
          type: t.type,
          date: new Date(t.createdAt),
          status: t.status
        }));
        this.pendingTransactions = (list || []).filter(t => String(t.status).toLowerCase() === 'pending').length;
      },
      error: () => {
        this.recentTransactions = [];
      }
    });

    this.docService.getMyDocuments().subscribe({
      next: (resp) => {
        const docs = ((resp as any)?.data ?? (resp as any) ?? []) as DocumentDto[];
        const arr = Array.isArray(docs) ? docs : [];
        this.totalDocuments = arr.length;
        const norm = (s?: string) => String(s || '').toUpperCase();
        this.pendingDocuments = arr.filter(d => norm(d.status) === 'PENDING').length;
        this.approvedDocuments = arr.filter(d => norm(d.status) === 'APPROVED').length;
      },
      error: () => {
        this.totalDocuments = 0;
        this.pendingDocuments = 0;
        this.approvedDocuments = 0;
      }
    });

    this.accountService.getMyAccounts().subscribe({
      next: (resp) => {
        const accs = ((resp as any)?.data ?? (resp as any) ?? []) as AccountDto[];
        this.accounts = Array.isArray(accs) ? accs : [];
        this.activeAccounts = this.accounts.length;
      },
      error: () => {
        this.accounts = [];
        this.activeAccounts = 0;
      }
    });

    this.customerService.getMyAlerts().subscribe({
      next: (resp) => {
        const alerts = ((resp as any)?.data ?? (resp as any) ?? []) as any[];
        this.alertsCount = Array.isArray(alerts) ? alerts.length : 0;
        // Filter for transaction-related alerts (assuming they have a 'type' or 'category' field)
        this.transactionAlerts = alerts.filter(alert => alert.type === 'TRANSACTION' || alert.category === 'TRANSACTION');
      },
      error: () => {
        this.alertsCount = 0;
        this.transactionAlerts = [];
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-success';
      case 'pending': return 'bg-warning';
      case 'rejected': return 'bg-danger';
      case 'flagged': return 'bg-info';
      default: return 'bg-secondary';
    }
  }
}
