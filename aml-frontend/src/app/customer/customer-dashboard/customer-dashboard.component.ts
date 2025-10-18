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

      <!-- Quick Actions Section -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card quick-actions-card">
            <div class="card-header">
              <h5 class="mb-0">Quick Actions</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <a class="btn btn-outline-primary btn-lg w-100 mb-3" [routerLink]="['/customer/documents']">
                    <i class="fas fa-file-alt me-2"></i>
                    View Documents
                  </a>
                </div>
                <div class="col-md-6">
                  <a class="btn btn-outline-info btn-lg w-100 mb-3" [routerLink]="['/customer/alerts']">
                    <i class="fas fa-bell me-2"></i>
                    View Alerts
                  </a>
                </div>
              </div>
              <div class="row">
                <div class="col-md-6">
                  <a class="btn btn-outline-success btn-lg w-100 mb-3" [routerLink]="['/customer/new-transaction']">
                    <i class="fas fa-plus me-2"></i>
                    New Transaction
                  </a>
                </div>
                <div class="col-md-6">
                  <a class="btn btn-outline-warning btn-lg w-100 mb-3" [routerLink]="['/customer/open-account']">
                    <i class="fas fa-credit-card me-2"></i>
                    Request Account
                  </a>
                </div>
              </div>
            </div>
          </div>
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
        <div class="col-12">
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
      </div>

      <!-- My Alerts Section -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">My Alerts</h5>
              <a class="btn btn-sm btn-outline-primary" [routerLink]="['/customer/alerts']">
                <i class="fas fa-external-link-alt me-1"></i>
                View All
              </a>
            </div>
            <div class="card-body">
              <!-- Loading State -->
              <div class="text-center py-4" *ngIf="isLoadingAlerts">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading alerts...</p>
              </div>

              <!-- Empty State -->
              <div class="text-center text-muted py-4" *ngIf="!isLoadingAlerts && (!alertsCount || alertsCount === 0)">
                <i class="fas fa-bell-slash fa-3x mb-3"></i>
                <p>No alerts found</p>
                <small>All your alerts will appear here when they are generated.</small>
              </div>

              <!-- Alerts List with Scrollbar -->
              <div class="alerts-container" *ngIf="!isLoadingAlerts && alertsCount && alertsCount > 0">
                <div class="list-group list-group-flush">
                  <div class="list-group-item d-flex justify-content-between align-items-center" *ngFor="let alert of transactionAlerts.slice(0, 5)">
                    <div class="flex-grow-1">
                      <div class="fw-bold text-dark">{{ alert.title || 'Transaction Alert' }}</div>
                      <div class="text-muted small mb-1">{{ alert.message || 'A transaction requires attention' }}</div>
                      <div class="text-muted small" *ngIf="alert.transactionId">TX: {{ alert.transactionId }}</div>
                      <div class="text-muted small" *ngIf="getReasonText(alert)">
                        <strong>Reason:</strong> {{ getReasonText(alert) }}
                      </div>
                    </div>
                    <div class="d-flex align-items-center ms-3">
                      <span class="badge me-2" [ngClass]="getSeverityClass(alert.severity)">
                        {{ alert.severity || 'Medium' }}
                      </span>
                      <small class="text-muted">{{ formatDate(alert.createdAt) }}</small>
                    </div>
                  </div>
                  <div class="list-group-item text-center text-muted" *ngIf="alertsCount > 5">
                    <small>... and {{ alertsCount - 5 }} more alerts</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar Section -->
      <div class="row mt-4">
        <div class="col-12" *ngIf="accounts.length">
          <div class="card">
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

    .alerts-container {
      max-height: 400px;
      overflow-y: auto;
    }

    .alerts-container::-webkit-scrollbar {
      width: 8px;
    }

    .alerts-container::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }

    .alerts-container::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
    }

    .alerts-container::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }

    .sidebar-section {
      margin-top: 1.5rem;
    }

    .btn-lg {
      padding: 0.75rem 1.25rem;
      font-size: 1.1rem;
    }

    .quick-actions-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .quick-actions-card .card-header {
      background: rgba(255, 255, 255, 0.1);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }

    .quick-actions-card .btn {
      border: 2px solid rgba(255, 255, 255, 0.3);
      transition: all 0.3s ease;
    }

    .quick-actions-card .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
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
  isLoadingAlerts = false;

  constructor(private authService: AuthService, private txService: TransactionService, private docService: DocumentService, private accountService: AccountService, private customerService: CustomerService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user: User | null) => {
      this.currentUser = user;
    });

    // Load dashboard data
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    // Load KYC status from proper API
    this.customerService.getKycStatus().subscribe({
      next: (resp) => {
        const kycData = ((resp as any)?.data ?? (resp as any) ?? { status: 'PENDING' });
        this.kycStatus = kycData.status || 'PENDING';
      },
      error: () => {
        this.kycStatus = 'PENDING';
      }
    });

    // Load transactions from proper API
    this.txService.getHistory().subscribe({
      next: (resp) => {
        const list: TransactionDto[] = (resp as any)?.data ?? (resp as any) ?? [];
        const transactions = Array.isArray(list) ? list : [];

        // Map transactions for display
        const recent = transactions.slice(0, 5);
        this.recentTransactions = recent.map(t => ({
          type: this.getTransactionType(t),
          date: new Date(t.createdAt),
          status: t.status
        }));

        // Calculate pending transactions (including flagged ones)
        this.pendingTransactions = transactions.filter(t =>
          String(t.status).toLowerCase() === 'pending' ||
          String(t.status).toLowerCase() === 'processing' ||
          String(t.status).toLowerCase() === 'flagged'
        ).length;
      },
      error: () => {
        this.recentTransactions = [];
        this.pendingTransactions = 0;
      }
    });

    // Load documents from proper API
    this.docService.getMyDocuments().subscribe({
      next: (resp) => {
        const docs = ((resp as any)?.data ?? (resp as any) ?? []) as any[];
        const documents = Array.isArray(docs) ? docs : [];

        this.totalDocuments = documents.length;

        // Calculate document statuses
        const pendingDocs = documents.filter(d =>
          String(d.status).toUpperCase() === 'PENDING' ||
          String(d.status).toUpperCase() === 'UNDER_REVIEW'
        ).length;

        const approvedDocs = documents.filter(d =>
          String(d.status).toUpperCase() === 'APPROVED' ||
          String(d.status).toUpperCase() === 'VERIFIED'
        ).length;

        this.pendingDocuments = pendingDocs;
        this.approvedDocuments = approvedDocs;
      },
      error: () => {
        this.totalDocuments = 0;
        this.pendingDocuments = 0;
        this.approvedDocuments = 0;
      }
    });

    // Load accounts from proper API
    this.accountService.getMyAccounts().subscribe({
      next: (resp) => {
        const accs = ((resp as any)?.data ?? (resp as any) ?? []) as AccountDto[];
        this.accounts = Array.isArray(accs) ? accs : [];

        // Calculate active accounts based on status
        this.activeAccounts = this.accounts.filter(account =>
          account.status?.toUpperCase() === 'ACTIVE' ||
          account.approvalStatus?.toUpperCase() === 'APPROVED'
        ).length;
      },
      error: () => {
        this.accounts = [];
        this.activeAccounts = 0;
      }
    });

    // Load alerts from proper API
    this.customerService.getMyAlerts().subscribe({
      next: (resp) => {
        const alerts = ((resp as any)?.data ?? (resp as any) ?? []) as any[];
        this.alertsCount = Array.isArray(alerts) ? alerts.length : 0;

        // Map alerts for dashboard display
        this.transactionAlerts = (alerts || []).slice(0, 3).map(alert => ({
          id: alert.id || alert.alertId || 0,
          title: this.getAlertTitle(alert),
          message: this.getAlertMessage(alert),
          type: this.getAlertType(alert),
          severity: alert.severity || alert.priority || 'MEDIUM',
          status: alert.status || 'ACTIVE',
          createdAt: alert.createdAt || alert.timestamp || new Date().toISOString(),
          updatedAt: alert.updatedAt || alert.createdAt || new Date().toISOString(),
          category: alert.category || alert.alertType || null,
          priority: alert.priority || alert.severity || 'MEDIUM',
          description: alert.description || alert.details || null,
          actionRequired: alert.actionRequired || false,
          resolvedAt: alert.resolvedAt || null,
          resolvedBy: alert.resolvedBy || null,
          reason: alert.reason || alert.flaggedReason || alert.description || null,
          flaggedReason: alert.flaggedReason || alert.reason || null,
          transactionId: alert.transactionId || alert.transactionReference || alert.txId || null,
          accountNumber: alert.accountNumber || alert.accountId || null
        }));
        this.isLoadingAlerts = false;
      },
      error: () => {
        this.alertsCount = 0;
        this.transactionAlerts = [];
        this.isLoadingAlerts = false;
      }
    });
  }

  private getTransactionType(transaction: TransactionDto): string {
    return transaction.transactionType ||
           (transaction as any).type ||
           (transaction as any).operationType ||
           'Transaction';
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'approved':
        return 'bg-success';
      case 'pending':
      case 'processing':
        return 'bg-warning';
      case 'rejected':
      case 'failed':
        return 'bg-danger';
      case 'flagged':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  }

  getSeverityClass(severity: string): string {
    switch (severity?.toUpperCase()) {
      case 'HIGH': return 'bg-danger';
      case 'MEDIUM': return 'bg-warning';
      case 'LOW': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  getReasonText(alert: any): string {
    // Try multiple possible field names for the reason
    return alert.reason || alert.flaggedReason || alert.description || '';
  }

  private getAlertTitle(alert: any): string {
    return alert.title || alert.alertTitle || alert.name || alert.subject ||
           (alert.type ? `${alert.type} Alert` : 'Transaction Alert');
  }

  private getAlertMessage(alert: any): string {
    return alert.message || alert.alertMessage || alert.description || alert.details ||
           alert.content || 'A transaction alert has been generated for your account.';
  }

  private getAlertType(alert: any): string {
    return alert.type || alert.alertType || alert.category || 'TRANSACTION';
  }
}
