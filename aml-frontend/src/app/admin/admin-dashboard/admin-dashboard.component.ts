import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, User } from '../../core/services/auth.service';
import { AdminService } from '../../core/services/admin.service';
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

  constructor(
    private authService: AuthService,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    console.log('Current user:', this.currentUser);
    console.log('User role:', this.currentUser?.role);
    this.loadDashboardStats();
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
}
