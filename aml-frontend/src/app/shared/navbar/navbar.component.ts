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

        <!-- Mobile toggler button -->
        <button class="navbar-toggler" type="button" (click)="toggleNavbar($event)" [attr.aria-expanded]="!isNavbarCollapsed" aria-controls="navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>

        <!-- Collapsible content -->
        <div class="collapse navbar-collapse" id="navbarNav" [class.show]="!isNavbarCollapsed">
          <div class="d-flex justify-content-between w-100">
            <!-- Left-side navigation links -->
            <ul class="navbar-nav me-auto" *ngIf="currentUser">
              <ng-container *ngIf="currentUser.role === 'CUSTOMER'">
                <li class="nav-item">
                  <a class="nav-link" routerLink="/customer" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeNavbar()">
                    <i class="fas fa-tachometer-alt me-1"></i> Dashboard
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/customer/documents" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeNavbar()">
                    <i class="fas fa-file-alt me-1"></i> Documents
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/customer/transactions" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeNavbar()">
                    <i class="fas fa-credit-card me-1"></i> Transactions
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/customer/open-account" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeNavbar()">
                    <i class="fas fa-university me-1"></i> Open Account
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/customer/alerts" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeNavbar()">
                    <i class="fas fa-bell me-1"></i> My Alerts
                  </a>
                </li>
              </ng-container>

              <ng-container *ngIf="currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN'">
                <li class="nav-item">
                  <a class="nav-link" routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeNavbar()">
                    <i class="fas fa-tachometer-alt me-1"></i> Dashboard
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/admin/customers" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeNavbar()">
                    <i class="fas fa-users me-1"></i> Customers
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/admin/rules" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeNavbar()">
                    <i class="fas fa-cog me-1"></i> Rules
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/admin/transactions" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeNavbar()">
                    <i class="fas fa-exchange-alt me-1"></i> Transactions
                  </a>
                </li>
              </ng-container>

              <ng-container *ngIf="currentUser.role === 'OFFICER'">
                <li class="nav-item">
                  <a class="nav-link" routerLink="/compliance" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeNavbar()">
                    <i class="fas fa-tachometer-alt me-1"></i> Dashboard
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/compliance/alerts" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeNavbar()">
                    <i class="fas fa-exclamation-triangle me-1"></i> Alerts
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/compliance/investigations" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeNavbar()">
                    <i class="fas fa-search me-1"></i> Investigations
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/compliance/transactions" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeNavbar()">
                    <i class="fas fa-exchange-alt me-1"></i> Transactions
                  </a>
                </li>
              </ng-container>
            </ul>

            <!-- Right-side user menu -->
            <div class="d-flex align-items-center">
              <ul class="navbar-nav" *ngIf="currentUser">
                <li class="nav-item dropdown">
                  <!-- User dropdown toggle -->
                  <a class="nav-link dropdown-toggle d-flex align-items-center" id="userDropdown" role="button" (click)="toggleUserDropdown($event)" [attr.aria-expanded]="isUserDropdownOpen" [class.show]="isUserDropdownOpen">
                    <i class="fas fa-user-circle me-2"></i>
                    <span class="d-none d-sm-inline">{{ currentUser.firstName }} {{ currentUser.lastName }}</span>
                    <span class="d-sm-none d-inline">Account</span>
                  </a>
                  <!-- User dropdown menu -->
                  <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown" [class.show]="isUserDropdownOpen">
                    <li>
                      <a class="dropdown-item" routerLink="/customer/profile" (click)="closeUserDropdown()">
                        <i class="fas fa-user me-2"></i>Profile
                      </a>
                    </li>
                    <li>
                      <a class="dropdown-item" routerLink="/customer/change-password" (click)="closeUserDropdown()">
                        <i class="fas fa-key me-2"></i>Change Password
                      </a>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                      <a class="dropdown-item text-danger" (click)="logout($event)">
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
    .navbar-toggler {
      border-color: rgba(255, 255, 255, 0.1);
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
      cursor: pointer; /* Added for links that are now click handlers */
    }
    .nav-link:hover {
      color: white !important;
      background-color: rgba(255, 255, 255, 0.1);
    }
    .nav-link.active {
      background-color: rgba(255, 255, 255, 0.2);
      color: white !important;
    }
    
    /* This rule anchors the dropdown menu to its parent item */
    .nav-item.dropdown {
      position: relative;
    }

    /* --- DROPDOWN STYLES (Simplified) --- */
    .dropdown-toggle::after {
        transition: transform 0.3s ease;
    }
    .dropdown-toggle[aria-expanded="true"]::after {
        transform: rotate(180deg);
    }
    .dropdown-menu {
        border-radius: 0.5rem;
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
        border: 1px solid rgba(0,0,0,.1);
        padding: 0.5rem 0;
        /* Handle visibility with .show class */
        display: none; 
        position: absolute; /* Ensure it's positioned correctly */
        z-index: 1000; /* Ensure dropdown appears on top of other content */
    }

    /* This is the key class Bootstrap JS would have added */
    .dropdown-menu.show {
        display: block;
    }

    .dropdown-item {
      padding: 0.5rem 1.25rem;
      font-weight: 400;
      color: #212529;
      text-decoration: none;
      background-color: transparent;
      transition: all 0.2s ease-in-out;
      cursor: pointer; /* Added for links that are now click handlers */
    }
    .dropdown-item:hover,
    .dropdown-item:focus {
      color: #1e2125;
      background-color: #f8f9fa;
    }

    /* Ensure dropdown icons take up space even if font fails */
    .dropdown-item i {
      display: inline-block; /* <-- ADDED */
      width: 1.25rem;
      text-align: center;
      margin-right: 0.5rem;
    }
    /* Ensure user circle icon takes up space */
    .nav-link .fa-user-circle {
      display: inline-block; /* <-- ADDED */
    }

    .dropdown-item.text-danger {
      color: #dc3545 !important;
    }
    .dropdown-item.text-danger:hover {
      background-color: #dc3545;
      color: #ffffff !important;
    }
    .dropdown-divider {
      margin: 0.5rem 0;
      border-top: 1px solid #e9ecef;
    }

    /* Styles for mobile navbar collapse (Bootstrap defaults) */
    @media (max-width: 991.98px) {
      .navbar-collapse {
        /* display: none; */ /* Handled by .collapse */
        width: 100%;
      }
      .navbar-collapse.show {
        /* display: block; */ /* Handled by .collapse.show */
      }
      .navbar-nav {
        width: 100%;
      }
      .dropdown-menu {
        position: static; /* Make dropdown static in mobile view */
        float: none;
        z-index: auto; /* Reset z-index for static positioning */
      }
    }
  `]
})
export class NavbarComponent implements OnInit {
  currentUser: User | null = null;
  isUserDropdownOpen = false;
  isNavbarCollapsed = true; // Start with navbar collapsed

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user: User | null) => {
      this.currentUser = user;
    });
  }

  // Toggle for the mobile navbar
  toggleNavbar(event: Event): void {
    event.preventDefault();
    this.isNavbarCollapsed = !this.isNavbarCollapsed;
    this.isUserDropdownOpen = false; // Close user dropdown when toggling navbar
  }

  // Close mobile navbar (e.g., after clicking a link)
  closeNavbar(): void {
    this.isNavbarCollapsed = true;
    this.isUserDropdownOpen = false;
  }

  // Toggle for the user account dropdown
  toggleUserDropdown(event: Event): void {
    event.preventDefault();
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
    // On mobile, ensure navbar is open to show dropdown
    if (!this.isNavbarCollapsed && !this.isUserDropdownOpen) {
       // if navbar is open and we are closing dropdown, do nothing special
    } else if (this.isNavbarCollapsed) {
       // if navbar is collapsed, opening dropdown should not open navbar
    }
  }

  // Close user dropdown (e.g., after clicking a link)
  closeUserDropdown(): void {
    this.isUserDropdownOpen = false;
    this.isNavbarCollapsed = true; // Also close mobile menu
  }

  logout(event: Event): void {
    event.preventDefault();
    // Removed the 'confirm' dialog as it is not supported.
    this.closeUserDropdown(); // Close dropdown
    this.authService.logout();
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
}

