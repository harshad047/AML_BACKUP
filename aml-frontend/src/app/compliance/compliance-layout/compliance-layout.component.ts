                                                        import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService, User } from '../../core/services/auth.service';

@Component({
  selector: 'app-compliance-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './compliance-layout.component.html',
  styleUrls: ['./compliance-layout.component.css']
})
export class ComplianceLayoutComponent implements OnInit {
  currentUser: User | null = null;
  sidebarCollapsed = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Auto-collapse on mobile
    if (window.innerWidth <= 768) {
      this.sidebarCollapsed = true;
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
