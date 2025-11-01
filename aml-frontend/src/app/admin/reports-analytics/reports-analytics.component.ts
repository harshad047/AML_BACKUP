import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';
import { AnalyticsService, AnalyticsData } from '../../core/services/analytics.service';
import * as XLSX from 'xlsx';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-reports-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BaseChartDirective],
  templateUrl: './reports-analytics.component.html',
  styleUrls: ['./reports-analytics.component.css']
})
export class ReportsAnalyticsComponent implements OnInit {
  loading = true;
  error: string | null = null;
  analyticsData: AnalyticsData | null = null;
  dateRange = '30'; // 7, 30, 90 days
  
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
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.loading = true;
    this.error = null;
    this.analyticsService.getAnalyticsData().subscribe({
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
      labels: data.transactionTrends.map(t => new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Total',
          data: data.transactionTrends.map(t => t.total),
          borderColor: '#0d6efd',
          backgroundColor: 'rgba(13, 110, 253, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Approved',
          data: data.transactionTrends.map(t => t.approved),
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Flagged',
          data: data.transactionTrends.map(t => t.flagged),
          borderColor: '#ffc107',
          backgroundColor: 'rgba(255, 193, 7, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Blocked',
          data: data.transactionTrends.map(t => t.blocked),
          borderColor: '#dc3545',
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };

    // Transaction by Type Chart
    this.transactionTypeChart = {
      labels: data.transactionsByType.map(t => t.type),
      datasets: [{
        label: 'Count',
        data: data.transactionsByType.map(t => t.count),
        backgroundColor: ['#0d6efd', '#28a745', '#ffc107', '#17a2b8', '#6f42c1'],
        borderWidth: 0
      }]
    };

    // Transaction Status Chart
    this.transactionStatusChart = {
      labels: data.transactionsByStatus.map(t => t.status),
      datasets: [{
        data: data.transactionsByStatus.map(t => t.count),
        backgroundColor: ['#28a745', '#ffc107', '#ff9800', '#dc3545', '#6c757d'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };

    // Risk Distribution Chart
    this.riskDistributionChart = {
      labels: data.riskDistribution.map(r => r.level),
      datasets: [{
        data: data.riskDistribution.map(r => r.count),
        backgroundColor: ['#dc3545', '#ff9800', '#28a745'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };

    // Risk Trends Chart
    this.riskTrendsChart = {
      labels: data.riskTrends.map(t => new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'High Risk',
          data: data.riskTrends.map(t => t.high),
          borderColor: '#dc3545',
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Medium Risk',
          data: data.riskTrends.map(t => t.medium),
          borderColor: '#ff9800',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Low Risk',
          data: data.riskTrends.map(t => t.low),
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };

    // Alert Trends Chart
    this.alertTrendsChart = {
      labels: data.alertTrends.map(t => new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Open',
          data: data.alertTrends.map(t => t.open),
          borderColor: '#ffc107',
          backgroundColor: 'rgba(255, 193, 7, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Escalated',
          data: data.alertTrends.map(t => t.escalated),
          borderColor: '#17a2b8',
          backgroundColor: 'rgba(23, 162, 184, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Resolved',
          data: data.alertTrends.map(t => t.resolved),
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };

    // Top Triggered Rules Chart
    this.topRulesChart = {
      labels: data.topTriggeredRules.map(r => r.ruleName),
      datasets: [{
        label: 'Triggers',
        data: data.topTriggeredRules.map(r => r.count),
        backgroundColor: data.topTriggeredRules.map(r => r.action === 'BLOCK' ? '#dc3545' : '#ffc107'),
        borderWidth: 0
      }]
    };

    // User Growth Chart
    this.userGrowthChart = {
      labels: data.userGrowth.map(u => u.month),
      datasets: [
        {
          label: 'New Users',
          data: data.userGrowth.map(u => u.newUsers),
          borderColor: '#0d6efd',
          backgroundColor: 'rgba(13, 110, 253, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Total Users',
          data: data.userGrowth.map(u => u.totalUsers),
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };

    // User Status Chart
    this.userStatusChart = {
      labels: data.userStatusDistribution.map(u => u.status),
      datasets: [{
        data: data.userStatusDistribution.map(u => u.count),
        backgroundColor: ['#28a745', '#dc3545', '#ffc107'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };

    // KYC Status Chart
    this.kycStatusChart = {
      labels: data.kycStatus.map(k => k.status),
      datasets: [{
        label: 'Count',
        data: data.kycStatus.map(k => k.count),
        backgroundColor: ['#ffc107', '#28a745', '#dc3545'],
        borderWidth: 0
      }]
    };

    // Cases by Officer Chart
    this.casesByOfficerChart = {
      labels: data.casesByOfficer.map(c => c.officer.split('@')[0]),
      datasets: [
        {
          label: 'Resolved',
          data: data.casesByOfficer.map(c => c.resolved),
          backgroundColor: '#28a745',
          borderWidth: 0
        },
        {
          label: 'Pending',
          data: data.casesByOfficer.map(c => c.pending),
          backgroundColor: '#ffc107',
          borderWidth: 0
        }
      ]
    };

    // Case Resolution Time Chart
    this.caseResolutionChart = {
      labels: data.caseResolutionTime.map(c => new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [{
        label: 'Avg Days to Resolve',
        data: data.caseResolutionTime.map(c => c.avgDays),
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13, 110, 253, 0.1)',
        fill: true,
        tension: 0.4
      }]
    };

    // Accounts by Type Chart
    this.accountsByTypeChart = {
      labels: data.accountsByType.map(a => a.type),
      datasets: [{
        data: data.accountsByType.map(a => a.count),
        backgroundColor: ['#0d6efd', '#28a745', '#ffc107', '#17a2b8'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };

    // Accounts by Currency Chart
    this.accountsByCurrencyChart = {
      labels: data.accountsByCurrency.map(a => a.currency),
      datasets: [{
        label: 'Count',
        data: data.accountsByCurrency.map(a => a.count),
        backgroundColor: ['#0d6efd', '#28a745', '#ffc107', '#17a2b8', '#6f42c1'],
        borderWidth: 0
      }]
    };

    // Activity by Action Chart
    this.activityByActionChart = {
      labels: data.activityByAction.map(a => a.action),
      datasets: [{
        label: 'Count',
        data: data.activityByAction.map(a => a.count),
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

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Executive Summary Sheet
    const summaryData = [
      ['Executive Summary'],
      ['Metric', 'Value'],
      ['Total Transactions', this.analyticsData.totalTransactions],
      ['Average Risk Score', this.analyticsData.averageRiskScore],
      ['Active Alerts', this.analyticsData.activeAlerts],
      ['Compliance Rate', this.analyticsData.complianceRate + '%']
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Executive Summary');

    // Transaction Trends Sheet
    const transactionTrendsData = [
      ['Transaction Volume Trends (Last 7 Days)'],
      ['Date', 'Total', 'Approved', 'Flagged', 'Blocked'],
      ...this.analyticsData.transactionTrends.map(t => [
        t.date, t.total, t.approved, t.flagged, t.blocked
      ])
    ];
    const trendsSheet = XLSX.utils.aoa_to_sheet(transactionTrendsData);
    XLSX.utils.book_append_sheet(wb, trendsSheet, 'Transaction Trends');

    // Transactions by Type Sheet
    const typeData = [
      ['Transactions by Type'],
      ['Type', 'Count', 'Amount'],
      ...this.analyticsData.transactionsByType.map(t => [
        t.type, t.count, t.amount
      ])
    ];
    const typeSheet = XLSX.utils.aoa_to_sheet(typeData);
    XLSX.utils.book_append_sheet(wb, typeSheet, 'By Type');

    // Transactions by Status Sheet
    const statusData = [
      ['Transactions by Status'],
      ['Status', 'Count'],
      ...this.analyticsData.transactionsByStatus.map(t => [
        t.status, t.count
      ])
    ];
    const statusSheet = XLSX.utils.aoa_to_sheet(statusData);
    XLSX.utils.book_append_sheet(wb, statusSheet, 'By Status');

    // Risk Distribution Sheet
    const riskData = [
      ['Risk Distribution'],
      ['Risk Level', 'Count'],
      ...this.analyticsData.riskDistribution.map(r => [
        r.level, r.count
      ])
    ];
    const riskSheet = XLSX.utils.aoa_to_sheet(riskData);
    XLSX.utils.book_append_sheet(wb, riskSheet, 'Risk Distribution');

    // Top High-Value Transactions Sheet
    const highValueData = [
      ['Top High-Value Transactions'],
      ['Transaction ID', 'Amount', 'Currency', 'Risk Score'],
      ...this.analyticsData.topHighValueTransactions.map(t => [
        t.id, t.amount, t.currency, t.riskScore
      ])
    ];
    const highValueSheet = XLSX.utils.aoa_to_sheet(highValueData);
    XLSX.utils.book_append_sheet(wb, highValueSheet, 'High Value Txns');

    // Top Triggered Rules Sheet
    const rulesData = [
      ['Top Triggered Rules'],
      ['Rule Name', 'Count', 'Action'],
      ...this.analyticsData.topTriggeredRules.map(r => [
        r.ruleName, r.count, r.action
      ])
    ];
    const rulesSheet = XLSX.utils.aoa_to_sheet(rulesData);
    XLSX.utils.book_append_sheet(wb, rulesSheet, 'Top Rules');

    // User Growth Sheet
    const userGrowthData = [
      ['User Growth (Last 12 Months)'],
      ['Month', 'New Users', 'Total Users'],
      ...this.analyticsData.userGrowth.map(u => [
        u.month, u.newUsers, u.totalUsers
      ])
    ];
    const userGrowthSheet = XLSX.utils.aoa_to_sheet(userGrowthData);
    XLSX.utils.book_append_sheet(wb, userGrowthSheet, 'User Growth');

    // User Status Sheet
    const userStatusData = [
      ['User Status Distribution'],
      ['Status', 'Count'],
      ...this.analyticsData.userStatusDistribution.map(u => [
        u.status, u.count
      ])
    ];
    const userStatusSheet = XLSX.utils.aoa_to_sheet(userStatusData);
    XLSX.utils.book_append_sheet(wb, userStatusSheet, 'User Status');

    // KYC Status Sheet
    const kycData = [
      ['KYC Verification Status'],
      ['Status', 'Count'],
      ...this.analyticsData.kycStatus.map(k => [
        k.status, k.count
      ])
    ];
    const kycSheet = XLSX.utils.aoa_to_sheet(kycData);
    XLSX.utils.book_append_sheet(wb, kycSheet, 'KYC Status');

    // Top Customers Sheet
    const customersData = [
      ['Top Customers by Transaction Volume'],
      ['Customer Name', 'Transactions', 'Total Amount'],
      ...this.analyticsData.topCustomersByVolume.map(c => [
        c.name, c.transactions, c.amount
      ])
    ];
    const customersSheet = XLSX.utils.aoa_to_sheet(customersData);
    XLSX.utils.book_append_sheet(wb, customersSheet, 'Top Customers');

    // Cases by Officer Sheet
    const casesData = [
      ['Cases by Compliance Officer'],
      ['Officer', 'Resolved', 'Pending'],
      ...this.analyticsData.casesByOfficer.map(c => [
        c.officer, c.resolved, c.pending
      ])
    ];
    const casesSheet = XLSX.utils.aoa_to_sheet(casesData);
    XLSX.utils.book_append_sheet(wb, casesSheet, 'Cases by Officer');

    // Accounts by Type Sheet
    const accountTypeData = [
      ['Accounts by Type'],
      ['Type', 'Count'],
      ...this.analyticsData.accountsByType.map(a => [
        a.type, a.count
      ])
    ];
    const accountTypeSheet = XLSX.utils.aoa_to_sheet(accountTypeData);
    XLSX.utils.book_append_sheet(wb, accountTypeSheet, 'Accounts by Type');

    // Accounts by Currency Sheet
    const accountCurrencyData = [
      ['Accounts by Currency'],
      ['Currency', 'Count'],
      ...this.analyticsData.accountsByCurrency.map(a => [
        a.currency, a.count
      ])
    ];
    const accountCurrencySheet = XLSX.utils.aoa_to_sheet(accountCurrencyData);
    XLSX.utils.book_append_sheet(wb, accountCurrencySheet, 'Accounts by Currency');

    // Activity by Action Sheet
    const activityData = [
      ['System Activity by Action'],
      ['Action', 'Count'],
      ...this.analyticsData.activityByAction.map(a => [
        a.action, a.count
      ])
    ];
    const activitySheet = XLSX.utils.aoa_to_sheet(activityData);
    XLSX.utils.book_append_sheet(wb, activitySheet, 'System Activity');

    // Generate filename with current date
    const date = new Date();
    const filename = `AML_Analytics_Report_${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  }

  refreshData(): void {
    this.loadAnalytics();
  }
}
