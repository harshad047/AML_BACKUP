import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../core/services/auth.service';

@Component({
  selector: 'app-compliance-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <h1 class="mb-4">Compliance Dashboard</h1>
          <p class="text-muted">Welcome back, {{ currentUser?.firstName }}!</p>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card bg-warning text-white">
            <div class="card-body">
              <h5 class="card-title">Open Alerts</h5>
              <h3>{{ openAlerts }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-danger text-white">
            <div class="card-body">
              <h5 class="card-title">Active Cases</h5>
              <h3>{{ activeCases }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-info text-white">
            <div class="card-body">
              <h5 class="card-title">Pending Reviews</h5>
              <h3>{{ pendingReviews }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-success text-white">
            <div class="card-body">
              <h5 class="card-title">Resolved Today</h5>
              <h3>{{ resolvedToday }}</h3>
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
              <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-primary active">All</button>
                <button class="btn btn-outline-danger">High Priority</button>
                <button class="btn btn-outline-warning">Medium Priority</button>
              </div>
            </div>
            <div class="card-body">
              <div class="text-center text-muted py-4" *ngIf="recentAlerts.length === 0">
                <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                <p>No alerts at this time</p>
              </div>
              <div class="list-group list-group-flush" *ngIf="recentAlerts.length > 0">
                <div class="list-group-item d-flex justify-content-between align-items-center"
                     *ngFor="let alert of recentAlerts">
                  <div>
                    <strong>{{ alert.title }}</strong>
                    <br>
                    <small class="text-muted">{{ alert.description }}</small>
                    <br>
                    <small class="text-muted">{{ alert.timestamp | date:'short' }}</small>
                  </div>
                  <div class="text-end">
                    <span class="badge mb-2" [ngClass]="getPriorityClass(alert.priority)">
                      {{ alert.priority }}
                    </span>
                    <br>
                    <button class="btn btn-sm btn-outline-primary">Review</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Active Investigations</h5>
            </div>
            <div class="card-body">
              <div class="text-center text-muted py-4" *ngIf="activeInvestigations.length === 0">
                <i class="fas fa-search fa-3x mb-3"></i>
                <p>No active investigations</p>
              </div>
              <div class="list-group list-group-flush" *ngIf="activeInvestigations.length > 0">
                <div class="list-group-item d-flex justify-content-between align-items-center"
                     *ngFor="let investigation of activeInvestigations">
                  <div>
                    <strong>{{ investigation.caseId }}</strong>
                    <br>
                    <small class="text-muted">{{ investigation.customer }}</small>
                  </div>
                  <span class="badge bg-warning">In Progress</span>
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
                <button class="btn btn-outline-danger">
                  <i class="fas fa-exclamation-triangle me-2"></i>
                  Review Alerts
                </button>
                <button class="btn btn-outline-primary">
                  <i class="fas fa-plus me-2"></i>
                  Create Case
                </button>
                <button class="btn btn-outline-info">
                  <i class="fas fa-exchange-alt me-2"></i>
                  Review Transactions
                </button>
                <button class="btn btn-outline-success">
                  <i class="fas fa-file-text me-2"></i>
                  Generate Report
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
  openAlerts = 0;
  activeCases = 0;
  pendingReviews = 0;
  resolvedToday = 0;

  recentAlerts: any[] = [
    // Sample data - will be replaced with actual API calls
  ];

  activeInvestigations: any[] = [
    // Sample data - will be replaced with actual API calls
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Load dashboard data
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    // TODO: Implement API calls to load actual data
  }

  getPriorityClass(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-danger';
      case 'medium': return 'bg-warning';
      case 'low': return 'bg-info';
      default: return 'bg-secondary';
    }
  }
}
