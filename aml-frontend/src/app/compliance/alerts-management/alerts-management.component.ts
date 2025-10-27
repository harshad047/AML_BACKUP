import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComplianceService } from '../../core/services/compliance.service';
import { AlertDto, CaseDto } from '../../core/models/compliance.models';

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
      <div class="row mb-4">
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
                <table class="table table-hover mb-0">
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
                        <span class="badge" [ngClass]="getRiskScoreClass(alert.riskScore)">
                          {{ alert.riskScore }}
                        </span>
                      </td>
                      <td>
                        <span class="badge" [ngClass]="getStatusClass(alert.status)">
                          {{ alert.status }}
                        </span>
                      </td>
                      <td>
                        <small>{{ alert.createdAt | date:'short' }}</small>
                      </td>
                      <td>
                        <div class="btn-group btn-group-sm">
                          <button class="btn btn-outline-primary" 
                                  (click)="viewAlertDetails(alert)">
                            <i class="fas fa-eye"></i>
                          </button>
                          <button class="btn btn-outline-warning" 
                                  (click)="escalateToCase(alert.id)"
                                  [disabled]="alert.status !== 'OPEN'">
                            <i class="fas fa-level-up-alt"></i>
                          </button>
                        </div>
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
    </div>
  `,
  styles: [`
    .table-responsive {
      border-radius: 0.375rem;
    }
    
    .alert-row-high { background-color: #fff5f5; }
    .alert-row-medium { background-color: #fffbf0; }
    .alert-row-low { background-color: #f0f9ff; }
    
    .text-truncate {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `]
})
export class AlertsManagementComponent implements OnInit {
  alerts: AlertDto[] = [];
  filteredAlerts: AlertDto[] = [];
  selectedAlert: AlertDto | null = null;
  loading = false;
  error: string | null = null;

  // Filters
  statusFilter = '';
  riskFilter = '';
  searchTerm = '';

  constructor(private complianceService: ComplianceService) {}

  ngOnInit(): void {
    this.loadAlerts();
  }

  loadAlerts(): void {
    this.loading = true;
    this.error = null;

    this.complianceService.getAllOpenAlerts().subscribe({
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
    if (riskScore >= 80) return 'bg-danger';
    if (riskScore >= 60) return 'bg-warning';
    if (riskScore >= 40) return 'bg-info';
    return 'bg-success';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'OPEN': return 'bg-warning';
      case 'ESCALATED': return 'bg-info';
      case 'RESOLVED': return 'bg-success';
      default: return 'bg-secondary';
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
        // Show modal (you might want to use a proper modal service)
        const modal = document.getElementById('alertDetailsModal');
        if (modal) {
          // Bootstrap modal show logic would go here
          console.log('Show modal for alert:', fullAlert);
        }
      },
      error: (error) => {
        console.error('Error loading alert details:', error);
      }
    });
  }

  viewTransaction(transactionId: number): void {
    // Navigate to transaction details
    console.log('View transaction:', transactionId);
    // TODO: Implement navigation to transaction details
  }

  escalateToCase(alertId: number): void {
    if (confirm('Are you sure you want to escalate this alert to a case for investigation?')) {
      this.loading = true;
      this.complianceService.createCaseFromAlert(alertId).subscribe({
        next: (caseData) => {
          this.loading = false;
          alert(`Case #${caseData.id} has been created successfully. The alert has been escalated for investigation.`);
          
          // Update the alert status locally
          const alertItem = this.alerts.find(a => a.id === alertId);
          if (alertItem) {
            alertItem.status = 'ESCALATED';
          }
          
          // Close the modal
          this.selectedAlert = null;
          
          // Refresh alerts
          this.loadAlerts();
        },
        error: (error) => {
          this.loading = false;
          console.error('Error creating case:', error);
          alert('Failed to create case. Please try again.');
        }
      });
    }
  }
}
