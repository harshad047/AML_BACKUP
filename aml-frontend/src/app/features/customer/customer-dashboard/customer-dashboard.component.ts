import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../shared/models/auth.models';
import { TransactionService, TransactionDto } from '../../../core/services/transaction.service';
import { DocumentService, DocumentDto } from '../../../core/services/document.service';
import { AccountService, AccountDto } from '../../../core/services/account.service';
import { CustomerService } from '../../../core/services/customer.service';

interface Transaction {
  type: string;
  date: Date;
  status: string;
}

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['./customer-dashboard.component.css']
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
      next: (transactionsData) => {
        // Backend returns TransactionDto[] directly
        const transactions = Array.isArray(transactionsData) ? transactionsData : [];

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

        // Dynamically compute KYC status from documents unless it's explicitly REJECTED
        const currentKyc = (this.kycStatus || 'PENDING').toUpperCase();
        if (currentKyc !== 'REJECTED') {
          this.kycStatus = approvedDocs > 0 ? 'VERIFIED' : 'PENDING';
        }
      },
      error: () => {
        this.totalDocuments = 0;
        this.pendingDocuments = 0;
        this.approvedDocuments = 0;
      }
    });

    // Load accounts from proper API
    this.accountService.getMyAccounts().subscribe({
      next: (accountsData) => {
        // Backend returns AccountDto[] directly
        this.accounts = Array.isArray(accountsData) ? accountsData : [];

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
