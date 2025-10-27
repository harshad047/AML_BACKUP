import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <h1 class="mb-4">Admin Dashboard</h1>
          <p class="text-muted">Welcome back, {{ currentUser?.firstName }}!</p>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card bg-primary text-white">
            <div class="card-body">
              <h5 class="card-title">Total Users</h5>
              <h3>{{ totalUsers }}</h3>
              <small>{{ activeUsers }} active</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-warning text-white">
            <div class="card-body">
              <h5 class="card-title">Pending KYC</h5>
              <h3>{{ pendingKyc }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-success text-white">
            <div class="card-body">
              <h5 class="card-title">Pending Accounts</h5>
              <h3>{{ pendingAccounts }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-info text-white">
            <div class="card-body">
              <h5 class="card-title">Active Rules</h5>
              <h3>{{ activeRules }}</h3>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="row">
        <div class="col-md-8">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Recent Activities</h5>
              <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-primary active">All</button>
                <button class="btn btn-outline-primary">Users</button>
                <button class="btn btn-outline-primary">Transactions</button>
              </div>
            </div>
            <div class="card-body">
              <div class="text-center text-muted py-4" *ngIf="recentActivities.length === 0">
                <i class="fas fa-list fa-3x mb-3"></i>
                <p>No recent activities</p>
              </div>
              <div class="list-group list-group-flush" *ngIf="recentActivities.length > 0">
                <div class="list-group-item d-flex justify-content-between align-items-center"
                     *ngFor="let activity of recentActivities">
                  <div>
                    <strong>{{ activity.action }}</strong>
                    <br>
                    <small class="text-muted">{{ activity.details }}</small>
                    <br>
                    <small class="text-muted">{{ activity.timestamp | date:'short' }}</small>
                  </div>
                  <span class="badge" [ngClass]="getActivityClass(activity.type)">
                    {{ activity.type }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Quick Actions</h5>
            </div>
            <div class="card-body">
              <div class="d-grid gap-2">
                <button class="btn btn-outline-primary">
                  <i class="fas fa-user-plus me-2"></i>
                  Create User
                </button>
                <button class="btn btn-outline-secondary">
                  <i class="fas fa-file-check me-2"></i>
                  Review KYC
                </button>
                <button class="btn btn-outline-info">
                  <i class="fas fa-credit-card me-2"></i>
                  Approve Accounts
                </button>
                <button class="btn btn-outline-success">
                  <i class="fas fa-cog me-2"></i>
                  Manage Rules
                </button>
              </div>
            </div>
          </div>

          <div class="card mt-3">
            <div class="card-header">
              <h5 class="mb-0">System Status</h5>
            </div>
            <div class="card-body">
              <div class="d-flex justify-content-between mb-2">
                <span>Database</span>
                <span class="badge bg-success">Online</span>
              </div>
              <div class="d-flex justify-content-between mb-2">
                <span>API Services</span>
                <span class="badge bg-success">Running</span>
              </div>
              <div class="d-flex justify-content-between mb-2">
                <span>Email Service</span>
                <span class="badge bg-success">Connected</span>
              </div>
              <div class="d-flex justify-content-between">
                <span>File Storage</span>
                <span class="badge bg-success">Available</span>
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
  `]
})
export class AdminDashboardComponent implements OnInit {
  currentUser: User | null = null;
  totalUsers = 0;
  activeUsers = 0;
  pendingKyc = 0;
  pendingAccounts = 0;
  activeRules = 0;

  recentActivities: any[] = [
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

  getActivityClass(type: string): string {
    switch (type.toLowerCase()) {
      case 'user': return 'bg-primary';
      case 'transaction': return 'bg-success';
      case 'alert': return 'bg-warning';
      case 'system': return 'bg-info';
      default: return 'bg-secondary';
    }
  }
}
