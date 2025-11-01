import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../core/services/auth.service';
import { ComplianceService } from '../../core/services/compliance.service';
import { AlertDto, CaseDto, ComplianceDashboardStats } from '../../core/models/compliance.models';

@Component({
  selector: 'app-compliance-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <h1 class="mb-4">Compliance Dashboard</h1>
          <p class="text-muted">Welcome back, {{ currentUser?.firstName }}!</p>
        </div>
      </div>

      <!-- Loading State (Skeletons) -->
      <div class="row mb-4" *ngIf="loading">
        <div class="col-md-3 col-sm-6 mb-3" *ngFor="let i of [1,2,3,4]">
          <div class="stat-card skeleton">
            <div class="stat-icon"></div>
            <div class="w-100">
              <div class="skeleton-line w-50 mb-2"></div>
              <div class="skeleton-line w-25"></div>
            </div>
          </div>
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
        <div class="col-md-3 col-sm-6 mb-3">
          <div class="stat-card stat-warning">
            <div class="stat-icon"><i class="fas fa-bell"></i></div>
            <div class="stat-content">
              <div class="stat-label">Open Alerts</div>
              <div class="stat-number">{{ stats.openAlerts }}</div>
            </div>
            <div class="ms-auto sparkline">
              <span *ngFor="let v of trends.openAlerts" [style.height.px]="v"></span>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6 mb-3">
          <div class="stat-card stat-danger">
            <div class="stat-icon"><i class="fas fa-briefcase"></i></div>
            <div class="stat-content">
              <div class="stat-label">Active Cases</div>
              <div class="stat-number">{{ stats.activeCases }}</div>
            </div>
            <div class="ms-auto sparkline">
              <span *ngFor="let v of trends.activeCases" [style.height.px]="v"></span>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6 mb-3">
          <div class="stat-card stat-info">
            <div class="stat-icon"><i class="fas fa-user-check"></i></div>
            <div class="stat-content">
              <div class="stat-label">Pending Reviews</div>
              <div class="stat-number">{{ stats.pendingReviews }}</div>
            </div>
            <div class="ms-auto sparkline">
              <span *ngFor="let v of trends.pendingReviews" [style.height.px]="v"></span>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6 mb-3">
          <div class="stat-card stat-success">
            <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
            <div class="stat-content">
              <div class="stat-label">Resolved Today</div>
              <div class="stat-number">{{ stats.resolvedToday }}</div>
            </div>
            <div class="ms-auto sparkline">
              <span *ngFor="let v of trends.resolvedToday" [style.height.px]="v"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Alerts and Cases -->
      <div class="row">
        <div class="col-md-8">
          <div class="card">
            <div class="card-header d-flex flex-wrap gap-2 justify-content-between align-items-center">
              <h5 class="mb-0">Recent Alerts</h5>
              <div class="d-flex gap-2 align-items-center ms-auto">
                <input class="form-control form-control-sm" placeholder="Search alerts..." [(ngModel)]="alertsQuery">
                <select class="form-select form-select-sm" [(ngModel)]="alertsRiskFilter">
                  <option value="">All risks</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
                <button class="btn btn-sm btn-outline-primary" routerLink="/compliance/alerts">View All</button>
              </div>
            </div>
            <div class="card-body">
              <div class="text-center text-muted py-4" *ngIf="recentAlerts.length === 0 && !loading">
                <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                <p>No alerts at this time</p>
              </div>
              <div class="list-group list-group-flush" *ngIf="filteredAlerts().length > 0">
                <div class="list-group-item alert-item d-flex justify-content-between align-items-start"
                     *ngFor="let alert of filteredAlerts()">
                  <div class="alert-left">
                    <div class="alert-title">
                      <span class="id-pill">Alert #{{ alert.id }}</span>
                    </div>
                    <div class="alert-summary">{{ alert.reason }}</div>
                    <div class="alert-meta">
                      <span class="meta-item"><i class="far fa-clock me-1"></i>{{ alert.createdAt | date:'MMM d, y, h:mm a' }}</span>
                      <span class="meta-dot"></span>
                      <span class="meta-item"><i class="fas fa-shield-alt me-1"></i>Score: {{ alert.riskScore }}</span>
                    </div>
                  </div>
                  <div class="text-end alert-right">
                    <span class="risk-chip mb-2" [ngClass]="riskLevelClass(alert.riskScore)">
                      {{ riskLevelLabel(alert.riskScore) }} · {{ alert.riskScore }}
                    </span>
                    <div>
                      <button class="btn btn-sm btn-outline-primary" (click)="viewAlert(alert.id)">
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="text-center text-muted py-4" *ngIf="recentAlerts.length > 0 && filteredAlerts().length === 0">
                No alerts match your filters
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card">
            <div class="card-header d-flex flex-wrap gap-2 justify-content-between align-items-center">
              <h5 class="mb-0">Active Investigations</h5>
              <div class="d-flex gap-2 align-items-center ms-auto">
                <input class="form-control form-control-sm" placeholder="Search cases..." [(ngModel)]="casesQuery">
                <select class="form-select form-select-sm" [(ngModel)]="casesStatusFilter">
                  <option value="">All statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="ON_HOLD">On Hold</option>
                </select>
                <button class="btn btn-sm btn-outline-primary" routerLink="/compliance/cases">View All</button>
              </div>
            </div>
            <div class="card-body">
              <div class="text-center text-muted py-4" *ngIf="activeInvestigations.length === 0 && !loading">
                <i class="fas fa-search fa-3x mb-3"></i>
                <p>No active investigations</p>
              </div>
              <div class="list-group list-group-flush" *ngIf="filteredCases().length > 0">
                <div class="list-group-item case-item d-flex justify-content-between align-items-start"
                     *ngFor="let case of filteredCases()">
                  <div class="case-left">
                    <div class="case-title">
                      <span class="id-pill">Case #{{ case.id }}</span>
                    </div>
                    <div class="case-summary">Assigned to: <strong>{{ case.assignedTo }}</strong></div>
                    <div class="case-meta">
                      <span class="meta-item"><i class="far fa-clock me-1"></i>{{ case.createdAt | date:'MMM d, y, h:mm a' }}</span>
                    </div>
                  </div>
                  <div class="text-end case-right">
                    <span class="status-chip" [ngClass]="statusLevelClass(case.status)">{{ case.status }}</span>
                  </div>
                </div>
              </div>
              <div class="text-center text-muted py-4" *ngIf="activeInvestigations.length > 0 && filteredCases().length === 0">
                No cases match your filters
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
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      border-radius: 0.75rem;
    }

    .badge {
      font-size: 0.75rem;
    }

    .btn-sm {
      font-size: 0.75rem;
    }

    /* Skeleton loaders */
    .skeleton { background: linear-gradient(135deg, #f3f4f6, #e9ecef); color: transparent; }
    .skeleton-line { height: 12px; border-radius: 6px; background: #dee2e6; }

    /* Risk chips */
    .risk-chip { display:inline-block; padding: 0.25rem 0.5rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; color: #fff; }
    .risk-low { background: linear-gradient(135deg, #28a745, #20c997); }
    .risk-medium { background: linear-gradient(135deg, #ffc107, #ff9800); }
    .risk-high { background: linear-gradient(135deg, #dc3545, #c82333); }

    /* Status chip */
    .status-chip { padding: 0.25rem 0.5rem; border-radius: 999px; background: var(--neutral-200, #eef2f7); color: var(--text-primary); font-size: 0.75rem; font-weight: 600; }
    .status-in-progress { background: linear-gradient(135deg, #17a2b8, #138496); color: #fff; }
    .status-under-investigation { background: linear-gradient(135deg, #6f42c1, #5a32a3); color: #fff; }
    .status-on-hold { background: linear-gradient(135deg, #6c757d, #495057); color: #fff; }
    .status-open { background: linear-gradient(135deg, var(--primary-bank-blue), var(--primary-bank-blue-dark)); color: #fff; }
    .status-closed { background: linear-gradient(135deg, #28a745, #20c997); color: #fff; }

    /* Sparklines */
    .sparkline { display:flex; align-items:flex-end; gap:2px; height:28px; }
    .sparkline span { width:6px; border-radius:2px; background: rgba(255,255,255,0.8); display:block; }

    /* Stat cards */
    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border-radius: 0.75rem;
      color: white;
      box-shadow: 0 6px 18px rgba(0,0,0,0.08);
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }
    .stat-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 24px rgba(0,0,0,0.12);
    }
    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.2);
      font-size: 1.25rem;
      flex-shrink: 0;
    }
    .stat-content {
      display: flex;
      flex-direction: column;
    }
    .stat-label {
      font-size: 0.825rem;
      opacity: 0.95;
    }
    .stat-number {
      font-size: 1.75rem;
      font-weight: 700;
      line-height: 1.1;
    }
    .stat-warning { background: linear-gradient(135deg, #ffc107, #ff9800); }
    .stat-danger  { background: linear-gradient(135deg, #dc3545, #c82333); }
    .stat-info    { background: linear-gradient(135deg, #17a2b8, #138496); }
    .stat-success { background: linear-gradient(135deg, #28a745, #20c997); }

    /* Lists in cards */
    .list-group-item {
      border: none;
      border-bottom: 1px solid #e9ecef;
      padding: 0.75rem 0;
    }
    .list-group-item:last-child {
      border-bottom: none;
    }
    .card-header {
      padding: 0.875rem 1.25rem;
      background: #ffffff;
      border-bottom: 1px solid #e9ecef;
      border-radius: 0.75rem 0.75rem 0 0 !important;
    }
    .btn-outline-primary {
      border-color: var(--primary-bank-blue);
      color: var(--primary-bank-blue);
    }
    .btn-outline-primary:hover {
      background: var(--primary-bank-blue);
      color: #fff;
    }

    /* Recent Alerts - improved presentation */
    .alert-item {
      border-radius: 0.5rem;
      background: #fff;
      padding: 0.9rem 0.25rem;
    }
    .alert-left { flex: 1 1 auto; }
    .alert-title { margin-bottom: 0.25rem; }
    .id-pill {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: var(--primary-bank-blue);
      background: rgba(46,163,242,0.12);
      border: 1px solid rgba(46,163,242,0.25);
    }
    .alert-summary {
      color: var(--text-primary);
      font-size: 0.95rem;
      line-height: 1.5;
      margin: 0.25rem 0 0.35rem;
    }
    .alert-meta { display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary); font-size: 0.82rem; }
    .meta-item { display: inline-flex; align-items: center; }
    .meta-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--neutral-300, #dfe5ec); display: inline-block; }
    .alert-right .btn { padding: 0.25rem 0.6rem; }
    @media (max-width: 576px) {
      .alert-item { flex-direction: column; gap: 0.5rem; }
      .alert-right { width: 100%; display: flex; justify-content: space-between; align-items: center; }
    }

    /* Active Investigations - improved presentation */
    .case-item {
      border-radius: 0.5rem;
      background: #fff;
      padding: 0.9rem 0.25rem;
    }
    .case-left { flex: 1 1 auto; }
    .case-title { margin-bottom: 0.25rem; }
    .case-summary { color: var(--text-primary); font-size: 0.95rem; margin: 0.25rem 0 0.35rem; }
    .case-meta { display:flex; align-items:center; gap:0.5rem; color: var(--text-secondary); font-size: 0.82rem; }
    .case-right { min-width: 160px; }
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

  // UI: filters
  alertsQuery = '';
  alertsRiskFilter = '';
  casesQuery = '';
  casesStatusFilter = '';

  // UI: sparkline data (placeholder trends)
  trends = {
    openAlerts: [5,9,7,11,8,12,10,14],
    activeCases: [3,4,5,6,6,7,8,7],
    pendingReviews: [8,7,9,10,8,9,11,12],
    resolvedToday: [1,2,2,3,4,3,5,6]
  };

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

  // Risk helpers
  riskLevelClass(score: number): string {
    if (score >= 80) return 'risk-high';
    if (score >= 50) return 'risk-medium';
    return 'risk-low';
  }
  riskLevelLabel(score: number): string {
    if (score >= 80) return 'High Risk';
    if (score >= 50) return 'Medium Risk';
    return 'Low Risk';
  }

  // Status chip mapper for Active Investigations
  statusLevelClass(status?: string): string {
    const s = (status || '').toUpperCase().replace(/\s+/g, '_');
    if (s.includes('IN_PROGRESS')) return 'status-in-progress';
    if (s.includes('UNDER') || s.includes('INVEST')) return 'status-under-investigation';
    if (s.includes('ON_HOLD')) return 'status-on-hold';
    if (s.includes('OPEN')) return 'status-open';
    if (s.includes('CLOSED') || s.includes('RESOLVED')) return 'status-closed';
    return 'status-open';
  }

  // Filters
  filteredAlerts(): AlertDto[] {
    const q = this.alertsQuery.trim().toLowerCase();
    return this.recentAlerts.filter(a => {
      const matchesQ = !q || `${a.id}`.includes(q) || a.reason?.toLowerCase().includes(q);
      const lvl = this.riskLevelLabel(a.riskScore);
      const matchesRisk = !this.alertsRiskFilter || lvl.toUpperCase().startsWith(this.alertsRiskFilter);
      return matchesQ && matchesRisk;
    });
  }

  filteredCases(): CaseDto[] {
    const q = this.casesQuery.trim().toLowerCase();
    return this.activeInvestigations.filter(c => {
      const matchesQ = !q || `${c.id}`.includes(q) || (c.assignedTo || '').toLowerCase().includes(q);
      const matchesStatus = !this.casesStatusFilter || (c.status || '').toUpperCase() === this.casesStatusFilter;
      return matchesQ && matchesStatus;
    });
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

