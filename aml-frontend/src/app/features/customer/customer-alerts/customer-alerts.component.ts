import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CustomerService } from '../../../core/services/customer.service';
import { AuthService, User } from '../../../core/services/auth.service';

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
  imports: [CommonModule, FormsModule, RouterModule, DatePipe],
  templateUrl: './customer-alerts.component.html',
  styleUrls: ['./customer-alerts.component.css']
})
export class CustomerAlertsComponent implements OnInit {
  currentUser: User | null = null;
  alerts: AlertDto[] = [];
  paginatedAlerts: AlertDto[] = [];
  isLoading = false;
  selectedAlert: AlertDto | null = null;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  pages: number[] = [];

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
        this.updatePagination();
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
    // Open Bootstrap modal
    const modalElement = document.getElementById('alertDetailsModal');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  closeAlertDetails(): void {
    this.selectedAlert = null;
    // Close Bootstrap modal
    const modalElement = document.getElementById('alertDetailsModal');
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
  }

  getReasonText(alert: AlertDto): string {
    // Try multiple possible field names for the reason
    return alert.reason || alert.flaggedReason || alert.description || '';
  }

  getTypeBadgeClass(type: string): string {
    switch (type?.toUpperCase()) {
      case 'TRANSACTION': return 'bg-primary';
      case 'SECURITY': return 'bg-danger';
      case 'ACCOUNT': return 'bg-info';
      case 'SYSTEM': return 'bg-warning';
      default: return 'bg-secondary';
    }
  }

  // Pagination methods
  updatePagination(): void {
    this.totalPages = Math.ceil(this.alerts.length / this.itemsPerPage);
    this.updatePageNumbers();
    this.paginateAlerts();
  }

  updatePageNumbers(): void {
    this.pages = [];
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      this.pages.push(i);
    }
  }

  paginateAlerts(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedAlerts = this.alerts.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePageNumbers();
      this.paginateAlerts();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  changeItemsPerPage(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  getStartItem(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getEndItem(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.alerts.length);
  }
}
