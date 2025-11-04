import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./customer-dashboard/customer-dashboard.component').then(m => m.CustomerDashboardComponent)
      },
      {
        path: 'accounts/create',
        loadComponent: () => import('./open-account/customer-open-account.component').then(m => m.CustomerOpenAccountComponent)
      },
      {
        path: 'transactions',
        loadComponent: () => import('./customer-transactions/customer-transactions.component').then(m => m.CustomerTransactionsComponent)
      },
      {
        path: 'transactions/new',
        loadComponent: () => import('./new-transaction/customer-new-transaction.component').then(m => m.CustomerNewTransactionComponent)
      },
      {
        path: 'documents',
        loadComponent: () => import('./customer-documents/customer-documents.component').then(m => m.CustomerDocumentsComponent)
      },
      {
        path: 'alerts',
        loadComponent: () => import('./customer-alerts/customer-alerts.component').then(m => m.CustomerAlertsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'change-password/verify',
        loadComponent: () => import('./change-password/verify-otp.component').then(m => m.VerifyOtpComponent)
      },
      {
        path: 'change-password/enter-otp',
        loadComponent: () => import('./change-password/enter-otp.component').then(m => m.EnterOtpComponent)
      },
      {
        path: 'change-password',
        loadComponent: () => import('./change-password/change-password.component').then(m => m.ChangePasswordComponent)
      },
      {
        path: 'helpdesk/tickets',
        loadComponent: () => import('./helpdesk/my-tickets.component').then(m => m.MyTicketsComponent)
      },
      {
        path: 'helpdesk/ticket/:id',
        loadComponent: () => import('./helpdesk/ticket-thread.component').then(m => m.CustomerTicketThreadComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];
