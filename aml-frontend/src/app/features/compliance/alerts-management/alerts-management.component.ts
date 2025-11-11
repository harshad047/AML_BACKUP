import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComplianceService } from '../../../core/services/compliance.service';
import { ToastService } from '../../../core/services/toast.service';
import { AlertDto, CaseDto } from '../../../core/models/compliance.models';

@Component({
  selector: 'app-alerts-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './alerts-management.component.html',
  styleUrls: ['./alerts-management.component.css']
})
export class AlertsManagementComponent implements OnInit {
  alerts: AlertDto[] = [];
  filteredAlerts: AlertDto[] = [];
  selectedAlert: AlertDto | null = null;
  loading = false;
  error: string | null = null;
  showEscalateModal = false;
  alertToEscalate: number | null = null;

  // Filters
  statusFilter = '';
  riskFilter = '';
  searchTerm = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  paginatedAlerts: AlertDto[] = [];
  pages: number[] = [];

  constructor(
    private complianceService: ComplianceService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadAlerts();
  }

  loadAlerts(): void {
    this.loading = true;
    this.error = null;

    this.complianceService.getAllAlerts().subscribe({
      next: (alerts) => {
        this.alerts = alerts;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading alerts:', error);
        this.error = 'Failed to load alerts';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredAlerts = this.alerts.filter(alert => {
      // Status filter
      if (this.statusFilter && alert.status !== this.statusFilter) {
        return false;
      }

      // Risk filter
      if (this.riskFilter) {
        const riskScore = alert.riskScore;
        switch (this.riskFilter) {
          case 'high':
            if (riskScore < 80) return false;
            break;
          case 'medium':
            if (riskScore < 60 || riskScore >= 80) return false;
            break;
          case 'low':
            if (riskScore >= 60) return false;
            break;
        }
      }

      // Search term filter
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        return alert.reason.toLowerCase().includes(searchLower) ||
               alert.id.toString().includes(searchLower) ||
               alert.transactionId.toString().includes(searchLower);
      }

      return true;
    });

    // Reset to first page when filters change
    this.currentPage = 1;
    this.updatePagination();
  }

  getRiskScoreClass(riskScore: number): string {
    if (riskScore >= 80) return 'risk-high';
    if (riskScore >= 60) return 'risk-medium';
    return 'risk-low';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'OPEN': return 'status-open';
      case 'ESCALATED': return 'status-escalated';
      case 'RESOLVED': return 'status-resolved';
      default: return 'status-open';
    }
  }

  getAlertRowClass(riskScore: number): string {
    if (riskScore >= 80) return 'alert-row-high';
    if (riskScore >= 60) return 'alert-row-medium';
    return 'alert-row-low';
  }

  viewAlertDetails(alert: AlertDto): void {
    this.selectedAlert = alert;
    // Load full alert details with transaction
    this.complianceService.getAlertById(alert.id).subscribe({
      next: (fullAlert) => {
        this.selectedAlert = fullAlert;
        // Show Bootstrap modal
        const modalElement = document.getElementById('alertDetailsModal');
        if (modalElement) {
          const modal = new (window as any).bootstrap.Modal(modalElement);
          modal.show();
        } else {
          console.error('Modal element not found');
        }
      },
      error: (error) => {
        console.error('Error loading alert details:', error);
        this.error = 'Failed to load alert details. Please try again.';
      }
    });
  }

  viewTransaction(transactionId: number): void {
    // Navigate to transaction details
    console.log('View transaction:', transactionId);
    // TODO: Implement navigation to transaction details
  }

  escalateToCase(alertId: number): void {
    this.alertToEscalate = alertId;
    this.showEscalateModal = true;
  }

  confirmEscalate(): void {
    if (this.alertToEscalate === null) return;
    
    const alertId = this.alertToEscalate;
    this.showEscalateModal = false;
    this.loading = true;
    
    this.complianceService.createCaseFromAlert(alertId).subscribe({
      next: (caseData) => {
        this.loading = false;
        
        // Show success toast
        this.toastService.success(
          `Case #${caseData.id} has been created successfully. Alert #${alertId} has been escalated for investigation.`,
          6000
        );
        
        // Update the alert status locally
        const alertItem = this.alerts.find(a => a.id === alertId);
        if (alertItem) {
          alertItem.status = 'ESCALATED';
        }
        
        // Close the details modal if open
        this.selectedAlert = null;
        
        // Refresh alerts
        this.loadAlerts();
        
        // Reset
        this.alertToEscalate = null;
      },
      error: (error) => {
        this.loading = false;
        console.error('Error creating case:', error);
        
        // Show error toast
        this.toastService.error(
          error?.error?.message || 'Failed to create case. Please try again.',
          6000
        );
        
        this.alertToEscalate = null;
      }
    });
  }

  cancelEscalate(): void {
    this.showEscalateModal = false;
    this.alertToEscalate = null;
  }

  // Pagination methods
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredAlerts.length / this.itemsPerPage);
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
    this.paginatedAlerts = this.filteredAlerts.slice(startIndex, endIndex);
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
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredAlerts.length);
  }
}
