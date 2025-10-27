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
  templateUrl: './customer-alerts.component.html',
  styleUrls: ['./customer-alerts.component.css']
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
