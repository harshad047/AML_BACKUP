import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark">
      <div class="container-fluid">
        <a class="navbar-brand" [routerLink]="currentUser ? dashboardRoute : '/login'" routerLinkActive="active" [routerLinkActiveOptions]="{exact: brandExactMatch}">
          <i class="fas fa-shield-alt me-2"></i>
          AML System
        </a>

        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarNav">
          <div class="d-flex justify-content-between w-100">
            <ul class="navbar-nav me-auto" *ngIf="currentUser">
              <ng-container *ngIf="currentUser.role === 'CUSTOMER'">
                <li class="nav-item">
                  <a class="nav-link" routerLink="/customer" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
                    <i class="fas fa-tachometer-alt me-1"></i> Dashboard
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/customer/documents" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
                    <i class="fas fa-file-alt me-1"></i> Documents
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/customer/transactions" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
                    <i class="fas fa-credit-card me-1"></i> Transactions
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/customer/open-account" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
                    <i class="fas fa-university me-1"></i> Open Account
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/customer/alerts" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
                    <i class="fas fa-bell me-1"></i> My Alerts
                  </a>
                </li>
              </ng-container>

              <ng-container *ngIf="currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN'">
                <li class="nav-item">
                  <a class="nav-link" routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
                    <i class="fas fa-tachometer-alt me-1"></i> Dashboard
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/admin/customers" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
                    <i class="fas fa-users me-1"></i> Customers
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/admin/rules" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
                    <i class="fas fa-cog me-1"></i> Rules
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/admin/transactions" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
                    <i class="fas fa-exchange-alt me-1"></i> Transactions
                  </a>
                </li>
              </ng-container>

              <ng-container *ngIf="currentUser.role === 'OFFICER'">
                <li class="nav-item">
                  <a class="nav-link" routerLink="/compliance" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
                    <i class="fas fa-tachometer-alt me-1"></i> Dashboard
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/compliance/alerts" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
                    <i class="fas fa-exclamation-triangle me-1"></i> Alerts
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/compliance/cases" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
                    <i class="fas fa-search me-1"></i> Investigations
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/compliance/transactions" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
                    <i class="fas fa-exchange-alt me-1"></i> Transactions
                  </a>
                </li>
              </ng-container>
            </ul>

            <div class="d-flex align-items-center">
              <ul class="navbar-nav" *ngIf="currentUser">
                <li class="nav-item dropdown" [class.show]="isDropdownOpen">
                  <a class="nav-link dropdown-toggle d-flex align-items-center user-menu" 
                     href="#" 
                     id="userDropdown" 
                     role="button" 
                     (click)="toggleDropdown($event)"
                     [attr.aria-expanded]="isDropdownOpen">
                    <i class="fas fa-user-circle me-2 user-icon"></i>
                    <span class="d-none d-sm-inline user-name">{{ currentUser.firstName }} {{ currentUser.lastName }}</span>
                    <span class="d-sm-none d-inline">Account</span>
                  </a>
                  <ul class="dropdown-menu dropdown-menu-end shadow-lg" 
                      [class.show]="isDropdownOpen"
                      aria-labelledby="userDropdown">
                    <!-- User Info Header -->
                    <li class="dropdown-header">
                      <div class="user-info">
                        <i class="fas fa-user-circle fa-2x mb-2"></i>
                        <div class="fw-bold">{{ currentUser.firstName }} {{ currentUser.lastName }}</div>
                        <small class="text-muted">{{ currentUser.email }}</small>
                        <div class="mt-1">
                          <span class="badge bg-primary">{{ getRoleDisplayName(currentUser.role) }}</span>
                        </div>
                      </div>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    
                    <!-- Customer Menu Items -->
                    <ng-container *ngIf="currentUser.role === 'CUSTOMER'">
                      <li>
                        <a class="dropdown-item" routerLink="/customer/profile" (click)="closeDropdown()">
                          <i class="fas fa-user me-2"></i>My Profile
                        </a>
                      </li>
                      <li>
                        <a class="dropdown-item" routerLink="/customer/change-password" (click)="closeDropdown()">
                          <i class="fas fa-key me-2"></i>Change Password
                        </a>
                      </li>
                    </ng-container>
                    
                    <!-- Officer Menu Items -->
                    <ng-container *ngIf="currentUser.role === 'OFFICER'">
                      <li>
                        <a class="dropdown-item" routerLink="/compliance" (click)="closeDropdown()">
                          <i class="fas fa-tachometer-alt me-2"></i>Dashboard
                        </a>
                      </li>
                      <li>
                        <a class="dropdown-item" routerLink="/compliance/alerts" (click)="closeDropdown()">
                          <i class="fas fa-exclamation-triangle me-2"></i>Alerts
                        </a>
                      </li>
                      <li>
                        <a class="dropdown-item" routerLink="/compliance/cases" (click)="closeDropdown()">
                          <i class="fas fa-search me-2"></i>Investigations
                        </a>
                      </li>
                      <li>
                        <a class="dropdown-item" routerLink="/compliance/transactions" (click)="closeDropdown()">
                          <i class="fas fa-exchange-alt me-2"></i>Transactions
                        </a>
                      </li>
                    </ng-container>
                    
                    <!-- Admin Menu Items -->
                    <ng-container *ngIf="currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN'">
                      <li>
                        <a class="dropdown-item" routerLink="/admin" (click)="closeDropdown()">
                          <i class="fas fa-tachometer-alt me-2"></i>Dashboard
                        </a>
                      </li>
                      <li>
                        <a class="dropdown-item" routerLink="/admin/customers" (click)="closeDropdown()">
                          <i class="fas fa-users me-2"></i>Customers
                        </a>
                      </li>
                      <li>
                        <a class="dropdown-item" routerLink="/admin/rules" (click)="closeDropdown()">
                          <i class="fas fa-cog me-2"></i>Rules
                        </a>
                      </li>
                    </ng-container>
                    
                    <li><hr class="dropdown-divider"></li>
                    
                    <!-- Logout (Common for all) -->
                    <li>
                      <a class="dropdown-item text-danger logout-item" href="#" (click)="logout($event)">
                        <i class="fas fa-sign-out-alt me-2"></i>Logout
                      </a>
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    /* --- NAVBAR STYLES (Unchanged) --- */
    .navbar {
      background: linear-gradient(135deg, #0d6efd 0%, #0056b3 100%);
      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    }
    .navbar-brand {
      font-size: 1.5rem;
      font-weight: 700;
      color: white !important;
    }
    .navbar-toggler-icon {
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%28255, 255, 255, 0.9%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
    }
    .nav-link {
      color: rgba(255, 255, 255, 0.9) !important;
      transition: all 0.3s ease;
      position: relative;
      margin: 0 0.25rem;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
    }
    .nav-link:hover {
      color: white !important;
      background-color: rgba(255, 255, 255, 0.1);
    }
    .nav-link.active {
      background-color: rgba(255, 255, 255, 0.2);
      color: white !important;
    }
    
    /* --- USER MENU STYLES --- */
    .user-menu {
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 0.5rem;
      padding: 0.5rem 1rem !important;
    }
    
    .user-menu:hover {
      background-color: rgba(255, 255, 255, 0.2) !important;
    }
    
    .user-icon {
      font-size: 1.5rem;
    }
    
    .user-name {
      font-weight: 500;
    }
    
    /* --- DROPDOWN STYLES --- */
    .dropdown-toggle::after {
        transition: transform 0.3s ease;
    }
    .dropdown-toggle[aria-expanded="true"]::after {
        transform: rotate(180deg);
    }
    .dropdown-menu {
        border-radius: 0.75rem;
        box-shadow: 0 0.5rem 2rem rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(0,0,0,.1);
        padding: 0;
        min-width: 280px;
        margin-top: 0.5rem;
    }
    
    /* User Info Header */
    .dropdown-header {
      padding: 0;
      background: linear-gradient(135deg, #0d6efd 0%, #0056b3 100%);
      color: white;
      border-radius: 0.75rem 0.75rem 0 0;
    }
    
    .user-info {
      text-align: center;
      padding: 1.5rem 1rem;
    }
    
    .user-info i {
      color: rgba(255, 255, 255, 0.9);
    }
    
    .user-info .fw-bold {
      font-size: 1.1rem;
      margin-bottom: 0.25rem;
    }
    
    .user-info small {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.85rem;
    }
    
    .user-info .badge {
      font-size: 0.75rem;
      padding: 0.35rem 0.75rem;
      background-color: rgba(255, 255, 255, 0.2) !important;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    
    /* Dropdown Items */
    .dropdown-item {
      padding: 0.75rem 1.25rem;
      font-weight: 400;
      color: #212529;
      text-decoration: none;
      background-color: transparent;
      transition: all 0.2s ease-in-out;
      display: flex;
      align-items: center;
    }
    .dropdown-item:hover,
    .dropdown-item:focus {
      color: #0d6efd;
      background-color: #f8f9fa;
      padding-left: 1.5rem;
    }
    .dropdown-item i {
      width: 1.5rem;
      text-align: center;
      margin-right: 0.75rem;
      font-size: 1rem;
    }
    
    /* Logout Item */
    .logout-item {
      font-weight: 500;
    }
    
    .logout-item:hover {
      background-color: #dc3545 !important;
      color: #ffffff !important;
    }
    
    .logout-item:hover i {
      color: #ffffff !important;
    }
    
    .dropdown-divider {
      margin: 0;
      border-top: 1px solid #e9ecef;
    }
  `]
})
export class NavbarComponent implements OnInit {
  currentUser: User | null = null;
  isDropdownOpen = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user: User | null) => {
      this.currentUser = user;
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown')) {
        this.isDropdownOpen = false;
      }
    });
  }

  toggleDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  logout(event: Event): void {
    event.preventDefault();
    this.isDropdownOpen = false; // Close dropdown
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
    }
  }

  get dashboardRoute(): string {
    if (this.currentUser) {
      switch (this.currentUser.role) {
        case 'CUSTOMER': return '/customer';
        case 'OFFICER': return '/compliance';
        case 'ADMIN': case 'SUPER_ADMIN': return '/admin';
        default: return '/login';
      }
    }
    return '/login';
  }

  get brandExactMatch(): boolean {
    if (this.currentUser) {
      switch (this.currentUser.role) {
        case 'CUSTOMER': return this.router.url === '/customer';
        case 'OFFICER': return this.router.url === '/compliance';
        case 'ADMIN': case 'SUPER_ADMIN': return this.router.url === '/admin';
        default: return false;
      }
    }
    return false;
  }

  getRoleDisplayName(role: string): string {
    switch (role) {
      case 'CUSTOMER': return 'Customer';
      case 'OFFICER': return 'Compliance Officer';
      case 'ADMIN': return 'Administrator';
      case 'SUPER_ADMIN': return 'Super Admin';
      default: return role;
    }
  }
}