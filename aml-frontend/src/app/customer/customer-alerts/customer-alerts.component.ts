import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { AuthService, User } from '../../core/services/auth.service';

export interface AlertDto {
  id: number;
  title: string;
  message: string;
  type: string;
  severity: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  category?: string;
  priority?: string;
  description?: string;
  actionRequired?: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  reason?: string; // Reason for transaction being flagged
  flaggedReason?: string; // Alternative field name for reason
  transactionId?: string; // Transaction reference
  accountNumber?: string; // Associated account
}

@Component({
  selector: 'app-customer-alerts',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h1 class="mb-0">My Alerts</h1>
            <a class="btn btn-outline-primary" routerLink="/customer">
              <i class="fas fa-arrow-left me-2"></i>
              Back to Dashboard
            </a>
          </div>
          <p class="text-muted">View and manage your transaction alerts and notifications</p>
        </div>
      </div>

      <!-- Alerts Summary Cards -->
      <div class="row mb-4" *ngIf="alerts.length > 0">
        <div class="col-md-3">
          <div class="card bg-warning text-white">
            <div class="card-body text-center">
              <h5 class="card-title">Total Alerts</h5>
              <h2>{{ alerts.length }}</h2>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-danger text-white">
            <div class="card-body text-center">
              <h5 class="card-title">High Priority</h5>
              <h2>{{ highPriorityCount }}</h2>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-info text-white">
            <div class="card-body text-center">
              <h5 class="card-title">Pending Actions</h5>
              <h2>{{ pendingActionsCount }}</h2>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-success text-white">
            <div class="card-body text-center">
              <h5 class="card-title">Resolved</h5>
              <h2>{{ resolvedCount }}</h2>
            </div>
          </div>
        </div>
      </div>

      <!-- Alerts List -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Alert History</h5>
            </div>
            <div class="card-body">
              <!-- Loading State -->
              <div class="text-center py-4" *ngIf="isLoading">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading alerts...</p>
              </div>

              <!-- Empty State -->
              <div class="text-center text-muted py-4" *ngIf="!isLoading && alerts.length === 0">
                <i class="fas fa-bell-slash fa-3x mb-3"></i>
                <p>No alerts found</p>
                <small>All your alerts will appear here when they are generated.</small>
              </div>

              <!-- Alerts Table -->
              <div class="table-responsive" *ngIf="!isLoading && alerts.length > 0">
                <table class="table table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Title</th>
                      <th>Message</th>
                      <th>Type</th>
                      <th>Severity</th>
                      <th>Status</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let alert of alerts" [class]="'alert-row ' + getSeverityClass(alert.severity)">
                      <td>{{ alert.createdAt | date:'medium' }}</td>
                      <td>
                        <strong class="text-dark">{{ alert.title }}</strong>
                        <div class="text-muted small" *ngIf="alert.category">{{ alert.category }}</div>
                        <div class="text-muted small" *ngIf="alert.transactionId">TX: {{ alert.transactionId }}</div>
                      </td>
                      <td class="text-dark">{{ alert.message }}</td>
                      <td>
                        <span class="badge bg-secondary">{{ alert.type }}</span>
                      </td>
                      <td>
                        <span class="badge" [ngClass]="getSeverityBadgeClass(alert.severity)">
                          {{ alert.severity }}
                        </span>
                      </td>
                      <td>
                        <span class="badge" [ngClass]="getStatusBadgeClass(alert.status)">
                          {{ alert.status }}
                        </span>
                      </td>
                      <td>
                        <span class="text-muted small">
                          {{ getReasonText(alert) || 'No specific reason provided' }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Alert Details Modal (placeholder for future enhancement) -->
      <div class="row" *ngIf="selectedAlert">
        <div class="col-12">
          <div class="card mt-3">
            <div class="card-header">
              <h5 class="mb-0">Alert Details</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <h6>Alert Information</h6>
                  <table class="table table-sm">
                    <tr>
                      <td><strong>ID:</strong></td>
                      <td>{{ selectedAlert.id }}</td>
                    </tr>
                    <tr>
                      <td><strong>Title:</strong></td>
                      <td>{{ selectedAlert.title }}</td>
                    </tr>
                    <tr>
                      <td><strong>Type:</strong></td>
                      <td>{{ selectedAlert.type }}</td>
                    </tr>
                    <tr>
                      <td><strong>Transaction ID:</strong></td>
                      <td>{{ selectedAlert.transactionId || 'N/A' }}</td>
                    </tr>
                    <tr>
                      <td><strong>Account:</strong></td>
                      <td>{{ selectedAlert.accountNumber || 'N/A' }}</td>
                    </tr>
                  </table>
                </div>
                <div class="col-md-6">
                  <h6>Description & Resolution</h6>
                  <p><strong>Description:</strong></p>
                  <p>{{ selectedAlert.description || 'No description provided' }}</p>
                  <p><strong>Message:</strong></p>
                  <p>{{ selectedAlert.message }}</p>
                  <p *ngIf="selectedAlert.resolvedAt">
                    <strong>Resolved At:</strong> {{ selectedAlert.resolvedAt | date:'medium' }}
                  </p>
                  <p *ngIf="selectedAlert.resolvedBy">
                    <strong>Resolved By:</strong> {{ selectedAlert.resolvedBy }}
                  </p>
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

    .table th {
      border-top: none;
      font-weight: 600;
      color: #495057;
      background-color: #f8f9fa;
    }

    .table td {
      color: #212529;
      vertical-align: middle;
    }

    .alert-row {
      transition: background-color 0.2s ease;
    }

    .alert-row:hover {
      background-color: #f8f9fa;
    }

    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
    }

    .text-dark {
      color: #212529 !important;
    }
  `]
})
export class CustomerAlertsComponent implements OnInit {
  currentUser: User | null = null;
  alerts: AlertDto[] = [];
  isLoading = false;
  selectedAlert: AlertDto | null = null;

  constructor(private customerService: CustomerService, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user: User | null) => {
      this.currentUser = user;
    });

    this.loadAlerts();
  }

  private loadAlerts(): void {
    this.isLoading = true;
    this.customerService.getMyAlerts().subscribe({
      next: (resp) => {
        const alertsData = ((resp as any)?.data ?? (resp as any) ?? []) as any[];
        console.log('Raw alerts data:', alertsData); // Debug log

        this.alerts = Array.isArray(alertsData) ? alertsData.map(alert => ({
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
        } as AlertDto)) : [];

        console.log('Mapped alerts:', this.alerts); // Debug log
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading alerts:', error);
        this.alerts = [];
        this.isLoading = false;
      }
    });
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

  get highPriorityCount(): number {
    return this.alerts.filter(alert => alert.severity?.toUpperCase() === 'HIGH' || alert.priority === 'HIGH').length;
  }

  get pendingActionsCount(): number {
    return this.alerts.filter(alert => alert.actionRequired).length;
  }

  get resolvedCount(): number {
    return this.alerts.filter(alert => alert.status?.toUpperCase() === 'RESOLVED').length;
  }

  getSeverityClass(severity: string): string {
    switch (severity?.toUpperCase()) {
      case 'HIGH': return 'table-warning';
      case 'MEDIUM': return 'table-info';
      case 'LOW': return 'table-light';
      default: return '';
    }
  }

  getSeverityBadgeClass(severity: string): string {
    switch (severity?.toUpperCase()) {
      case 'HIGH': return 'bg-danger';
      case 'MEDIUM': return 'bg-warning';
      case 'LOW': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'RESOLVED': return 'bg-success';
      case 'PENDING': return 'bg-warning';
      case 'ACTIVE': return 'bg-info';
      default: return 'bg-secondary';
    }
  }

  viewAlertDetails(alert: AlertDto): void {
    this.selectedAlert = alert;
  }

  closeAlertDetails(): void {
    this.selectedAlert = null;
  }

  getReasonText(alert: AlertDto): string {
    // Try multiple possible field names for the reason
    return alert.reason || alert.flaggedReason || alert.description || '';
  }
}
