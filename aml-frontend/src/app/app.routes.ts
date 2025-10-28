import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { OtpVerificationComponent } from './auth/otp-verification/otp-verification.component';
import { CustomerDashboardComponent } from './customer/customer-dashboard/customer-dashboard.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { ComplianceDashboardComponent } from './compliance/compliance-dashboard/compliance-dashboard.component';
import { AlertsManagementComponent } from './compliance/alerts-management/alerts-management.component';
import { TransactionReviewComponent } from './compliance/transaction-review/transaction-review.component';
import { CaseManagementComponent } from './compliance/case-management/case-management.component';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { CustomerDocumentsComponent } from './customer/customer-documents/customer-documents.component';
import { CustomerTransactionsComponent } from './customer/customer-transactions/customer-transactions.component';
import { CustomerOpenAccountComponent } from './customer/open-account/customer-open-account.component';
import { CustomerNewTransactionComponent } from './customer/new-transaction/customer-new-transaction.component';
import { CustomerAlertsComponent } from './customer/customer-alerts/customer-alerts.component';
import { ProfileComponent } from './customer/profile/profile.component';
import { ChangePasswordComponent } from './customer/change-password/change-password.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'otp-verification', component: OtpVerificationComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'customer',
    component: CustomerDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['CUSTOMER'] }
  },
  {
    path: 'customer/documents',
    component: CustomerDocumentsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['CUSTOMER'] }
  },
  {
    path: 'customer/transactions',
    component: CustomerTransactionsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['CUSTOMER'] }
  },
  {
    path: 'customer/open-account',
    component: CustomerOpenAccountComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['CUSTOMER'] }
  },
  {
    path: 'customer/new-transaction',
    component: CustomerNewTransactionComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['CUSTOMER'] }
  },
  {
    path: 'customer/alerts',
    component: CustomerAlertsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['CUSTOMER'] }
  },
  {
    path: 'customer/profile',
    component: ProfileComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['CUSTOMER'] }
  },
  {
    path: 'customer/change-password',
    component: ChangePasswordComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['CUSTOMER'] }
  },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN', 'SUPER_ADMIN'] }
  },
  {
    path: 'compliance',
    component: ComplianceDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['OFFICER'] }
  },
  {
    path: 'compliance/alerts',
    component: AlertsManagementComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['OFFICER'] }
  },
  {
    path: 'compliance/transactions',
    component: TransactionReviewComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['OFFICER'] }
  },
  {
    path: 'compliance/cases',
    component: CaseManagementComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['OFFICER'] }
  },
  { path: '**', redirectTo: '/login' }
];
