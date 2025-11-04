import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';

export const COMPLIANCE_ROUTES: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./compliance-dashboard/compliance-dashboard.component').then(m => m.ComplianceDashboardComponent)
      },
      {
        path: 'alerts',
        loadComponent: () => import('./alerts-management/alerts-management.component').then(m => m.AlertsManagementComponent)
      },
      {
        path: 'cases',
        loadComponent: () => import('./case-management/case-management.component').then(m => m.CaseManagementComponent)
      },
      {
        path: 'transactions',
        loadComponent: () => import('./transaction-review/transaction-review.component').then(m => m.TransactionReviewComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./compliance-reports/compliance-reports.component').then(m => m.ComplianceReportsComponent)
      },
      {
        path: 'helpdesk/open',
        loadComponent: () => import('./helpdesk/open-tickets.component').then(m => m.OpenTicketsComponent)
      },
      {
        path: 'helpdesk/tickets/:ticketId',
        loadComponent: () => import('./helpdesk/ticket-thread.component').then(m => m.OfficerTicketThreadComponent)
      },
      {
        path: 'sar-report/:transactionId',
        loadComponent: () => import('./sar-report/sar-report.component').then(m => m.SarReportComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];
