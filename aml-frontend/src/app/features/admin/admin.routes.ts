import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'users/:id',
        loadComponent: () => import('./user-details/user-details.component').then(m => m.AdminUserDetailsComponent)
      },
      {
        path: 'manage-users',
        loadComponent: () => import('./manage-users/manage-users.component').then(m => m.ManageUsersComponent)
      },
      {
        path: 'customers',
        loadComponent: () => import('./customers/customers.component').then(m => m.AdminCustomersComponent)
      },
      {
        path: 'accounts',
        loadComponent: () => import('./accounts/accounts.component').then(m => m.AccountsComponent)
      },
      {
        path: 'transactions',
        loadComponent: () => import('./transactions/transactions.component').then(m => m.AdminTransactionsComponent)
      },
      {
        path: 'kyc-verification',
        loadComponent: () => import('./kyc-verification/kyc-verification.component').then(m => m.KycVerificationComponent)
      },
      {
        path: 'rules',
        loadComponent: () => import('./rules/rules.component').then(m => m.RulesComponent)
      },
      {
        path: 'keywords',
        loadComponent: () => import('./keywords/keywords.component').then(m => m.KeywordsComponent)
      },
      {
        path: 'country-risks',
        loadComponent: () => import('./country-risks/country-risks.component').then(m => m.CountryRisksComponent)
      },
      {
        path: 'compliance-officers',
        loadComponent: () => import('./compliance-officers/compliance-officers.component').then(m => m.ComplianceOfficersComponent)
      },
      {
        path: 'audit-logs',
        loadComponent: () => import('./audit-logs/audit-logs.component').then(m => m.AuditLogsComponent)
      },
      {
        path: 'reports-analytics',
        loadComponent: () => import('./reports-analytics/reports-analytics.component').then(m => m.ReportsAnalyticsComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];
