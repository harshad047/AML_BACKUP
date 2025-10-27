import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, User } from '../../core/services/auth.service';
import { ComplianceService } from '../../core/services/compliance.service';
import { AlertDto, CaseDto, ComplianceDashboardStats } from '../../core/models/compliance.models';

@Component({
  selector: 'app-compliance-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <h1 class="mb-4">Compliance Dashboard</h1>
          <p class="text-muted">Welcome back, {{ currentUser?.firstName }}!</p>
        </div>
      </div>

      <!-- Loading State -->
      <div class="row mb-4" *ngIf="loading">
        <div class="col-12 text-center">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2">Loading dashboard data...</p>
        </div>
      </div>

      <!-- Error State -->
      <div class="row mb-4" *ngIf="error && !loading">
        <div class="col-12">
          <div class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i>
            {{ error }}
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="row mb-4" *ngIf="!loading">
        <div class="col-md-3">
          <div class="card bg-warning text-white">
            <div class="card-body">
              <h5 class="card-title">Open Alerts</h5>
              <h3>{{ stats.openAlerts }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-danger text-white">
            <div class="card-body">
              <h5 class="card-title">Active Cases</h5>
              <h3>{{ stats.activeCases }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-info text-white">
            <div class="card-body">
              <h5 class="card-title">Pending Reviews</h5>
              <h3>{{ stats.pendingReviews }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-success text-white">
            <div class="card-body">
              <h5 class="card-title">Resolved Today</h5>
              <h3>{{ stats.resolvedToday }}</h3>
            </div>
          </div>
        </div>
      </div>

      <!-- Alerts and Cases -->
      <div class="row">
        <div class="col-md-8">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Recent Alerts</h5>
              <button class="btn btn-sm btn-outline-primary" routerLink="/compliance/alerts">
                View All
              </button>
            </div>
            <div class="card-body">
              <div class="text-center text-muted py-4" *ngIf="recentAlerts.length === 0 && !loading">
                <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                <p>No alerts at this time</p>
              </div>
              <div class="list-group list-group-flush" *ngIf="recentAlerts.length > 0">
                <div class="list-group-item d-flex justify-content-between align-items-center"
                     *ngFor="let alert of recentAlerts">
                  <div>
                    <strong>Alert #{{ alert.id }}</strong>
                    <br>
                    <small class="text-muted">{{ alert.reason }}</small>
                    <br>
                    <small class="text-muted">{{ alert.createdAt | date:'short' }}</small>
                  </div>
                  <div class="text-end">
                    <span class="badge mb-2" [ngClass]="getRiskScoreClass(alert.riskScore)">
                      Risk: {{ alert.riskScore }}
                    </span>
                    <br>
                    <button class="btn btn-sm btn-outline-primary" 
                            (click)="viewAlert(alert.id)">
                      Review
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Active Investigations</h5>
              <button class="btn btn-sm btn-outline-primary" routerLink="/compliance/cases">
                View All
              </button>
            </div>
            <div class="card-body">
              <div class="text-center text-muted py-4" *ngIf="activeInvestigations.length === 0 && !loading">
                <i class="fas fa-search fa-3x mb-3"></i>
                <p>No active investigations</p>
              </div>
              <div class="list-group list-group-flush" *ngIf="activeInvestigations.length > 0">
                <div class="list-group-item d-flex justify-content-between align-items-center"
                     *ngFor="let case of activeInvestigations">
                  <div>
                    <strong>Case #{{ case.id }}</strong>
                    <br>
                    <small class="text-muted">Assigned to: {{ case.assignedTo }}</small>
                    <br>
                    <small class="text-muted">{{ case.createdAt | date:'short' }}</small>
                  </div>
                  <span class="badge bg-warning">{{ case.status }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card mt-3">
            <div class="card-header">
              <h5 class="mb-0">Quick Actions</h5>
            </div>
            <div class="card-body">
              <div class="d-grid gap-2">
                <button class="btn btn-outline-danger" routerLink="/compliance/alerts">
                  <i class="fas fa-exclamation-triangle me-2"></i>
                  Review Alerts
                </button>
                <button class="btn btn-outline-info" routerLink="/compliance/transactions">
                  <i class="fas fa-exchange-alt me-2"></i>
                  Review Transactions
                </button>
                <button class="btn btn-outline-primary" routerLink="/compliance/cases">
                  <i class="fas fa-folder-open me-2"></i>
                  Manage Cases
                </button>
                <button class="btn btn-outline-success" (click)="refreshDashboard()">
                  <i class="fas fa-sync-alt me-2"></i>
                  Refresh Data
                </button>
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
    }

    .btn-sm {
      font-size: 0.75rem;
    }
  `]
})
export class ComplianceDashboardComponent implements OnInit {
  currentUser: User | null = null;
  stats: ComplianceDashboardStats = {
    openAlerts: 0,
    activeCases: 0,
    pendingReviews: 0,
    resolvedToday: 0
  };
  
  recentAlerts: AlertDto[] = [];
  activeInvestigations: CaseDto[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private complianceService: ComplianceService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    // Load dashboard statistics
    this.complianceService.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        this.error = 'Failed to load dashboard statistics';
      }
    });

    // Load recent alerts (limit to 5 most recent)
    this.complianceService.getAllOpenAlerts().subscribe({
      next: (alerts) => {
        this.recentAlerts = alerts.slice(0, 5);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading alerts:', error);
        this.error = 'Failed to load recent alerts';
        this.loading = false;
      }
    });

    // Load active investigations
    this.complianceService.getCasesUnderInvestigation().subscribe({
      next: (cases) => {
        this.activeInvestigations = cases.slice(0, 5);
      },
      error: (error) => {
        console.error('Error loading cases:', error);
      }
    });
  }

  getRiskScoreClass(riskScore: number): string {
    if (riskScore >= 80) return 'bg-danger';
    if (riskScore >= 60) return 'bg-warning';
    if (riskScore >= 40) return 'bg-info';
    return 'bg-success';
  }

  viewAlert(alertId: number): void {
    // Navigate to alert details or open modal
    console.log('Viewing alert:', alertId);
    // TODO: Implement navigation to alert details
  }

  refreshDashboard(): void {
    this.loadDashboardData();
  }
}
