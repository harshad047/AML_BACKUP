import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container-fluid">
        <a class="navbar-brand fw-bold" href="#">
          <i class="fas fa-shield-alt me-2"></i>
          AML Compliance System
        </a>

        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto" *ngIf="currentUser">
            <!-- Customer Navigation -->
            <ng-container *ngIf="currentUser.role === 'CUSTOMER'">
              <li class="nav-item">
                <a class="nav-link" routerLink="/customer" routerLinkActive="active">
                  <i class="fas fa-tachometer-alt me-1"></i>
                  Dashboard
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/customer/documents" routerLinkActive="active">
                  <i class="fas fa-file-alt me-1"></i>
                  Documents
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/customer/transactions" routerLinkActive="active">
                  <i class="fas fa-credit-card me-1"></i>
                  Transactions
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/customer/open-account" routerLinkActive="active">
                  <i class="fas fa-university me-1"></i>
                  Open Account
                </a>
              </li>
            </ng-container>

            <!-- Admin Navigation -->
            <ng-container *ngIf="currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN'">
              <li class="nav-item">
                <a class="nav-link" routerLink="/admin" routerLinkActive="active">
                  <i class="fas fa-tachometer-alt me-1"></i>
                  Dashboard
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/admin" routerLinkActive="active">
                  <i class="fas fa-users me-1"></i>
                  Users
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/admin" routerLinkActive="active">
                  <i class="fas fa-cog me-1"></i>
                  Rules
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/admin" routerLinkActive="active">
                  <i class="fas fa-exchange-alt me-1"></i>
                  Transactions
                </a>
              </li>
            </ng-container>

            <!-- Compliance Officer Navigation -->
            <ng-container *ngIf="currentUser.role === 'OFFICER'">
              <li class="nav-item">
                <a class="nav-link" routerLink="/compliance" routerLinkActive="active">
                  <i class="fas fa-tachometer-alt me-1"></i>
                  Dashboard
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/compliance" routerLinkActive="active">
                  <i class="fas fa-exclamation-triangle me-1"></i>
                  Alerts
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/compliance" routerLinkActive="active">
                  <i class="fas fa-search me-1"></i>
                  Investigations
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/compliance" routerLinkActive="active">
                  <i class="fas fa-exchange-alt me-1"></i>
                  Transactions
                </a>
              </li>
            </ng-container>
          </ul>

          <ul class="navbar-nav" *ngIf="currentUser">
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown">
                <i class="fas fa-user me-1"></i>
                {{ currentUser.firstName }} {{ currentUser.lastName }}
              </a>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="#"><i class="fas fa-user me-2"></i>Profile</a></li>
                <li><a class="dropdown-item" href="#"><i class="fas fa-cog me-2"></i>Settings</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#" (click)="logout()">
                  <i class="fas fa-sign-out-alt me-2"></i>Logout
                </a></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar-brand {
      font-size: 1.25rem;
    }

    .nav-link {
      font-weight: 500;
    }

    .nav-link.active {
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 0.25rem;
    }

    .dropdown-menu {
      border: none;
      box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    }

    .dropdown-item:hover {
      background-color: #f8f9fa;
    }
  `]
})
export class NavbarComponent implements OnInit {
  currentUser: User | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user: User | null) => {
      this.currentUser = user;
    });
  }

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
    }
  }
}
