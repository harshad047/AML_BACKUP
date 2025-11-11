import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AnalyticsData } from '../../../core/models/analytics.models';
import * as XLSX from 'xlsx-js-style';


// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-reports-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgChartsModule],
  templateUrl: './reports-analytics.component.html',
  styleUrls: ['./reports-analytics.component.css']
})
export class ReportsAnalyticsComponent implements OnInit {
  loading = true;
  error: string | null = null;
  analyticsData: AnalyticsData | null = null;
  dateRange = '30'; // 7, 30, 90 days
  selectedDateRange = '30'; // Default to last 30 days
  
  // Custom date range   
  startDate: string = '';
  endDate: string = '';
  maxDate: string = ''; // Today's date - no future dates allowed
  dateRangeError: string = '';
  
  // Chart configurations
  transactionVolumeChart: ChartConfiguration<'line'>['data'] | null = null;
  transactionTypeChart: ChartConfiguration<'bar'>['data'] | null = null;
  transactionStatusChart: ChartConfiguration<'doughnut'>['data'] | null = null;
  riskDistributionChart: ChartConfiguration<'pie'>['data'] | null = null;
  riskTrendsChart: ChartConfiguration<'line'>['data'] | null = null;
  alertTrendsChart: ChartConfiguration<'line'>['data'] | null = null;
  topRulesChart: ChartConfiguration<'bar'>['data'] | null = null;
  userGrowthChart: ChartConfiguration<'line'>['data'] | null = null;
  userStatusChart: ChartConfiguration<'doughnut'>['data'] | null = null;
  kycStatusChart: ChartConfiguration<'bar'>['data'] | null = null;
  casesByOfficerChart: ChartConfiguration<'bar'>['data'] | null = null;
  caseResolutionChart: ChartConfiguration<'line'>['data'] | null = null;
  accountsByTypeChart: ChartConfiguration<'doughnut'>['data'] | null = null;
  accountsByCurrencyChart: ChartConfiguration<'bar'>['data'] | null = null;
  activityByActionChart: ChartConfiguration<'bar'>['data'] | null = null;
  
