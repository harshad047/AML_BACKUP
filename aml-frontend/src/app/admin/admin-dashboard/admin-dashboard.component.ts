import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, User } from '../../core/services/auth.service';
import { AdminService, TransactionDto, AuditLog, UserDto, SuspiciousKeywordDto, CountryRiskDto, DocumentDTO } from '../../core/services/admin.service';
import { forkJoin } from 'rxjs';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  pendingKyc: number;
  pendingAccounts: number;
  activeRules: number;
  complianceOfficers: number;
  totalKeywords: number;
  countryRisks: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  currentUser: User | null = null;
  loading = true;
  
  stats: DashboardStats = {
    totalUsers: 0,
    activeUsers: 0,
    pendingKyc: 0,
    pendingAccounts: 0,
    activeRules: 0,
    complianceOfficers: 0,
    totalKeywords: 0,
    countryRisks: 0
  };

  // High-priority data
  recentTransactions: TransactionDto[] = [];
  recentAuditLogs: AuditLog[] = [];
  blockedCustomers: UserDto[] = [];
  loadingTransactions = false;
  loadingAuditLogs = false;
  loadingBlockedCustomers = false;

  // Phase 2 data
  highRiskKeywords: SuspiciousKeywordDto[] = [];
  highRiskCountries: CountryRiskDto[] = [];
  kycDocuments: { verified: number; rejected: number; pending: number; total: number } = {
    verified: 0,
    rejected: 0,
    pending: 0,
    total: 0
  };
  loadingKeywords = false;
  loadingCountries = false;
  loadingKycStats = false;

  constructor(
    private authService: AuthService,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    console.log('Current user:', this.currentUser);
    console.log('User role:', this.currentUser?.role);
    this.loadDashboardStats();
    this.loadRecentTransactions();
    this.loadRecentAuditLogs();
    this.loadBlockedCustomers();
    // Phase 2
    this.loadHighRiskKeywords();
    this.loadHighRiskCountries();
  }

  loadDashboardStats(): void {
    this.loading = true;
    console.log('Loading dashboard stats...');

    // Load all stats in parallel
    forkJoin({
      users: this.adminService.getAllUsers(),
      pendingAccounts: this.adminService.getPendingAccounts(),
      pendingKyc: this.adminService.getPendingKycDocuments(),
      rules: this.adminService.getAllRules(),
      officers: this.adminService.getComplianceOfficers(),
      keywords: this.adminService.getAllKeywords(),
      countryRisks: this.adminService.getCountryRisks()
    }).subscribe({
      next: (data) => {
        console.log('Dashboard data received:', data);
        
        this.stats.totalUsers = Array.isArray(data.users) ? data.users.length : 0;
        this.stats.activeUsers = Array.isArray(data.users) ? data.users.filter(u => !u.blocked && u.isEnabled !== false).length : 0;
        this.stats.pendingAccounts = Array.isArray(data.pendingAccounts) ? data.pendingAccounts.length : 0;
        this.stats.pendingKyc = Array.isArray(data.pendingKyc) ? data.pendingKyc.length : 0;
        this.stats.activeRules = Array.isArray(data.rules) ? data.rules.filter(r => r.active).length : 0;
        this.stats.complianceOfficers = Array.isArray(data.officers) ? data.officers.length : 0;
        this.stats.totalKeywords = Array.isArray(data.keywords) ? data.keywords.length : 0;
        this.stats.countryRisks = Array.isArray(data.countryRisks) ? data.countryRisks.length : 0;
        
        console.log('Stats calculated:', this.stats);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard stats:', err);
        console.error('Error details:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          error: err.error
        });
        this.loading = false;
      }
    });
  }

  loadRecentTransactions(): void {
    this.loadingTransactions = true;
    this.adminService.getAdminTransactions().subscribe({
      next: (transactions) => {
        // Get top 10 most recent transactions, prioritize high-risk and flagged
        this.recentTransactions = transactions
          .sort((a, b) => {
            // Sort by risk score (descending), then by date (descending)
            const riskDiff = (b.combinedRiskScore || 0) - (a.combinedRiskScore || 0);
            if (riskDiff !== 0) return riskDiff;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          })
          .slice(0, 5);
        this.loadingTransactions = false;
      },
      error: (err) => {
        console.error('Error loading recent transactions:', err);
        this.loadingTransactions = false;
      }
    });
  }

  loadRecentAuditLogs(): void {
    this.loadingAuditLogs = true;
    this.adminService.getAllAuditLogs().subscribe({
      next: (logs) => {
        // Get last 15 audit logs
        this.recentAuditLogs = logs
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 5);
        this.loadingAuditLogs = false;
      },
      error: (err) => {
        console.error('Error loading audit logs:', err);
        this.loadingAuditLogs = false;
      }
    });
  }

  loadBlockedCustomers(): void {
    this.loadingBlockedCustomers = true;
    this.adminService.getBlockedCustomers().subscribe({
      next: (customers) => {
        this.blockedCustomers = customers;
        this.loadingBlockedCustomers = false;
      },
      error: (err) => {
        console.error('Error loading blocked customers:', err);
        this.loadingBlockedCustomers = false;
      }
    });
  }

  unblockCustomer(userId: number): void {
    if (confirm('Are you sure you want to unblock this customer?')) {
      this.adminService.unblockCustomer(userId).subscribe({
        next: () => {
          this.loadBlockedCustomers();
          this.loadDashboardStats();
        },
        error: (err) => {
          console.error('Error unblocking customer:', err);
          alert('Failed to unblock customer');
        }
      });
    }
  }

  getRiskScoreClass(score: number | undefined): string {
    if (!score) return 'text-muted';
    if (score >= 80) return 'text-danger fw-bold';
    if (score >= 60) return 'text-warning fw-bold';
    if (score >= 40) return 'text-info';
    return 'text-success';
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return 'bg-success';
      case 'PENDING': return 'bg-warning';
      case 'FLAGGED': return 'bg-warning';
      case 'BLOCKED': return 'bg-danger';
      case 'FAILED': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }

  refreshAll(): void {
    this.loadDashboardStats();
    this.loadRecentTransactions();
    this.loadRecentAuditLogs();
    this.loadBlockedCustomers();
    this.loadHighRiskKeywords();
    this.loadHighRiskCountries();
  }

  // Phase 2 Methods
  loadHighRiskKeywords(): void {
    this.loadingKeywords = true;
    this.adminService.getAllKeywords().subscribe({
      next: (keywords) => {
        // Filter CRITICAL and HIGH risk keywords, sort by risk score
        this.highRiskKeywords = keywords
          .filter(k => k.riskLevel === 'CRITICAL' || k.riskLevel === 'HIGH')
          .sort((a, b) => b.riskScore - a.riskScore)
          .slice(0, 6);
        this.loadingKeywords = false;
      },
      error: (err) => {
        console.error('Error loading keywords:', err);
        this.loadingKeywords = false;
      }
    });
  }

  loadHighRiskCountries(): void {
    this.loadingCountries = true;
    this.adminService.getCountryRisks().subscribe({
      next: (countries) => {
        // Filter countries with risk score > 70, sort by risk score
        this.highRiskCountries = countries
          .filter(c => c.riskScore > 70)
          .sort((a, b) => b.riskScore - a.riskScore)
          .slice(0, 6);
        this.loadingCountries = false;
      },
      error: (err) => {
        console.error('Error loading countries:', err);
        this.loadingCountries = false;
      }
    });
  }

  

  getRiskLevelClass(level: string): string {
    switch (level?.toUpperCase()) {
      case 'CRITICAL': return 'bg-danger';
      case 'HIGH': return 'bg-warning';
      case 'MEDIUM': return 'bg-info';
      case 'LOW': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  getCountryRiskClass(score: number): string {
    if (score >= 90) return 'text-danger fw-bold';
    if (score >= 80) return 'text-warning fw-bold';
    if (score >= 70) return 'text-info fw-bold';
    return 'text-muted';
  }

  getKycPercentage(count: number): number {
    if (this.kycDocuments.total === 0) return 0;
    return Math.round((count / this.kycDocuments.total) * 100);
  }
}
