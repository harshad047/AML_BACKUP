import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../../core/services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isDropdownOpen = false;
  showLogoutModal = false;
  isTransparent = false;

  private scrollHandler = () => this.updateTransparencyOnScroll();

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

    // Update navbar mode on route changes
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.setInitialTransparency();
    });

    // Initial state and scroll listener
    this.setInitialTransparency();
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.scrollHandler);
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
    this.showLogoutModal = true; // Show modal
  }

  confirmLogout(): void {
    this.showLogoutModal = false;
    this.authService.logout();
  }

  cancelLogout(): void {
    this.showLogoutModal = false;
  }

  private isLandingRoute(): boolean {
    const url = this.router.url.split('?')[0];
    return url === '/' || url === '' || url.startsWith('/login') || url.startsWith('/register');
  }

  private setInitialTransparency(): void {
    // Transparent only on landing routes, and only when at top
    this.isTransparent = this.isLandingRoute() && window.scrollY < 10;
  }

  private updateTransparencyOnScroll(): void {
    if (!this.isLandingRoute()) {
      this.isTransparent = false;
      return;
    }
    this.isTransparent = window.scrollY < 10;
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