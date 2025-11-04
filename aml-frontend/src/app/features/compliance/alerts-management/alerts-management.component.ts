import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComplianceService } from '../../../core/services/compliance.service';
import { ToastService } from '../../../core/services/toast.service';
import { AlertDto, CaseDto } from '../../../shared/models/compliance.models';

@Component({
  selector: 'app-alerts-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h1>Alert Management</h1>
            <button class="btn btn-secondary" routerLink="/compliance">
              <i class="fas fa-arrow-left me-2"></i>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="row mb-4 filters-bar align-items-center g-2">
        <div class="col-md-3">
          <select class="form-select" [(ngModel)]="statusFilter" (change)="applyFilters()">
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="ESCALATED">Escalated</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
        <div class="col-md-3">
          <select class="form-select" [(ngModel)]="riskFilter" (change)="applyFilters()">
            <option value="">All Risk Levels</option>
            <option value="high">High Risk (80+)</option>
            <option value="medium">Medium Risk (60-79)</option>
            <option value="low">Low Risk (<60)</option>
          </select>
        </div>
        <div class="col-md-4">
          <input type="text" class="form-control" placeholder="Search alerts..." 
                 [(ngModel)]="searchTerm" (input)="applyFilters()">
        </div>
        <div class="col-md-2">
          <button class="btn btn-primary w-100" (click)="loadAlerts()">
            <i class="fas fa-sync-alt me-2"></i>
            Refresh
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div class="row" *ngIf="loading">
        <div class="col-12 text-center">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2">Loading alerts...</p>
        </div>
      </div>

      <!-- Error State -->
      <div class="row" *ngIf="error && !loading">
        <div class="col-12">
          <div class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i>
            {{ error }}
          </div>
        </div>
      </div>

      <!-- Alerts Table -->
      <div class="row" *ngIf="!loading">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Alerts ({{ filteredAlerts.length }})</h5>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover modern-table mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>Alert ID</th>
                      <th>Transaction ID</th>
                      <th>Reason</th>
                      <th>Risk Score</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngIf="filteredAlerts.length === 0">
                      <td colspan="7" class="text-center py-4 text-muted">
                        No alerts found matching your criteria
                      </td>
                    </tr>
                    <tr *ngFor="let alert of filteredAlerts" 
                        [class]="getAlertRowClass(alert.riskScore)">
                      <td>
                        <strong>#{{ alert.id }}</strong>
                      </td>
                      <td>
                        <a href="#" (click)="viewTransaction(alert.transactionId)" 
                           class="text-decoration-none">
                          #{{ alert.transactionId }}
                        </a>
                      </td>
                      <td>
                        <span class="text-truncate d-inline-block" style="max-width: 200px;" 
                              [title]="alert.reason">
                          {{ alert.reason }}
                        </span>
                      </td>
                      <td>
                        <span class="risk-chip" [ngClass]="getRiskScoreClass(alert.riskScore)">
                          {{ alert.riskScore }}
                        </span>
                      </td>
                      <td>
                        <span class="status-chip" [ngClass]="getStatusClass(alert.status)">
                          {{ alert.status }}
                        </span>
                      </td>
                      <td>
                        <small>{{ alert.createdAt | date:'short' }}</small>
                      </td>
                      <td>
                        <div class="d-flex gap-2" *ngIf="alert.status === 'OPEN'">
                          <button class="btn btn-sm btn-info" 
                                  (click)="viewAlertDetails(alert)"
                                  title="View alert details">
                            <i class="fas fa-eye me-1"></i>
                            View
                          </button>
                          <button class="btn btn-sm btn-warning" 
                                  (click)="escalateToCase(alert.id)"
                                  title="Create investigation case">
                            <i class="fas fa-search me-1"></i>
                            Investigate
                          </button>
                        </div>
                        <span *ngIf="alert.status !== 'OPEN'" class="text-muted small">
                          <i class="fas fa-check-circle me-1"></i>
                          {{ alert.status === 'ESCALATED' ? 'Under Investigation' : 'Resolved' }}
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

      <!-- Alert Details Modal -->
      <div class="modal fade" id="alertDetailsModal" tabindex="-1" *ngIf="selectedAlert">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Alert #{{ selectedAlert.id }} Details</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <div class="col-md-6">
                  <h6>Alert Information</h6>
                  <p><strong>ID:</strong> {{ selectedAlert.id }}</p>
                  <p><strong>Transaction ID:</strong> {{ selectedAlert.transactionId }}</p>
                  <p><strong>Reason:</strong> {{ selectedAlert.reason }}</p>
                  <p><strong>Risk Score:</strong> 
                    <span class="badge" [ngClass]="getRiskScoreClass(selectedAlert.riskScore)">
                      {{ selectedAlert.riskScore }}
                    </span>
                  </p>
                  <p><strong>Status:</strong> 
                    <span class="badge" [ngClass]="getStatusClass(selectedAlert.status)">
                      {{ selectedAlert.status }}
                    </span>
                  </p>
                  <p><strong>Created:</strong> {{ selectedAlert.createdAt | date:'medium' }}</p>
                </div>
                <div class="col-md-6" *ngIf="selectedAlert.transaction">
                  <h6>Transaction Details</h6>
                  <p><strong>Type:</strong> {{ selectedAlert.transaction.transactionType }}</p>
                  <p><strong>Amount:</strong> {{ selectedAlert.transaction.amount | currency:selectedAlert.transaction.currency }}</p>
                  <p><strong>From:</strong> {{ selectedAlert.transaction.fromAccountNumber || 'N/A' }}</p>
                  <p><strong>To:</strong> {{ selectedAlert.transaction.toAccountNumber || 'N/A' }}</p>
                  <p><strong>Status:</strong> {{ selectedAlert.transaction.status }}</p>
                  <p><strong>Description:</strong> {{ selectedAlert.transaction.description || 'N/A' }}</p>
                </div>
              </div>
              
              <!-- Obstructed Rules -->
              <div class="mt-3" *ngIf="selectedAlert.transaction && selectedAlert.transaction.obstructedRules && selectedAlert.transaction.obstructedRules.length > 0">
                <h6>Triggered Rules</h6>
                <div class="table-responsive">
                  <table class="table table-sm">
                    <thead>
                      <tr>
                        <th>Rule</th>
                        <th>Action</th>
                        <th>Risk Weight</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let rule of selectedAlert.transaction.obstructedRules">
                        <td>{{ rule.ruleName }}</td>
                        <td>
                          <span class="badge" [ngClass]="rule.action === 'BLOCK' ? 'bg-danger' : 'bg-warning'">
                            {{ rule.action }}
                          </span>
                        </td>
                        <td>{{ rule.riskWeight }}</td>
                        <td>{{ rule.details }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" class="btn btn-warning" 
                      (click)="escalateToCase(selectedAlert.id)"
                      [disabled]="selectedAlert.status !== 'OPEN'">
                Escalate to Case
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Escalate Confirmation Modal -->
      <div class="modal fade" [class.show]="showEscalateModal" [style.display]="showEscalateModal ? 'block' : 'none'" 
           tabindex="-1" role="dialog" aria-labelledby="escalateModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
          <div class="modal-content">
            <div class="modal-header border-0">
              <h5 class="modal-title fw-bold" id="escalateModalLabel">
                <i class="fas fa-search text-warning me-2"></i>
                Escalate to Investigation
              </h5>
              <button type="button" class="btn-close" (click)="cancelEscalate()" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p class="mb-0">Are you sure you want to escalate this alert to a case for investigation?</p>
              <div class="alert alert-info mt-3 mb-0">
                <i class="fas fa-info-circle me-2"></i>
                <small>This will create a new investigation case and change the alert status to <strong>ESCALATED</strong>.</small>
              </div>
            </div>
            <div class="modal-footer border-0">
              <button type="button" class="btn btn-secondary" (click)="cancelEscalate()">
                <i class="fas fa-times me-1"></i>Cancel
              </button>
              <button type="button" class="btn btn-warning" (click)="confirmEscalate()">
                <i class="fas fa-search me-1"></i>Escalate to Case
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Backdrop -->
      <div class="modal-backdrop fade" [class.show]="showEscalateModal" *ngIf="showEscalateModal"></div>
    </div>
  `,
  styles: [`
    /* Filters bar */
    .filters-bar .form-select,
    .filters-bar .form-control {
      border-radius: 0.5rem;
      border: 1px solid var(--border-color, #e9ecef);
      box-shadow: none;
    }
    .filters-bar .form-control:focus,
    .filters-bar .form-select:focus {
      border-color: var(--primary-bank-blue);
      box-shadow: 0 0 0 0.2rem rgba(46,163,242,0.15);
    }
    .filters-bar .btn-primary {
      background: linear-gradient(135deg, var(--primary-bank-blue), var(--primary-bank-blue-dark));
      border: none;
    }

    /* Card/header */
    .card { border: none; border-radius: 0.75rem; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .card-header { background: #fff; border-bottom: 1px solid #e9ecef; border-radius: 0.75rem 0.75rem 0 0 !important; }

    /* Table */
    .modern-table thead { 
      background: linear-gradient(135deg, var(--primary-bank-blue), var(--primary-bank-blue-dark));
    }
    .modern-table thead th { 
      font-size: 0.8rem; 
      text-transform: uppercase; 
      letter-spacing: .04em; 
      color: #fff !important;
      border-bottom: none;
    }
    .modern-table thead tr th:first-child { border-top-left-radius: 0.5rem; }
    .modern-table thead tr th:last-child { border-top-right-radius: 0.5rem; }
    .modern-table tbody td { vertical-align: middle; }
    .table-responsive { border-radius: 0.75rem; overflow: hidden; }
    .table-hover tbody tr:hover { background: #f8fbff; }

    /* Chips */
    .risk-chip, .status-chip { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; color: #fff; }
    .risk-low { background: linear-gradient(135deg, #28a745, #20c997); }
    .risk-medium { background: linear-gradient(135deg, #ffc107, #ff9800); }
    .risk-high { background: linear-gradient(135deg, #dc3545, #c82333); }
    .status-open { background: linear-gradient(135deg, var(--primary-bank-blue), var(--primary-bank-blue-dark)); }
    .status-escalated { background: linear-gradient(135deg, #17a2b8, #138496); }
    .status-resolved { background: linear-gradient(135deg, #28a745, #20c997); }

    /* Row tints by risk */
    .alert-row-high { background-color: #fff5f7; }
    .alert-row-medium { background-color: #fffaf2; }
    .alert-row-low { background-color: #f5fbff; }

    .text-truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* Modal Styles */
    .modal {
      background-color: rgba(0, 0, 0, 0.5);
    }

    .modal.show {
      display: block !important;
      animation: fadeIn 0.3s ease-in-out;
    }

    .modal-dialog-centered {
      display: flex;
      align-items: center;
      min-height: calc(100% - 1rem);
    }

    .modal-content {
      border-radius: 1rem;
      border: none;
      box-shadow: 0 0.5rem 2rem rgba(0, 0, 0, 0.2);
      animation: slideDown 0.3s ease-in-out;
    }

    .modal-header {
      padding: 1.5rem;
      background: linear-gradient(135deg, #fff8e1 0%, #ffffff 100%);
      border-radius: 1rem 1rem 0 0;
    }

    .modal-title {
      font-size: 1.25rem;
      color: #212529;
    }

    .modal-body {
      padding: 1.5rem;
      font-size: 1rem;
      color: #6c757d;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      background-color: #f8f9fa;
      border-radius: 0 0 1rem 1rem;
    }

    .modal-footer .btn {
      padding: 0.5rem 1.5rem;
      font-weight: 500;
      border-radius: 0.5rem;
      transition: all 0.3s ease;
    }

    .modal-footer .btn-secondary {
      background-color: #6c757d;
      border-color: #6c757d;
    }

    .modal-footer .btn-secondary:hover {
      background-color: #5a6268;
      border-color: #545b62;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(108, 117, 125, 0.3);
    }

    .modal-footer .btn-warning {
      background-color: #ffc107;
      border-color: #ffc107;
      color: #000;
    }

    .modal-footer .btn-warning:hover {
      background-color: #e0a800;
      border-color: #d39e00;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(255, 193, 7, 0.3);
    }

    .modal-backdrop.show {
      opacity: 0.5;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes slideDown {
      from {
        transform: translateY(-50px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `]
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
}
