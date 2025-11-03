import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { ComplianceAnalyticsService, ComplianceAnalyticsData } from '../../core/services/compliance-analytics.service';
import * as XLSX from 'xlsx';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-compliance-reports',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgChartsModule],
  templateUrl: './compliance-reports.component.html',
  styleUrls: ['./compliance-reports.component.css']
})
export class ComplianceReportsComponent implements OnInit {
  loading = true;
  error: string | null = null;
  analyticsData: ComplianceAnalyticsData | null = null;

  // Chart data
  alertTrendsChart: ChartConfiguration<'line'>['data'] | null = null;
  alertsByRiskChart: ChartConfiguration<'pie'>['data'] | null = null;
  alertsByTypeChart: ChartConfiguration<'bar'>['data'] | null = null;
  caseStatusChart: ChartConfiguration<'doughnut'>['data'] | null = null;
  casesByOfficerChart: ChartConfiguration<'bar'>['data'] | null = null;
  caseResolutionChart: ChartConfiguration<'line'>['data'] | null = null;
  transactionOutcomesChart: ChartConfiguration<'doughnut'>['data'] | null = null;
  riskDistributionChart: ChartConfiguration<'pie'>['data'] | null = null;
  riskTrendsChart: ChartConfiguration<'line'>['data'] | null = null;
  responseTimeChart: ChartConfiguration<'line'>['data'] | null = null;

