import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../../core/services/auth.service';
import { ComplianceService } from '../../../core/services/compliance.service';
import { AlertDto, CaseDto, ComplianceDashboardStats } from '../../../core/models/compliance.models';

@Component({
  selector: 'app-compliance-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './compliance-dashboard.component.html',
  styleUrls: ['./compliance-dashboard.component.css']
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

    // Load recent alerts (today's alerts only, limit to 3 most recent)
    this.complianceService.getAllOpenAlerts().subscribe({
      next: (alerts) => {
        // Filter alerts to show only today's alerts
        const today = new Date().toDateString();
        const todaysAlerts = alerts.filter(alert => {
          const alertDate = new Date(alert.createdAt).toDateString();
          return alertDate === today;
        });
        this.recentAlerts = todaysAlerts.slice(0, 3);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading alerts:', error);
        this.error = 'Failed to load recent alerts';
        this.loading = false;
      }
    });

    // Load active investigations - filter to show only logged-in officer's cases
    this.complianceService.getCasesUnderInvestigation().subscribe({
      next: (cases) => {
        // Filter cases to show only those assigned to the current user
        const currentUsername = this.currentUser?.username;
        const myCases = cases.filter(c => {
          if (!c.assignedTo) return false;
          // Handle both string and object assignedTo formats
          const assignedTo: any = c.assignedTo;
          if (typeof assignedTo === 'string') {
            return assignedTo === currentUsername;
          } else if (typeof assignedTo === 'object' && assignedTo.username) {
            return assignedTo.username === currentUsername;
          }
          return false;
        });
        this.activeInvestigations = myCases.slice(0, 3);
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