  // Chart options
  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom' },
      tooltip: { enabled: true }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };
  
  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };
  
  doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'right' },
      tooltip: { enabled: true }
    }
  };
  
  pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'right' },
      tooltip: { enabled: true }
    }
  };

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    // Set max date to today (no future dates allowed)
    const today = new Date();
    this.maxDate = today.toISOString().split('T')[0];
    
    // Initialize default date range (last 30 days)
    this.initializeDefaultDates();
    
    this.loadAnalytics();
  }

  initializeDefaultDates(): void {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    this.endDate = today.toISOString().split('T')[0];
    this.startDate = thirtyDaysAgo.toISOString().split('T')[0];
  }

  loadAnalytics(): void {
    this.loading = true;
    this.error = null;
    
    // Pass date range to the analytics service
    console.log('Loading analytics with date range:', this.startDate, 'to', this.endDate);
    
    this.analyticsService.getAnalyticsData(this.startDate, this.endDate).subscribe({
      next: (data) => {
        console.log('Analytics data loaded:', data);
        this.analyticsData = data;
        this.initializeCharts(data);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading analytics:', error);
        this.error = error.message || 'Failed to load analytics data. Please check if backend APIs are running.';
        this.loading = false;
      }
    });
  }

  initializeCharts(data: AnalyticsData): void {
    // Transaction Volume Trend Chart
    this.transactionVolumeChart = {
      labels: data.transactionTrends.map((t: { date: string }) => new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Total',
          data: data.transactionTrends.map((t: { total: number }) => t.total),
          borderColor: '#0d6efd',
          backgroundColor: 'rgba(13, 110, 253, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Approved',
          data: data.transactionTrends.map((t: { approved: number }) => t.approved),
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Flagged',
          data: data.transactionTrends.map((t: { flagged: number }) => t.flagged),
          borderColor: '#ffc107',
          backgroundColor: 'rgba(255, 193, 7, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Blocked',
          data: data.transactionTrends.map((t: { blocked: number }) => t.blocked),
          borderColor: '#dc3545',
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };

    // Transaction by Type Chart
    this.transactionTypeChart = {
      labels: data.transactionsByType.map((t: { type: string }) => t.type),
      datasets: [{
        label: 'Count',
        data: data.transactionsByType.map((t: { count: number }) => t.count),
        backgroundColor: ['#0d6efd', '#28a745', '#ffc107', '#17a2b8', '#6f42c1'],
        borderWidth: 0
      }]
    };

    // Transaction Status Chart
    this.transactionStatusChart = {
      labels: data.transactionsByStatus.map((t: { status: string }) => t.status),
      datasets: [{
        data: data.transactionsByStatus.map((t: { count: number }) => t.count),
        backgroundColor: ['#28a745', '#ffc107', '#ff9800', '#dc3545', '#6c757d'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };

    // Risk Distribution Chart
    this.riskDistributionChart = {
      labels: data.riskDistribution.map((r: { level: string }) => r.level),
      datasets: [{
        data: data.riskDistribution.map((r: { count: number }) => r.count),
        backgroundColor: ['#dc3545', '#ff9800', '#28a745'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };

    // Risk Trends Chart
    this.riskTrendsChart = {
      labels: data.riskTrends.map((t: { date: string }) => new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'High Risk',
          data: data.riskTrends.map((t: { high: number }) => t.high),
          borderColor: '#dc3545',
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Medium Risk',
          data: data.riskTrends.map((t: { medium: number }) => t.medium),
          borderColor: '#ff9800',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Low Risk',
          data: data.riskTrends.map((t: { low: number }) => t.low),
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };

    // Alert Trends Chart
    this.alertTrendsChart = {
      labels: data.alertTrends.map((t: { date: string }) => new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Open',
          data: data.alertTrends.map((t: { open: number }) => t.open),
          borderColor: '#ffc107',
          backgroundColor: 'rgba(255, 193, 7, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Escalated',
          data: data.alertTrends.map((t: { escalated: number }) => t.escalated),
          borderColor: '#17a2b8',
          backgroundColor: 'rgba(23, 162, 184, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Resolved',
          data: data.alertTrends.map((t: { resolved: number }) => t.resolved),
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };

    // Top Triggered Rules Chart
    this.topRulesChart = {
      labels: data.topTriggeredRules.map((r: { ruleName: string }) => r.ruleName),
      datasets: [{
        label: 'Triggers',
        data: data.topTriggeredRules.map((r: { count: number }) => r.count),
        backgroundColor: data.topTriggeredRules.map((r: { action: string }) => r.action === 'BLOCK' ? '#dc3545' : '#ffc107'),
        borderWidth: 0
      }]
    };

    // User Growth Chart
    this.userGrowthChart = {
      labels: data.userGrowth.map((u: { month: string }) => u.month),
      datasets: [
        {
          label: 'New Users',
          data: data.userGrowth.map((u: { newUsers: number }) => u.newUsers),
          borderColor: '#0d6efd',
          backgroundColor: 'rgba(13, 110, 253, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Total Users',
          data: data.userGrowth.map((u: { totalUsers: number }) => u.totalUsers),
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };

    // User Status Chart
    this.userStatusChart = {
      labels: data.userStatusDistribution.map((u: { status: string }) => u.status),
      datasets: [{
        data: data.userStatusDistribution.map((u: { count: number }) => u.count),
        backgroundColor: ['#28a745', '#dc3545', '#ffc107'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };

    // KYC Status Chart
    this.kycStatusChart = {
      labels: data.kycStatus.map((k: { status: string }) => k.status),
      datasets: [{
        label: 'Count',
        data: data.kycStatus.map((k: { count: number }) => k.count),
        backgroundColor: ['#ffc107', '#28a745', '#dc3545'],
        borderWidth: 0
      }]
    };

    // Cases by Officer Chart
    this.casesByOfficerChart = {
      labels: data.casesByOfficer.map((c: { officer: string }) => c.officer.split('@')[0]),
      datasets: [
        {
          label: 'Resolved',
          data: data.casesByOfficer.map((c: { resolved: number }) => c.resolved),
          backgroundColor: '#28a745',
          borderWidth: 0
        },
        {
          label: 'Pending',
          data: data.casesByOfficer.map((c: { pending: number }) => c.pending),
          backgroundColor: '#ffc107',
          borderWidth: 0
        }
      ]
    };

    // Case Resolution Time Chart
    this.caseResolutionChart = {
      labels: data.caseResolutionTime.map((c: { date: string }) => new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [{
        label: 'Avg Days to Resolve',
        data: data.caseResolutionTime.map((c: { avgDays: number }) => c.avgDays),
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13, 110, 253, 0.1)',
        fill: true,
        tension: 0.4
      }]
    };

    // Accounts by Type Chart
    this.accountsByTypeChart = {
      labels: data.accountsByType.map((a: { type: string }) => a.type),
      datasets: [{
        data: data.accountsByType.map((a: { count: number }) => a.count),
        backgroundColor: ['#0d6efd', '#28a745', '#ffc107', '#17a2b8'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };

    // Accounts by Currency Chart
    this.accountsByCurrencyChart = {
      labels: data.accountsByCurrency.map((a: { currency: string }) => a.currency),
      datasets: [{
        label: 'Count',
        data: data.accountsByCurrency.map((a: { count: number }) => a.count),
        backgroundColor: ['#0d6efd', '#28a745', '#ffc107', '#17a2b8', '#6f42c1'],
        borderWidth: 0
      }]
    };

    // Activity by Action Chart
    this.activityByActionChart = {
      labels: data.activityByAction.map((a: { action: string }) => a.action),
      datasets: [{
        label: 'Count',
        data: data.activityByAction.map((a: { count: number }) => a.count),
        backgroundColor: '#0d6efd',
        borderWidth: 0
      }]
    };
  }

  exportToPDF(): void {
    window.print();
  }

exportToExcel(): void {
  if (!this.analyticsData) {
    alert('No data available to export');
    return;
  }

  const wb = XLSX.utils.book_new();

  // Common styles
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "4472C4" } }, // Blue header
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } }
    }
  };

  const cellStyle = {
    alignment: { horizontal: "center" },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } }
    }
  };

  const createStyledSheet = (title: string, headers: string[], rows: any[][]) => {
    const data = [[title], headers, ...rows];
    const sheet = XLSX.utils.aoa_to_sheet(data);

    // Apply styles
    const range = XLSX.utils.decode_range(sheet['!ref']!);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        if (!sheet[cellRef]) continue;

        if (R === 1) sheet[cellRef].s = headerStyle; // header row
        else if (R > 1) sheet[cellRef].s = cellStyle; // data rows
      }
    }

    // Auto column width
    const colWidths = headers.map(() => ({ wch: 20 }));
    sheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, sheet, title);
  };

  // Now use createStyledSheet for each section:

  createStyledSheet('Executive Summary', ['Metric', 'Value'], [
    ['Total Transactions', this.analyticsData.totalTransactions],
    ['Average Risk Score', this.analyticsData.averageRiskScore],
    ['Active Alerts', this.analyticsData.activeAlerts],
    ['Compliance Rate', `${this.analyticsData.complianceRate}%`]
  ]);

  createStyledSheet('Transaction Trends', ['Date', 'Total', 'Approved', 'Flagged', 'Blocked'],
    this.analyticsData.transactionTrends.map((t: { date: string; total: number; approved: number; flagged: number; blocked: number }) => [t.date, t.total, t.approved, t.flagged, t.blocked])
  );

  createStyledSheet('Transactions by Type', ['Type', 'Count', 'Amount'],
    this.analyticsData.transactionsByType.map((t: { type: string; count: number; amount: number }) => [t.type, t.count, t.amount])
  );

  createStyledSheet('Transactions by Status', ['Status', 'Count'],
    this.analyticsData.transactionsByStatus.map((t: { status: string; count: number }) => [t.status, t.count])
  );

  createStyledSheet('Risk Distribution', ['Risk Level', 'Count'],
    this.analyticsData.riskDistribution.map((r: { level: string; count: number }) => [r.level, r.count])
  );

  createStyledSheet('High Value Txns', ['Transaction ID', 'Amount', 'Currency', 'Risk Score'],
    this.analyticsData.topHighValueTransactions.map((t: { id: number; amount: number; currency: string; riskScore: number }) => [t.id, t.amount, t.currency, t.riskScore])
  );

  createStyledSheet('Top Rules', ['Rule Name', 'Count', 'Action'],
    this.analyticsData.topTriggeredRules.map((r: { ruleName: string; count: number; action: string }) => [r.ruleName, r.count, r.action])
  );

  createStyledSheet('User Growth', ['Month', 'New Users', 'Total Users'],
    this.analyticsData.userGrowth.map((u: { month: string; newUsers: number; totalUsers: number }) => [u.month, u.newUsers, u.totalUsers])
  );

  createStyledSheet('User Status', ['Status', 'Count'],
    this.analyticsData.userStatusDistribution.map((u: { status: string; count: number }) => [u.status, u.count])
  );

  createStyledSheet('KYC Status', ['Status', 'Count'],
    this.analyticsData.kycStatus.map((k: { status: string; count: number }) => [k.status, k.count])
  );

  createStyledSheet('Top Customers', ['Customer Name', 'Transactions', 'Total Amount'],
    this.analyticsData.topCustomersByVolume.map((c: { name: string; transactions: number; amount: number }) => [c.name, c.transactions, c.amount])
  );

  createStyledSheet('Cases by Officer', ['Officer', 'Resolved', 'Pending'],
    this.analyticsData.casesByOfficer.map((c: { officer: string; resolved: number; pending: number }) => [c.officer, c.resolved, c.pending])
  );

  createStyledSheet('Accounts by Type', ['Type', 'Count'],
    this.analyticsData.accountsByType.map((a: { type: string; count: number }) => [a.type, a.count])
  );

  createStyledSheet('Accounts by Currency', ['Currency', 'Count'],
    this.analyticsData.accountsByCurrency.map((a: { currency: string; count: number }) => [a.currency, a.count])
  );

  createStyledSheet('System Activity', ['Action', 'Count'],
    this.analyticsData.activityByAction.map((a: { action: string; count: number }) => [a.action, a.count])
  );

  // Filename with date
  const date = new Date();
  const filename = `AML_Analytics_Report_${date.getFullYear()}-${(date.getMonth() + 1)
    .toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}.xlsx`;

  XLSX.writeFile(wb, filename);
}

  refreshData(): void {
    this.loadAnalytics();
  }

  // Date filter methods
  onDateRangeChange(): void {
    console.log('Date range changed to:', this.selectedDateRange);
    this.dateRange = this.selectedDateRange;
    this.dateRangeError = '';
    
    if (this.selectedDateRange !== 'custom') {
      // For predefined ranges, calculate start and end dates
      const today = new Date();
      const daysAgo = new Date();
      daysAgo.setDate(today.getDate() - parseInt(this.selectedDateRange));
      
      this.endDate = today.toISOString().split('T')[0];
      this.startDate = daysAgo.toISOString().split('T')[0];
      
      // Reload analytics data
      this.loadAnalytics();
    }
    // For custom range, wait for user to select dates
  }

  onCustomDateChange(): void {
    this.dateRangeError = '';
    
    // Validate that both dates are selected
    if (!this.startDate || !this.endDate) {
      this.dateRangeError = 'Please select both start and end dates.';
      return;
    }
    
    // Validate that start date is not after end date
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    
    if (start > end) {
      this.dateRangeError = 'Start date cannot be after end date.';
      return;
    }
    
    // Validate that dates are not in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (start > today || end > today) {
      this.dateRangeError = 'Future dates are not allowed.';
      return;
    }
    
    // Calculate date range in days
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 365) {
      this.dateRangeError = 'Date range cannot exceed 365 days.';
      return;
    }
    
    // All validations passed - reload analytics
    console.log('Custom date range:', this.startDate, 'to', this.endDate);
    this.loadAnalytics();
  }

  getDateRangeText(): string {
    if (this.selectedDateRange === 'custom') {
      if (this.startDate && this.endDate) {
        const start = new Date(this.startDate);
        const end = new Date(this.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return `Custom Range: ${this.formatDate(this.startDate)} to ${this.formatDate(this.endDate)} (${diffDays} days)`;
      }
      return 'Custom Range: Please select dates';
    }
    
    switch(this.selectedDateRange) {
      case '7': return 'Showing data for: Last 7 Days';
      case '30': return 'Showing data for: Last 30 Days';
      case '90': return 'Showing data for: Last 90 Days';
      case '180': return 'Showing data for: Last 6 Months';
      case '365': return 'Showing data for: Last Year';
      default: return 'Showing data for: Last 30 Days';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  getSelectedRangeLabel(): string {
    switch(this.selectedDateRange) {
      case '7': return 'Last 7 Days';
      case '30': return 'Last 30 Days';
      case '90': return 'Last 90 Days';
      case '180': return 'Last 6 Months';
      case '365': return 'Last Year';
      case 'custom': return 'Custom Range';
      default: return 'Last 30 Days';
    }
  }
}