  // Chart options
  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' }, tooltip: { enabled: true } }
  };

  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        bottom: 50,
        right: 5
      }
    },
    plugins: { 
      legend: { display: false }, 
      tooltip: { enabled: true } 
    },
    scales: {
      x: {
        ticks: {
          autoSkip: false,
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 11
          },
          padding: 8
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right' }, tooltip: { enabled: true } }
  };

  doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right' }, tooltip: { enabled: true } }
  };

  constructor(private analyticsService: ComplianceAnalyticsService) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.loading = true;
    this.error = null;
    this.analyticsService.getComplianceAnalytics().subscribe({
      next: (data) => {
        console.log('Compliance analytics data loaded:', data);
        this.analyticsData = data;
        this.initializeCharts(data);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading compliance analytics:', error);
        this.error = error.message || 'Failed to load analytics data. Please check if backend APIs are running.';
        this.loading = false;
      }
    });
  }

  initializeCharts(data: ComplianceAnalyticsData): void {
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
          borderColor: '#dc3545',
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
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

    // Alerts by Risk Chart
    this.alertsByRiskChart = {
      labels: data.alertsByRisk.map(r => r.level),
      datasets: [{
        data: data.alertsByRisk.map(r => r.count),
        backgroundColor: ['#dc3545', '#ff9800', '#28a745'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };

    // Alerts by Type Chart
    this.alertsByTypeChart = {
      labels: data.alertsByType.map(t => t.type),
      datasets: [{
        label: 'Count',
        data: data.alertsByType.map(t => t.count),
        backgroundColor: '#17a2b8',
        borderWidth: 0
      }]
    };

    // Case Status Chart
    this.caseStatusChart = {
      labels: data.caseStatusDistribution.map(c => c.status),
      datasets: [{
        data: data.caseStatusDistribution.map(c => c.count),
        backgroundColor: ['#ffc107', '#17a2b8', '#28a745', '#dc3545'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };

    // Cases by Officer Chart
    this.casesByOfficerChart = {
      labels: data.casesByOfficer.map(c => c.officer),
      datasets: [
        {
          label: 'Active',
          data: data.casesByOfficer.map(c => c.active),
          backgroundColor: '#ffc107',
          borderWidth: 0
        },
        {
          label: 'Resolved',
          data: data.casesByOfficer.map(c => c.resolved),
          backgroundColor: '#28a745',
          borderWidth: 0
        }
      ]
    };

    // Case Resolution Time Chart
    this.caseResolutionChart = {
      labels: data.caseResolutionTime.map(c => new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [{
        label: 'Avg Hours to Resolve',
        data: data.caseResolutionTime.map(c => c.avgHours),
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13, 110, 253, 0.1)',
        fill: true,
        tension: 0.4
      }]
    };

    // Transaction Outcomes Chart
    this.transactionOutcomesChart = {
      labels: data.transactionReviewOutcomes.map(t => t.outcome),
      datasets: [{
        data: data.transactionReviewOutcomes.map(t => t.count),
        backgroundColor: ['#28a745', '#dc3545', '#6c757d', '#ffc107'],
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

    // Response Time Chart
    this.responseTimeChart = {
      labels: data.alertResponseTimes.map(t => new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [{
        label: 'Avg Response Time (Hours)',
        data: data.alertResponseTimes.map(t => t.avgHours),
        borderColor: '#6f42c1',
        backgroundColor: 'rgba(111, 66, 193, 0.1)',
        fill: true,
        tension: 0.4
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

    // KPIs Sheet
    const kpiData = [
      ['Compliance Analytics KPIs'],
      ['Metric', 'Value'],
      ['Total Alerts', this.analyticsData.totalAlerts],
      ['Open Alerts', this.analyticsData.openAlerts],
      ['Escalated Alerts', this.analyticsData.escalatedAlerts],
      ['Resolved Alerts', this.analyticsData.resolvedAlerts],
      ['Active Cases', this.analyticsData.activeCases],
      ['Resolved Cases', this.analyticsData.resolvedCases],
      ['Avg Response Time (hrs)', this.analyticsData.averageResponseTime],
      ['SLA Compliance Rate (%)', this.analyticsData.slaComplianceRate]
    ];
    const kpiSheet = XLSX.utils.aoa_to_sheet(kpiData);
    XLSX.utils.book_append_sheet(wb, kpiSheet, 'KPIs');

    // Alert Trends
    const alertTrendsData = [
      ['Alert Trends (Last 7 Days)'],
      ['Date', 'Open', 'Escalated', 'Resolved'],
      ...this.analyticsData.alertTrends.map(t => [t.date, t.open, t.escalated, t.resolved])
    ];
    const alertTrendsSheet = XLSX.utils.aoa_to_sheet(alertTrendsData);
    XLSX.utils.book_append_sheet(wb, alertTrendsSheet, 'Alert Trends');

    // Recent Alerts
    const recentAlertsData = [
      ['Recent Alerts'],
      ['ID', 'Transaction ID', 'Reason', 'Risk Score', 'Status', 'Created At'],
      ...this.analyticsData.recentAlerts.map(a => [a.id, a.transactionId, a.reason, a.riskScore, a.status, a.createdAt])
    ];
    const recentAlertsSheet = XLSX.utils.aoa_to_sheet(recentAlertsData);
    XLSX.utils.book_append_sheet(wb, recentAlertsSheet, 'Recent Alerts');

    // Cases by Officer
    const casesByOfficerData = [
      ['Cases by Officer'],
      ['Officer', 'Active', 'Resolved'],
      ...this.analyticsData.casesByOfficer.map(c => [c.officer, c.active, c.resolved])
    ];
    const casesByOfficerSheet = XLSX.utils.aoa_to_sheet(casesByOfficerData);
    XLSX.utils.book_append_sheet(wb, casesByOfficerSheet, 'Cases by Officer');

    // High Risk Transactions
    const highRiskData = [
      ['High Risk Transactions'],
      ['ID', 'Amount', 'Currency', 'Risk Score', 'Status'],
      ...this.analyticsData.highRiskTransactions.map(t => [t.id, t.amount, t.currency, t.riskScore, t.status])
    ];
    const highRiskSheet = XLSX.utils.aoa_to_sheet(highRiskData);
    XLSX.utils.book_append_sheet(wb, highRiskSheet, 'High Risk Txns');

  
    

  

    // Generate filename
    const date = new Date();
    const filename = `Compliance_Analytics_Report_${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  }

  refreshData(): void {
    this.loadAnalytics();
  }
}
