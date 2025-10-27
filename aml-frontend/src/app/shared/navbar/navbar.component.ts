import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
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